import test from "node:test";
import assert from "node:assert/strict";

import { ActionTypes, DEMO_DATA_VERSION, Roles } from "../src/core/constants.js";
import { GLCoreEngine } from "../src/core/gl-core-engine.js";
import { FinancePermissions, getVisibleModules, modulesConfig, permissionsForRole } from "../src/core/modules-config.js";
import { StateStore } from "../src/core/state-store.js";
import { parsePayload } from "../src/ui/action-handler.js";
import { menuForRole, viewAllowedForRole } from "../src/ui/role-config.js";
import { renderApp, selectedTransport } from "../src/ui/renderers.js";

function memoryStore() {
  let state = null;
  return {
    load() {
      if (state) return JSON.parse(JSON.stringify(state));
      return new StateStore("__unused__").reset();
    },
    save(nextState) {
      state = JSON.parse(JSON.stringify(nextState));
    },
    reset() {
      state = new StateStore("__unused__").reset();
      return state;
    }
  };
}

function moduleIdsFor(role) {
  return getVisibleModules({ role }, role).map((module) => module.id);
}

function renderRoleView(role, view = "dashboard", route = "/dashboard") {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role }, { demoOnly: true });
  engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route });
  return renderApp(engine.getSnapshot(), engine);
}

test("permissions deny a driver from releasing payment", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  const result = engine.explainAction(ActionTypes.RELEASE_PAYMENT, { transportId: "tr-1001" });
  assert.equal(result.ok, false);
});

test("workflow blocks payment release before required documents", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const result = engine.explainAction(ActionTypes.RELEASE_PAYMENT, { transportId: "tr-1001" });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.join(" ").includes("delivery"));
});

test("selectedTransport returns null for an empty transport list", () => {
  assert.equal(selectedTransport({ transports: [], session: { selectedTransportId: "missing" } }), null);
});

test("StateStore resets stale localStorage demo data", () => {
  const values = new Map([
    ["gl-test", JSON.stringify({ schemaVersion: 1, demoDataVersion: 1, transports: [] })]
  ]);
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key)
    }
  };
  const store = new StateStore("gl-test");
  const state = store.load();
  assert.equal(state.demoDataVersion, DEMO_DATA_VERSION);
  assert.ok(state.transports.length > 0);
  assert.equal(values.has("gl-test"), false);
  delete global.window;
});

test("parsePayload reports invalid payload instead of returning an empty object", () => {
  const result = parsePayload("%E0%A4%A");
  assert.equal(result.ok, false);
  assert.match(result.error, /payload/i);
});

test("payload errors are audited as errors", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const result = engine.dispatchAction(ActionTypes.PUBLISH_LOAD, {}, { payloadError: "bad json" });
  assert.equal(result.ok, false);
  assert.equal(engine.state.audit[0].result, "error");
  assert.equal(engine.state.audit[0].requestedAction, ActionTypes.PUBLISH_LOAD);
});

test("roleConfig drives one menu and hides unrelated modules", () => {
  const driverMenu = menuForRole(Roles.DRIVER).map((item) => item.id);
  const ownerMenu = menuForRole(Roles.PLATFORM_OWNER).map((item) => item.id);

  assert.ok(driverMenu.includes("gps"));
  assert.ok(driverMenu.includes("documents"));
  assert.equal(driverMenu.includes("platform_wallet"), false);
  assert.equal(driverMenu.includes("billing"), false);
  assert.equal(driverMenu.includes("invoices"), false);
  assert.equal(driverMenu.includes("audit"), false);
  assert.ok(ownerMenu.includes("platform_wallet"));
  assert.equal(viewAllowedForRole(Roles.DRIVER, "platform_wallet", "/wallet"), false);
});

test("every role lands on the same main Dashboard", () => {
  [
    Roles.DRIVER,
    Roles.CLIENT_OWNER,
    Roles.CARRIER_OWNER,
    Roles.WAREHOUSE_WORKER,
    Roles.INSURANCE_PARTNER,
    Roles.WORKSHOP,
    Roles.PLATFORM_OWNER
  ].forEach((role) => {
    const html = renderRoleView(role);
    assert.ok(html.includes("Jedna aplikacja modulowa"), role);
    assert.ok(html.includes("Menu modulow"), role);
    assert.equal(html.includes("Panel kierowcy"), false, role);
    assert.equal(html.includes("Panel przewoznika"), false, role);
    assert.equal(html.includes("Panel ubezpieczen"), false, role);
    assert.equal(html.includes("driver-workspace"), false, role);
  });
});

test("driver sees only driver modules and no role panel", () => {
  const modules = moduleIdsFor(Roles.DRIVER);
  const html = renderRoleView(Roles.DRIVER);

  assert.ok(modules.includes("dashboard"));
  assert.ok(modules.includes("gps"));
  assert.ok(modules.includes("photos"));
  assert.ok(modules.includes("parking"));
  assert.equal(modules.includes("driver-panel"), false);
  assert.equal(modules.includes("wallet"), false);
  assert.equal(modules.includes("billing"), false);
  assert.equal(modules.includes("invoices"), false);
  assert.equal(modules.includes("academy"), false);
  assert.equal(html.includes("driver-workspace"), false);
});

test("insurer sees policy, claim, risk, document and policy billing modules", () => {
  const modules = moduleIdsFor(Roles.INSURANCE_PARTNER);
  const html = renderRoleView(Roles.INSURANCE_PARTNER);

  assert.ok(modules.includes("policies"));
  assert.ok(modules.includes("claims"));
  assert.ok(modules.includes("risk"));
  assert.ok(modules.includes("documents"));
  assert.ok(modules.includes("billing"));
  assert.equal(modules.includes("wallet"), false);
  assert.equal(html.includes("Panel ubezpieczen"), false);
});

test("workshop sees service orders, invoices and billing without a separate panel", () => {
  const modules = moduleIdsFor(Roles.WORKSHOP);
  const html = renderRoleView(Roles.WORKSHOP);

  assert.ok(modules.includes("service-orders"));
  assert.ok(modules.includes("invoices"));
  assert.ok(modules.includes("billing"));
  assert.equal(modules.includes("wallet"), false);
  assert.equal(html.includes("Panel warsztatu"), false);
  assert.equal(html.includes("Panel serwisu"), false);
});

test("admin and platform_owner see every configured module", () => {
  assert.equal(moduleIdsFor(Roles.PLATFORM_OWNER).length, modulesConfig.length);
  assert.equal(moduleIdsFor(Roles.ADMIN).length, modulesConfig.length);
});

test("academy student sees academy and profile only with dashboard", () => {
  const modules = moduleIdsFor(Roles.ACADEMY_STUDENT);

  assert.deepEqual(modules, ["dashboard", "academy", "profile"]);
});

test("permission guard blocks direct route access", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "platform_wallet", route: "/wallet" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, false);
  assert.equal(engine.state.session.deniedView, "platform_wallet");
  assert.ok(html.includes("AccessDenied"));
  assert.ok(html.includes("Brak dostepu do modulu"));
});

test("legacy role panel routes are blocked by PermissionGuard", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "driver_mobile", route: "/kierowca" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, false);
  assert.ok(html.includes("AccessDenied"));
});

test("changing active role changes visible modules without changing dashboard structure", () => {
  const driverModules = moduleIdsFor(Roles.DRIVER);
  const ownerModules = moduleIdsFor(Roles.PLATFORM_OWNER);
  const driverDashboard = renderRoleView(Roles.DRIVER);
  const ownerDashboard = renderRoleView(Roles.PLATFORM_OWNER);

  assert.equal(driverModules.includes("wallet"), false);
  assert.equal(ownerModules.includes("wallet"), true);
  assert.ok(ownerModules.length > driverModules.length);
  assert.ok(driverDashboard.includes("Jedna aplikacja modulowa"));
  assert.ok(ownerDashboard.includes("Jedna aplikacja modulowa"));
});

test("platform owner sees full GL Wallet with platform permissions", () => {
  const modules = moduleIdsFor(Roles.PLATFORM_OWNER);
  const permissions = permissionsForRole(Roles.PLATFORM_OWNER);
  const html = renderRoleView(Roles.PLATFORM_OWNER, "platform_wallet", "/wallet");

  assert.ok(modules.includes("wallet"));
  assert.ok(permissions.includes(FinancePermissions.WALLET_PLATFORM_READ));
  assert.ok(permissions.includes(FinancePermissions.WALLET_PLATFORM_MANAGE));
  assert.ok(html.includes("Dashboard Wallet"));
  assert.ok(html.includes("Saldo systemu"));
  assert.ok(html.includes("GLW-SYSTEM"));
});

test("carrier and client use billing modules instead of separate panels", () => {
  const carrierModules = moduleIdsFor(Roles.CARRIER_OWNER);
  const clientModules = moduleIdsFor(Roles.CLIENT_OWNER);
  const carrierHtml = renderRoleView(Roles.CARRIER_OWNER, "billing", "/billing");
  const clientHtml = renderRoleView(Roles.CLIENT_OWNER, "invoices", "/invoices");

  assert.ok(carrierModules.includes("billing"));
  assert.ok(carrierModules.includes("invoices"));
  assert.ok(clientModules.includes("billing"));
  assert.ok(clientModules.includes("invoices"));
  assert.equal(carrierHtml.includes("Panel przewoznika"), false);
  assert.equal(clientHtml.includes("Panel klienta"), false);
  assert.equal(carrierHtml.includes("Saldo systemu"), false);
  assert.equal(clientHtml.includes("Saldo systemu"), false);
});

test("main menu is the single entry point for visible functions", () => {
  const html = renderRoleView(Roles.INSURANCE_PARTNER);

  assert.ok(html.includes('data-module-route="/policies"'));
  assert.ok(html.includes('data-module-route="/claims"'));
  assert.ok(html.includes('data-module-route="/risk"'));
  assert.ok(html.includes('data-module-route="/billing"'));
  assert.equal(html.includes("/insurance/dashboard"), false);
  assert.equal(html.includes("/workshop/dashboard"), false);
  assert.equal(html.includes("/carrier/dashboard"), false);
  assert.equal(html.includes("/client/dashboard"), false);
});
