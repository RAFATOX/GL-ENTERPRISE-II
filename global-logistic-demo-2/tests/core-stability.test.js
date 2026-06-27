import test from "node:test";
import assert from "node:assert/strict";

import { ActionTypes, DEMO_DATA_VERSION, PaymentStatuses, Roles, TransportStatuses } from "../src/core/constants.js";
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

function snapshotForRole(role) {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role }, { demoOnly: true });
  return engine.getSnapshot();
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
  assert.equal(driverMenu.includes("wallet"), false);
  assert.equal(driverMenu.includes("billing"), false);
  assert.equal(driverMenu.includes("invoices"), false);
  assert.equal(driverMenu.includes("audit"), false);
  assert.ok(ownerMenu.includes("wallet"));
  assert.equal(viewAllowedForRole(Roles.DRIVER, "wallet", "/wallet"), false);
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

  assert.deepEqual(modules, ["dashboard", "documents", "wallet", "billing", "invoices", "policies", "claims", "risk", "profile"]);
  ["transports", "photos", "chat", "trust", "company"].forEach((moduleId) => {
    assert.equal(modules.includes(moduleId), false, moduleId);
  });
  assert.equal(html.includes("Panel ubezpieczen"), false);
});

test("workshop sees service orders, invoices and billing without a separate panel", () => {
  const modules = moduleIdsFor(Roles.WORKSHOP);
  const html = renderRoleView(Roles.WORKSHOP);

  assert.deepEqual(modules, ["dashboard", "wallet", "billing", "invoices", "service-orders", "profile"]);
  ["transports", "map", "gps", "chat", "trust", "company"].forEach((moduleId) => {
    assert.equal(modules.includes(moduleId), false, moduleId);
  });
  assert.equal(html.includes("Panel warsztatu"), false);
  assert.equal(html.includes("Panel serwisu"), false);
});

test("platform owner sees every configured module and admin does not see GL Wallet", () => {
  assert.equal(moduleIdsFor(Roles.PLATFORM_OWNER).length, modulesConfig.length);
  assert.equal(moduleIdsFor(Roles.ADMIN).includes("wallet"), false);
  assert.equal(moduleIdsFor(Roles.SUPER_ADMIN).includes("wallet"), false);
});

test("academy student sees academy and profile only with dashboard", () => {
  const modules = moduleIdsFor(Roles.ACADEMY_STUDENT);

  assert.deepEqual(modules, ["dashboard", "academy", "profile"]);
});

test("permission guard blocks direct route access", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "wallet", route: "/wallet" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, false);
  assert.equal(engine.state.session.deniedView, "wallet");
  assert.ok(html.includes("Brak dostępu"));
  assert.ok(html.includes("Brak dostepu do modulu"));
});

test("legacy role panel routes are blocked by PermissionGuard", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "driver_mobile", route: "/kierowca" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, false);
  assert.ok(html.includes("Brak dostępu"));
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
  const html = renderRoleView(Roles.PLATFORM_OWNER, "wallet", "/wallet");

  assert.ok(modules.includes("wallet"));
  assert.ok(permissions.includes(FinancePermissions.WALLET_PLATFORM_READ));
  assert.ok(permissions.includes(FinancePermissions.WALLET_PLATFORM_MANAGE));
  assert.ok(html.includes("Pulpit portfela"));
  assert.ok(html.includes("Saldo systemu"));
  assert.ok(html.includes("GLW-SYSTEM"));
});

test("wallet route is visible only for platform finance roles and own-wallet roles", () => {
  const platformAllowed = [Roles.PLATFORM_OWNER, Roles.GL_OPERATOR, Roles.ADMIN_FINANCE];
  const ownWalletAllowed = [
    Roles.CARRIER_OWNER,
    Roles.CLIENT_OWNER,
    Roles.INSURANCE_PARTNER,
    Roles.WORKSHOP,
    Roles.MOBILE_SERVICE,
    Roles.ROADSIDE_ASSISTANCE
  ];
  const blocked = [
    Roles.ADMIN,
    Roles.SUPER_ADMIN,
    Roles.PAYMENT_OPERATOR,
    Roles.WAREHOUSE_WORKER,
    Roles.DRIVER
  ];

  platformAllowed.forEach((role) => {
    assert.ok(moduleIdsFor(role).includes("wallet"), role);
    assert.ok(permissionsForRole(role).includes(FinancePermissions.WALLET_PLATFORM_READ), role);
  });
  ownWalletAllowed.forEach((role) => {
    assert.ok(moduleIdsFor(role).includes("wallet"), role);
    assert.equal(permissionsForRole(role).includes(FinancePermissions.WALLET_PLATFORM_READ), false, role);
  });
  blocked.forEach((role) => {
    assert.equal(moduleIdsFor(role).includes("wallet"), false, role);
  });
});

test("client sees only own CompanyWallet and never PlatformWallet", () => {
  const snapshot = snapshotForRole(Roles.CLIENT_OWNER);

  assert.equal(snapshot.access.walletView, "CompanyWallet");
  assert.equal(snapshot.wallets.length, 1);
  assert.equal(snapshot.wallets[0].modelType, "CompanyWallet");
  assert.equal(snapshot.wallets[0].ownerType, "company");
  assert.equal(snapshot.wallets[0].ownerId, "co-client-a");
  assert.equal(snapshot.wallets.some((wallet) => wallet.ownerType === "platform"), false);
  assert.equal(snapshot.wallets.some((wallet) => wallet.glWalletId === "GLW-SYSTEM-0001"), false);
});

test("/wallet routes role to platform wallet, own wallet or partner settlement view", () => {
  const platformHtml = renderRoleView(Roles.PLATFORM_OWNER, "wallet", "/wallet");
  const clientHtml = renderRoleView(Roles.CLIENT_OWNER, "wallet", "/wallet");
  const carrierHtml = renderRoleView(Roles.CARRIER_OWNER, "wallet", "/wallet");
  const insurerHtml = renderRoleView(Roles.INSURANCE_PARTNER, "wallet", "/wallet");
  const workshopHtml = renderRoleView(Roles.WORKSHOP, "wallet", "/wallet");

  assert.ok(platformHtml.includes("Saldo systemu"));
  assert.ok(clientHtml.includes("Moj portfel klienta"));
  assert.ok(carrierHtml.includes("Moj portfel przewoznika"));
  assert.ok(insurerHtml.includes("Rozliczenia polis"));
  assert.ok(workshopHtml.includes("Rozliczenia serwisu"));
  [clientHtml, carrierHtml, insurerHtml, workshopHtml].forEach((html) => {
    assert.equal(html.includes("Saldo systemu"), false);
    assert.equal(html.includes("GLW-SYSTEM"), false);
  });
});

test("partner and carrier snapshots do not expose GL platform balance", () => {
  [Roles.CARRIER_OWNER, Roles.INSURANCE_PARTNER, Roles.WORKSHOP].forEach((role) => {
    const snapshot = snapshotForRole(role);
    assert.equal(snapshot.access.canViewPlatformWallet, false, role);
    assert.equal(snapshot.wallets.some((wallet) => wallet.ownerType === "platform"), false, role);
    assert.equal(snapshot.wallets.some((wallet) => wallet.glWalletId === "GLW-SYSTEM-0001"), false, role);
  });
});

test("carrier acceptance reserves client funds in transport escrow without crediting carrier", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const clientWallet = engine.state.wallets.find((wallet) => wallet.id === "wal-client-a");
  const carrierWallet = engine.state.wallets.find((wallet) => wallet.id === "wal-carrier-a");
  const beforeClientBalance = clientWallet.balance;
  const beforeClientHeld = clientWallet.heldBalance;
  const beforeCarrierBalance = carrierWallet.balance;

  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CARRIER_OWNER }, { demoOnly: true });
  engine.dispatchAction(ActionTypes.SELECT_TRANSPORT, { transportId: "tr-1003" });
  const result = engine.dispatchAction(ActionTypes.ACCEPT_CARRIER, {
    transportId: "tr-1003",
    carrierCompanyId: "co-carrier-a"
  });

  const escrow = engine.state.escrows.find((item) => item.transportId === "tr-1003");
  const payment = engine.state.payments.find((item) => item.transportId === "tr-1003");
  assert.equal(result.ok, true);
  assert.equal(escrow.status, "reserved");
  assert.equal(escrow.modelType, "TransportEscrow");
  assert.equal(clientWallet.balance, beforeClientBalance - 980);
  assert.equal(clientWallet.heldBalance, beforeClientHeld + 980);
  assert.equal(carrierWallet.balance, beforeCarrierBalance);
  assert.equal(payment.status, PaymentStatuses.RESERVED);
  assert.ok(engine.state.walletLedger.some((entry) => entry.walletId === "wal-client-a" && entry.transportId === "tr-1003" && entry.type === "hold"));
  assert.ok(engine.state.audit.some((entry) => entry.action === "ESCROW_RESERVED" && entry.transportId === "tr-1003"));
  assert.ok(engine.state.audit.some((entry) => entry.action === "WALLET_HOLD_CREATED" && entry.transportId === "tr-1003"));
});

test("transport cannot start without secured escrow when payment is required", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const transport = engine.state.transports.find((item) => item.id === "tr-1001");
  transport.status = TransportStatuses.DRIVER_ASSIGNED;
  transport.paymentStatus = PaymentStatuses.PENDING;
  engine.state.escrows = engine.state.escrows.filter((item) => item.transportId !== "tr-1001");

  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  const result = engine.explainAction(ActionTypes.START_PICKUP_NAVIGATION, { transportId: "tr-1001" });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.join(" ").includes("secured escrow"));
});

test("carrier and client use billing modules instead of separate panels", () => {
  const carrierModules = moduleIdsFor(Roles.CARRIER_OWNER);
  const clientModules = moduleIdsFor(Roles.CLIENT_OWNER);
  const carrierHtml = renderRoleView(Roles.CARRIER_OWNER, "billing", "/billing");
  const clientHtml = renderRoleView(Roles.CLIENT_OWNER, "invoices", "/invoices");

  assert.ok(carrierModules.includes("billing"));
  assert.ok(carrierModules.includes("invoices"));
  assert.ok(carrierModules.includes("wallet"));
  assert.ok(clientModules.includes("billing"));
  assert.ok(clientModules.includes("invoices"));
  assert.ok(clientModules.includes("wallet"));
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
  assert.ok(html.includes('data-module-route="/wallet"'));
  assert.ok(html.includes('data-module-route="/billing"'));
  assert.equal(html.includes("/insurance/dashboard"), false);
  assert.equal(html.includes("/workshop/dashboard"), false);
  assert.equal(html.includes("/carrier/dashboard"), false);
  assert.equal(html.includes("/client/dashboard"), false);
});

test("module routes stay flat without role dashboard routes", () => {
  const routes = modulesConfig.map((module) => module.route);
  [
    "/dashboard",
    "/transports",
    "/loads",
    "/map",
    "/gps",
    "/photos",
    "/documents",
    "/parking",
    "/chat",
    "/jobs",
    "/academy",
    "/trust",
    "/wallet",
    "/billing",
    "/policies",
    "/claims",
    "/risk",
    "/service-orders",
    "/invoices",
    "/settings"
  ].forEach((route) => assert.ok(routes.includes(route), route));

  [
    "/insurance/dashboard",
    "/workshop/dashboard",
    "/carrier/dashboard",
    "/client/dashboard",
    "/driver/dashboard",
    "/warehouse/dashboard",
    "/kierowca",
    "/rozliczenia",
    "/platnosci",
    "/wyplaty",
    "/escrow-transportu"
  ].forEach((route) => assert.equal(routes.includes(route), false, route));
});

test("UI labels are localized through Translation Engine", () => {
  const walletHtml = renderRoleView(Roles.PLATFORM_OWNER, "wallet", "/wallet");
  const driverHtml = renderRoleView(Roles.DRIVER, "dashboard", "/dashboard");

  [
    "Reset demo data",
    "Permission Engine",
    "AppNavigation / Permission Guard",
    "module.dashboard",
    "Dashboard Wallet",
    "Dashboard administratora",
    "Client Wallet",
    "Carrier Wallet",
    "Immutable demo ledger hash + audit id"
  ].forEach((text) => {
    assert.equal(walletHtml.includes(text) || driverHtml.includes(text), false, text);
  });

  assert.ok(walletHtml.includes("Portfel GL"));
  assert.ok(walletHtml.includes("Pulpit portfela"));
  assert.ok(driverHtml.includes("Nawigacja aplikacji / strażnik uprawnień"));
});
