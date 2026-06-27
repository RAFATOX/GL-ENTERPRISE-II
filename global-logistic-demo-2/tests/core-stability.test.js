import test from "node:test";
import assert from "node:assert/strict";

import {
  AccountStatuses,
  ActionTypes,
  CompanyRoleNames,
  CompanyVerificationStatuses,
  DEMO_DATA_VERSION,
  PaymentStatuses,
  Roles,
  TransportStatuses
} from "../src/core/constants.js";
import { GLCoreEngine } from "../src/core/gl-core-engine.js";
import {
  DriverPermissions,
  FinancePermissions,
  LoadPermissions,
  getVisibleModules,
  modulesConfig,
  permissionsForRole
} from "../src/core/modules-config.js";
import { StateStore } from "../src/core/state-store.js";
import { roleDocumentRequirements } from "../src/roles/role-verification-engine.js";
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

function engineForUserContext(userId, companyId = null) {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const user = engine.state.users.find((item) => item.id === userId);
  const context = companyId
    ? engine.modules.companies.contextsForUser(userId).find((item) => item.companyId === companyId)
    : engine.modules.companies.defaultContextForUser(user);
  engine.state.session.userId = userId;
  engine.state.session.role = user.selectedRole;
  engine.state.session.contextType = context.contextType;
  engine.state.session.companyId = context.companyId || null;
  engine.state.session.companyRoleId = context.userCompanyRoleId || null;
  engine.state.session.onboardingRequired = false;
  engine.state.session.onboardingUserId = null;
  return engine;
}

test("new user sees registration onboarding before the application", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.ok(html.includes("Rejestracja GL Enterprise"));
  assert.ok(html.includes("GL Registration / Onboarding Engine"));
  assert.equal(html.includes("Menu modulow"), false);
  assert.equal(html.includes("Jedna aplikacja modulowa"), false);
});

test("onboarding requires language, phone and consents", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const missingLanguage = engine.explainAction(ActionTypes.ONBOARDING_START, {
    country: "PL",
    phone: "+48500111222",
    termsConsent: "true",
    identityConsent: "true",
    documentsConsent: "true"
  });
  const missingPhone = engine.explainAction(ActionTypes.ONBOARDING_START, {
    language: "pl",
    country: "PL",
    termsConsent: "true",
    identityConsent: "true",
    documentsConsent: "true"
  });

  assert.equal(missingLanguage.ok, false);
  assert.ok(missingLanguage.reasons.join(" ").includes("jezyk"));
  assert.equal(missingPhone.ok, false);
  assert.ok(missingPhone.reasons.join(" ").includes("telefon"));
});

test("identity document and selfie are required before role approval", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const start = engine.dispatchAction(ActionTypes.ONBOARDING_START, {
    language: "pl",
    country: "PL",
    phone: "+48500111999",
    termsConsent: "true",
    identityConsent: "true",
    documentsConsent: "true"
  });
  const userId = start.events.find((event) => event.type === "ONBOARDING_STARTED").objectId;
  engine.dispatchAction(ActionTypes.ONBOARDING_VERIFY_PHONE, { userId, otpCode: "123456" });
  engine.dispatchAction(ActionTypes.ONBOARDING_CREATE_ACCOUNT, {
    userId,
    firstName: "Jan",
    lastName: "Testowy",
    email: "jan.testowy@demo.gl",
    passwordMethod: "passkey_demo",
    countryOfResidence: "PL",
    userType: "driver"
  });
  engine.dispatchAction(ActionTypes.ONBOARDING_SELECT_ROLE, { userId, role: "driver" });
  const missingIdentity = engine.explainAction(ActionTypes.ONBOARDING_SUBMIT_IDENTITY, {
    userId,
    documentCountry: "PL",
    documentExpiresAt: "2030-12-31",
    selfieConfirmed: "true"
  });

  assert.equal(missingIdentity.ok, false);
  assert.ok(missingIdentity.reasons.join(" ").includes("dokument tozsamosci"));
});

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

test("user can create a company and becomes owner through UserCompanyRole", () => {
  const engine = engineForUserContext("u-academy-student");
  engine.state.session.contextType = "private";
  engine.state.session.companyId = null;
  engine.state.session.companyRoleId = null;

  const result = engine.dispatchAction(ActionTypes.CREATE_COMPANY, {
    name: "Nowa Firma Demo",
    country: "PL",
    vatEu: "PL999888777",
    address: "Warszawa, Testowa 1",
    type: "client"
  });

  const company = engine.state.companies.find((item) => item.name === "Nowa Firma Demo");
  const membership = engine.state.userCompanyRoles.find((item) => item.userId === "u-academy-student" && item.companyId === company.id);
  assert.equal(result.ok, true);
  assert.equal(company.status, CompanyVerificationStatuses.PENDING);
  assert.equal(membership.roleName, CompanyRoleNames.OWNER);
  assert.ok(engine.state.audit.some((entry) => entry.action === "COMPANY_CREATED" && entry.objectId === company.id));
});

test("one user can belong to multiple companies with different company roles", () => {
  const carrierEngine = engineForUserContext("u-multi-company", "co-carrier-a");
  const carrierActor = carrierEngine.getActor();
  const clientEngine = engineForUserContext("u-multi-company", "co-client-a");
  const clientActor = clientEngine.getActor();

  assert.equal(carrierActor.companyRole, CompanyRoleNames.DISPATCHER);
  assert.equal(clientActor.companyRole, CompanyRoleNames.FINANCE);
  assert.ok(carrierActor.permissions.includes(LoadPermissions.ASSIGN_DRIVER));
  assert.equal(clientActor.permissions.includes(DriverPermissions.ASSIGN), false);
  assert.ok(clientActor.permissions.includes(FinancePermissions.WALLET_COMPANY_READ));
});

test("carrier owner sees company and transports through permissions", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  const actor = engine.getActor();
  const modules = getVisibleModules(actor, actor.role).map((item) => item.id);

  assert.equal(actor.companyRole, CompanyRoleNames.OWNER);
  assert.ok(modules.includes("company"));
  assert.ok(modules.includes("transports"));
  assert.ok(actor.permissions.includes(LoadPermissions.MANAGE_COMPANY));
});

test("driver assigned to carrier company does not see company finance", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const actor = engine.getActor();
  const snapshot = engine.getSnapshot();

  assert.equal(actor.companyRole, CompanyRoleNames.EMPLOYEE);
  assert.equal(actor.permissions.includes(FinancePermissions.WALLET_COMPANY_READ), false);
  assert.equal(snapshot.access.canViewFinancials, false);
  assert.equal(snapshot.wallets.length, 0);
});

test("finance sees company invoices and wallet but cannot manage drivers", () => {
  const engine = engineForUserContext("u-carrier-finance", "co-carrier-a");
  const actor = engine.getActor();
  const modules = getVisibleModules(actor, actor.role).map((item) => item.id);
  const assignDriver = engine.explainAction(ActionTypes.ASSIGN_DRIVER, {
    transportId: "tr-1003",
    driverId: "u-driver-1",
    vehicleId: "vh-1"
  });

  assert.equal(actor.companyRole, CompanyRoleNames.FINANCE);
  assert.ok(modules.includes("wallet"));
  assert.ok(modules.includes("invoices"));
  assert.ok(actor.permissions.includes(FinancePermissions.INVOICES_COMPANY_READ));
  assert.equal(actor.permissions.includes(DriverPermissions.ASSIGN), false);
  assert.equal(assignDriver.ok, false);
});

test("dispatcher manages transports but cannot enter PlatformWallet", () => {
  const engine = engineForUserContext("u-carrier-dispatcher", "co-carrier-a");
  const actor = engine.getActor();
  const accept = engine.explainAction(ActionTypes.ACCEPT_CARRIER, {
    transportId: "tr-1003",
    carrierCompanyId: "co-carrier-a"
  });
  const wallet = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "wallet", route: "/wallet" });

  assert.equal(actor.companyRole, CompanyRoleNames.DISPATCHER);
  assert.ok(actor.permissions.includes(LoadPermissions.ACCEPT));
  assert.equal(actor.permissions.includes(FinancePermissions.WALLET_PLATFORM_READ), false);
  assert.equal(accept.ok, true);
  assert.equal(wallet.ok, false);
  assert.ok(engine.state.audit.some((entry) => entry.action === "ACTION_BLOCKED" && entry.requestedAction === ActionTypes.SELECT_VIEW));
});

test("client can create load only as a verified company context", () => {
  const engine = engineForUserContext("u-client-owner", "co-client-a");
  const company = engine.state.companies.find((item) => item.id === "co-client-a");
  company.status = CompanyVerificationStatuses.PENDING;
  company.verificationStatus = CompanyVerificationStatuses.PENDING;

  const result = engine.explainAction(ActionTypes.CREATE_LOAD, {
    description: "ladunek testowy",
    pickupAddress: "Warszawa",
    deliveryAddress: "Poznan"
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.join(" ").includes("firma wymaga weryfikacji"));
});

test("workshop and insurer use their company modules without platform wallet", () => {
  const workshop = engineForUserContext("u-workshop", "co-workshop-a");
  const insurer = engineForUserContext("u-insurance", "co-insurance-a");
  const workshopModules = getVisibleModules(workshop.getActor(), workshop.getActor().role).map((item) => item.id);
  const insurerModules = getVisibleModules(insurer.getActor(), insurer.getActor().role).map((item) => item.id);

  assert.ok(workshopModules.includes("service-orders"));
  assert.ok(workshopModules.includes("billing"));
  assert.equal(workshop.getActor().permissions.includes(FinancePermissions.WALLET_PLATFORM_READ), false);
  assert.ok(insurerModules.includes("policies"));
  assert.ok(insurerModules.includes("claims"));
  assert.ok(insurerModules.includes("risk"));
  assert.equal(insurer.getActor().permissions.includes(FinancePermissions.WALLET_PLATFORM_READ), false);
});

test("company role and permission changes are saved in audit log", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  const target = engine.state.userCompanyRoles.find((item) => item.userId === "u-carrier-dispatcher" && item.companyId === "co-carrier-a");

  const roleResult = engine.dispatchAction(ActionTypes.CHANGE_COMPANY_USER_ROLE, {
    userCompanyRoleId: target.id,
    roleName: CompanyRoleNames.FINANCE
  });
  const permissionResult = engine.dispatchAction(ActionTypes.CHANGE_COMPANY_USER_PERMISSIONS, {
    userCompanyRoleId: target.id,
    permissions: "invoices.company.read,wallet.company.read"
  });

  assert.equal(roleResult.ok, true);
  assert.equal(permissionResult.ok, true);
  assert.ok(engine.state.audit.some((entry) => entry.action === "COMPANY_USER_ROLE_CHANGED" && entry.objectId === target.id));
  assert.ok(engine.state.audit.some((entry) => entry.action === "COMPANY_USER_PERMISSIONS_CHANGED" && entry.objectId === target.id));
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

test("driver without role documents cannot start transport work", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  const driver = engine.state.users.find((user) => user.id === "u-driver-1");
  const transport = engine.state.transports.find((item) => item.id === "tr-1001");
  driver.roleVerificationStatus[Roles.DRIVER] = AccountStatuses.ROLE_DOCUMENTS_PENDING;
  transport.status = TransportStatuses.DRIVER_ASSIGNED;
  transport.paymentStatus = PaymentStatuses.RESERVED;
  let escrow = engine.state.escrows.find((item) => item.transportId === transport.id);
  if (!escrow) {
    escrow = { id: "esc-test", transportId: transport.id, payerCompanyId: transport.clientCompanyId, payeeCompanyId: transport.carrierCompanyId, amount: transport.price, currency: "EUR", status: "reserved" };
    engine.state.escrows.push(escrow);
  }
  escrow.status = "reserved";

  const result = engine.explainAction(ActionTypes.START_PICKUP_NAVIGATION, { transportId: transport.id });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.join(" ").includes("rola wymaga osobnej weryfikacji"));
});

test("carrier without company verification cannot add a vehicle", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CARRIER_OWNER }, { demoOnly: true });
  const carrier = engine.state.users.find((user) => user.id === "u-carrier-owner");
  carrier.roleVerificationStatus[Roles.CARRIER_OWNER] = AccountStatuses.COMPANY_PENDING;

  const result = engine.explainAction(ActionTypes.ADD_VEHICLE, { plate: "GL 12345", type: "ciagnik" });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.join(" ").includes("rola wymaga osobnej weryfikacji"));
});

test("client without wallet cannot activate a load", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CLIENT_OWNER }, { demoOnly: true });
  const transport = engine.state.transports.find((item) => item.id === "tr-1003");
  transport.status = TransportStatuses.READY_TO_PUBLISH;
  transport.pickup.gps = { lat: 52.1, lng: 20.1 };
  transport.delivery.gps = { lat: 53.1, lng: 21.1 };
  transport.cargo.prePublishPhotoId = "ph-load-3";
  engine.state.wallets = engine.state.wallets.filter((wallet) => wallet.ownerCompanyId !== transport.clientCompanyId);

  const result = engine.explainAction(ActionTypes.PUBLISH_LOAD, { transportId: transport.id });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.join(" ").includes("portfel klienta"));
});

test("unapproved insurer and workshop cannot open their modules", () => {
  const insurerEngine = new GLCoreEngine({ store: memoryStore() });
  insurerEngine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.INSURANCE_PARTNER }, { demoOnly: true });
  insurerEngine.state.users.find((user) => user.id === "u-insurance").accountStatus = AccountStatuses.IDENTITY_PENDING;
  const insurerResult = insurerEngine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "policies", route: "/policies" });

  const workshopEngine = new GLCoreEngine({ store: memoryStore() });
  workshopEngine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.WORKSHOP }, { demoOnly: true });
  workshopEngine.state.users.find((user) => user.id === "u-workshop").accountStatus = AccountStatuses.IDENTITY_PENDING;
  const workshopResult = workshopEngine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "service_orders", route: "/service-orders" });

  assert.equal(insurerResult.ok, false);
  assert.equal(workshopResult.ok, false);
  assert.ok(insurerEngine.state.audit.some((entry) => entry.action === "ACTION_BLOCKED"));
  assert.ok(workshopEngine.state.audit.some((entry) => entry.action === "ACTION_BLOCKED"));
});

test("each onboarding role has its own document process", () => {
  const driverDocs = roleDocumentRequirements(Roles.DRIVER);
  const carrierDocs = roleDocumentRequirements(Roles.CARRIER_OWNER);
  const workshopDocs = roleDocumentRequirements(Roles.WORKSHOP);
  const insurerDocs = roleDocumentRequirements(Roles.INSURANCE_PARTNER);

  assert.ok(driverDocs.includes("driver_license"));
  assert.ok(carrierDocs.includes("ocp"));
  assert.ok(workshopDocs.includes("service_scope"));
  assert.ok(insurerDocs.includes("license"));
  assert.notDeepEqual(driverDocs, carrierDocs);
});

test("bypass attempts are saved in audit log and compliance findings", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CARRIER_OWNER }, { demoOnly: true });
  const carrier = engine.state.users.find((user) => user.id === "u-carrier-owner");
  carrier.accountStatus = AccountStatuses.IDENTITY_PENDING;

  const result = engine.dispatchAction(ActionTypes.ADD_VEHICLE, { plate: "GL BLOCK", type: "naczepa" });

  assert.equal(result.ok, false);
  assert.ok(engine.state.audit.some((entry) => entry.action === "ACTION_BLOCKED"));
  assert.ok(engine.state.complianceFindings.some((entry) => entry.type === "proba_obejscia_weryfikacji"));
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
