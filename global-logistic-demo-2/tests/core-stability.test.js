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

function renderRoleView(role, view, route) {
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

test("roleConfig drives role menus and hides unrelated modules", () => {
  const driverMenu = menuForRole(Roles.DRIVER).map((item) => item.id);
  const adminMenu = menuForRole(Roles.ADMIN).map((item) => item.id);
  const ownerMenu = menuForRole(Roles.PLATFORM_OWNER).map((item) => item.id);

  assert.ok(driverMenu.includes("gps"));
  assert.ok(driverMenu.includes("documents"));
  assert.equal(driverMenu.includes("platform_wallet"), false);
  assert.equal(driverMenu.includes("billing"), false);
  assert.equal(driverMenu.includes("invoices"), false);
  assert.equal(driverMenu.includes("audit"), false);
  assert.equal(adminMenu.includes("platform_wallet"), false);
  assert.ok(adminMenu.includes("audit"));
  assert.ok(ownerMenu.includes("platform_wallet"));
  assert.equal(viewAllowedForRole(Roles.DRIVER, "platform_wallet", "/wallet"), false);
});

test("driver workspace renders as ERP panel without phone mockup", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "driver_mobile" });

  const html = renderApp(engine.state, engine);
  assert.ok(html.includes("data-role-select"));
  assert.ok(html.includes("driver-workspace"));
  assert.equal(html.includes('class="phone"'), false);
  assert.equal(html.includes('data-view="platform_wallet"'), false);
});

test("wallet demo renders fintech shell only for platform finance roles", () => {
  const financeEngine = new GLCoreEngine({ store: memoryStore() });
  financeEngine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.GL_OPERATOR }, { demoOnly: true });
  financeEngine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "platform_wallet", route: "/wallet" });
  const financeHtml = renderApp(financeEngine.getSnapshot(), financeEngine);

  assert.ok(financeHtml.includes("finance-shell"));
  assert.ok(financeHtml.includes("DEMO MODE"));
  assert.ok(financeHtml.includes("GLW-"));
  assert.ok(financeHtml.includes("Saldo systemu"));

  const carrierEngine = new GLCoreEngine({ store: memoryStore() });
  carrierEngine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CARRIER_OWNER }, { demoOnly: true });
  carrierEngine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "billing", route: "/rozliczenia" });
  const carrierHtml = renderApp(carrierEngine.getSnapshot(), carrierEngine);

  assert.ok(carrierHtml.includes("own-finance-shell"));
  assert.equal(carrierHtml.includes("GLW-"), false);
  assert.equal(carrierHtml.includes("Saldo systemu"), false);
});

test("module navigation shows driver modules only", () => {
  const modules = getVisibleModules({ role: Roles.DRIVER }, Roles.DRIVER).map((module) => module.id);

  assert.ok(modules.includes("dashboard"));
  assert.ok(modules.includes("gl-gps"));
  assert.ok(modules.includes("gl-photos"));
  assert.ok(modules.includes("parking"));
  assert.equal(modules.includes("wallet"), false);
  assert.equal(modules.includes("billing"), false);
  assert.equal(modules.includes("invoices"), false);
  assert.equal(modules.includes("payment-status"), false);
  assert.equal(modules.includes("settings"), false);
  assert.equal(modules.includes("academy"), false);
});

test("platform owner sees every configured module", () => {
  const modules = getVisibleModules({ role: Roles.PLATFORM_OWNER }, Roles.PLATFORM_OWNER).map((module) => module.id);

  assert.equal(modules.length, modulesConfig.length);
});

test("academy student sees academy and profile only with dashboard", () => {
  const modules = getVisibleModules({ role: Roles.ACADEMY_STUDENT }, Roles.ACADEMY_STUDENT).map((module) => module.id);

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

test("changing active role changes visible modules", () => {
  const driverModules = getVisibleModules({ role: Roles.DRIVER }, Roles.DRIVER).map((module) => module.id);
  const ownerModules = getVisibleModules({ role: Roles.PLATFORM_OWNER }, Roles.PLATFORM_OWNER).map((module) => module.id);

  assert.equal(driverModules.includes("wallet"), false);
  assert.equal(ownerModules.includes("wallet"), true);
  assert.ok(ownerModules.length > driverModules.length);
});

test("platform_owner sees full GL Wallet with platform permissions", () => {
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

test("carrier sees own settlements but not GL Wallet", () => {
  const modules = moduleIdsFor(Roles.CARRIER_OWNER);
  const html = renderRoleView(Roles.CARRIER_OWNER, "billing", "/rozliczenia");

  assert.equal(modules.includes("wallet"), false);
  assert.ok(modules.includes("billing"));
  assert.ok(modules.includes("invoices"));
  assert.ok(modules.includes("payout-status"));
  assert.ok(html.includes("Naleznosci za transporty"));
  assert.ok(html.includes("Potracone prowizje GL"));
  assert.equal(html.includes("Saldo systemu"), false);
  assert.equal(html.includes("GLW-"), false);
});

test("client sees invoices, payments and transport escrow but not GL Wallet", () => {
  const modules = moduleIdsFor(Roles.CLIENT_OWNER);
  const html = renderRoleView(Roles.CLIENT_OWNER, "invoices", "/faktury");

  assert.equal(modules.includes("wallet"), false);
  assert.ok(modules.includes("invoices"));
  assert.ok(modules.includes("payment-status"));
  assert.ok(modules.includes("transport-escrow"));
  assert.ok(html.includes("Faktury klienta"));
  assert.ok(html.includes("Platnosci za transporty"));
  assert.equal(html.includes("Saldo systemu"), false);
  assert.equal(html.includes("GLW-"), false);
});

test("insurer sees policy settlements without platform balance", () => {
  const modules = moduleIdsFor(Roles.INSURANCE_PARTNER);
  const html = renderRoleView(Roles.INSURANCE_PARTNER, "billing", "/rozliczenia");

  assert.equal(modules.includes("wallet"), false);
  assert.ok(modules.includes("billing"));
  assert.ok(modules.includes("payment-status"));
  assert.ok(html.includes("Rozliczenia polis"));
  assert.ok(html.includes("Skladki przypisane do polis") || html.includes("Skladki polis"));
  assert.equal(html.includes("Saldo systemu"), false);
  assert.equal(html.includes("GLW-"), false);
});

test("workshop sees service invoices and payments without platform balance", () => {
  const modules = moduleIdsFor(Roles.WORKSHOP);
  const html = renderRoleView(Roles.WORKSHOP, "billing", "/rozliczenia");

  assert.equal(modules.includes("wallet"), false);
  assert.ok(modules.includes("billing"));
  assert.ok(modules.includes("invoices"));
  assert.ok(modules.includes("payment-status"));
  assert.ok(html.includes("Rozliczenia serwisu"));
  assert.ok(html.includes("Zlecenia serwisowe"));
  assert.ok(html.includes("spay-2"));
  assert.equal(html.includes("Saldo systemu"), false);
  assert.equal(html.includes("GLW-"), false);
});

test("driver sees no wallet or finance modules", () => {
  const modules = moduleIdsFor(Roles.DRIVER);

  assert.equal(modules.includes("wallet"), false);
  assert.equal(modules.includes("billing"), false);
  assert.equal(modules.includes("invoices"), false);
  assert.equal(modules.includes("payment-status"), false);
  assert.equal(modules.includes("payout-status"), false);
  assert.equal(modules.includes("transport-escrow"), false);
});

test("non platform finance role cannot enter /wallet by URL", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CARRIER_OWNER }, { demoOnly: true });
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "platform_wallet", route: "/wallet" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, false);
  assert.ok(html.includes("AccessDenied"));
  assert.equal(html.includes("Dashboard Wallet"), false);
});

test("only platform finance roles can see platform balance", () => {
  const platformRoles = [Roles.PLATFORM_OWNER, Roles.GL_OPERATOR, Roles.ADMIN_FINANCE];
  const nonPlatformRoles = [
    Roles.CARRIER_OWNER,
    Roles.CLIENT_OWNER,
    Roles.INSURANCE_PARTNER,
    Roles.WORKSHOP,
    Roles.DRIVER,
    Roles.WAREHOUSE_WORKER,
    Roles.ACADEMY_STUDENT,
    Roles.ACADEMY_TEACHER
  ];

  platformRoles.forEach((role) => {
    const html = renderRoleView(role, "platform_wallet", "/wallet");
    assert.ok(html.includes("Saldo systemu"), role);
  });
  nonPlatformRoles.forEach((role) => {
    const modules = moduleIdsFor(role);
    const firstFinanceModule = modules.includes("billing") ? ["billing", "/rozliczenia"]
      : modules.includes("invoices") ? ["invoices", "/faktury"]
      : ["dashboard", "/dashboard"];
    const html = renderRoleView(role, firstFinanceModule[0], firstFinanceModule[1]);
    assert.equal(html.includes("Saldo systemu"), false, role);
    assert.equal(html.includes("GLW-SYSTEM"), false, role);
  });
});
