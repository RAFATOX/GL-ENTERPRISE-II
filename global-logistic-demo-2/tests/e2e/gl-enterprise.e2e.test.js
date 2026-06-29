import test from "node:test";
import assert from "node:assert/strict";

import { ActionTypes, EventTypes, Roles } from "../../src/core/constants.js";
import { ModulePermissions, getVisibleModules } from "../../src/core/modules-config.js";
import { GLCoreEngine } from "../../src/core/gl-core-engine.js";
import { StateStore } from "../../src/core/state-store.js";
import { renderApp } from "../../src/ui/renderers.js";

function memoryStore() {
  let state = null;
  return {
    load() {
      if (state) return JSON.parse(JSON.stringify(state));
      return new StateStore("__e2e__").reset();
    },
    save(nextState) {
      state = JSON.parse(JSON.stringify(nextState));
    },
    reset() {
      state = new StateStore("__e2e__").reset();
      return state;
    }
  };
}

function createEngine() {
  return new GLCoreEngine({ store: memoryStore() });
}

function render(engine) {
  return renderApp(engine.getSnapshot(), engine);
}

function engineForUserContext(userId, companyId = null) {
  const engine = createEngine();
  const user = engine.state.users.find((item) => item.id === userId);
  assert.ok(user, `missing demo user ${userId}`);
  const context = companyId
    ? engine.modules.companies.contextsForUser(userId).find((item) => item.companyId === companyId && item.compatibleRoles.includes(user.selectedRole))
      || engine.modules.companies.contextsForUser(userId).find((item) => item.companyId === companyId)
    : engine.modules.companies.defaultContextForUser(user);
  assert.ok(context, `missing context for ${userId}`);
  const activeRole = context.compatibleRoles.includes(user.selectedRole)
    ? user.selectedRole
    : context.compatibleRoles[0] || user.selectedRole;
  engine.state.session.userId = userId;
  engine.state.session.role = activeRole;
  engine.state.session.contextType = context.contextType;
  engine.state.session.companyId = context.companyId || null;
  engine.state.session.companyRoleId = context.userCompanyRoleId || null;
  engine.state.session.onboardingRequired = false;
  engine.state.session.onboardingUserId = null;
  return engine;
}

function activateUserRole(engine, userId, role, preferred = {}) {
  const context = engine.modules.companies.contextForRole(userId, role, preferred);
  assert.ok(context, `missing context for ${userId} as ${role}`);
  engine.state.session.userId = userId;
  engine.state.session.role = role;
  engine.state.session.activeRole = role;
  engine.state.session.contextType = context.contextType;
  engine.state.session.companyId = context.contextType === "company" ? context.companyId : null;
  engine.state.session.activeCompanyId = engine.state.session.companyId;
  engine.state.session.companyRoleId = context.userCompanyRoleId || null;
  engine.state.session.activeContext = {
    contextType: context.contextType,
    companyId: context.companyId || null,
    userCompanyRoleId: context.userCompanyRoleId || null,
    label: context.label || null
  };
  engine.state.session.view = "dashboard";
  engine.state.session.onboardingRequired = false;
  engine.state.session.onboardingUserId = null;
  return context;
}

function submitRenderedForm(engine, actionType, overrides = {}) {
  const html = render(engine);
  const payload = payloadFromRenderedForm(html, actionType, overrides);
  return engine.dispatchAction(actionType, payload, { source: "e2e-rendered-form" });
}

function payloadFromRenderedForm(html, actionType, overrides = {}) {
  const form = extractRenderedForm(html, actionType);
  const payload = {};
  for (const select of form.matchAll(/<select\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const selected = select[2].match(/<option\b[^>]*selected[^>]*value="([^"]*)"/)
      || select[2].match(/<option\b[^>]*value="([^"]*)"/);
    if (selected) payload[select[1]] = decodeHtml(selected[1]);
  }
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    const tag = input[0];
    const name = attribute(tag, "name");
    if (!name || tag.includes("disabled")) continue;
    const type = attribute(tag, "type");
    if (type === "checkbox" && !tag.includes("checked")) continue;
    payload[name] = decodeHtml(attribute(tag, "value")) || (type === "checkbox" ? "on" : "");
  }
  return { ...payload, ...overrides };
}

function extractRenderedForm(html, actionType) {
  const marker = `data-form-action="${actionType}"`;
  const markerAt = html.indexOf(marker);
  assert.notEqual(markerAt, -1, `missing form for ${actionType}`);
  const formStart = html.lastIndexOf("<form", markerAt);
  const formEnd = html.indexOf("</form>", markerAt);
  assert.notEqual(formStart, -1, `missing form start for ${actionType}`);
  assert.notEqual(formEnd, -1, `missing form end for ${actionType}`);
  return html.slice(formStart, formEnd + "</form>".length);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "";
}

function decodeHtml(value = "") {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function completeClientCompanyOnboarding() {
  const engine = createEngine();
  const start = submitRenderedForm(engine, ActionTypes.ONBOARDING_START, {
    language: "pl",
    country: "PL",
    phone: "+48500999002"
  });
  const userId = start.events.find((event) => event.type === EventTypes.ONBOARDING_STARTED)?.objectId;
  assert.ok(userId, "onboarding did not create user id");

  assert.equal(submitRenderedForm(engine, ActionTypes.ONBOARDING_VERIFY_PHONE, { userId, otpCode: "123456" }).ok, true);
  assert.equal(submitRenderedForm(engine, ActionTypes.ONBOARDING_CREATE_ACCOUNT, {
    userId,
    firstName: "Ewa",
    lastName: "E2E",
    email: "ewa.e2e@demo.gl",
    passwordMethod: "passkey_demo",
    countryOfResidence: "PL",
    userType: "transport"
  }).ok, true);
  assert.equal(submitRenderedForm(engine, ActionTypes.ONBOARDING_SELECT_ROLE, { userId, role: "client" }).ok, true);
  assert.equal(submitRenderedForm(engine, ActionTypes.ONBOARDING_SUBMIT_IDENTITY, {
    userId,
    documentType: "identity_card",
    documentCountry: "PL",
    documentExpiresAt: "2030-12-31",
    selfieConfirmed: "true"
  }).ok, true);
  assert.equal(submitRenderedForm(engine, ActionTypes.ONBOARDING_SUBMIT_ROLE_DOCUMENTS, { userId, role: "client" }).ok, true);

  const companyResult = submitRenderedForm(engine, ActionTypes.ONBOARDING_SUBMIT_COMPANY, {
    userId,
    role: "client",
    companyName: "E2E Client Sp. z o.o.",
    vatEu: "PL2223334445",
    companyDocuments: "true",
    walletReady: "true"
  });
  assert.equal(companyResult.ok, true);
  const approve = submitRenderedForm(engine, ActionTypes.ONBOARDING_APPROVE, { userId, role: "client" });
  assert.equal(approve.ok, true);
  return { engine, userId };
}

function moduleRoutes(html) {
  return [...html.matchAll(/data-module-route="([^"]+)"/g)].map((match) => match[1]);
}

function selectView(engine, view, route) {
  return engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route }, { source: "e2e-route" });
}

function assertNoTechnicalEnglishUi(html) {
  [
    "Permission Engine",
    "Company Engine",
    "Audit Log",
    "Event Bus",
    "AccessDenied",
    "Dashboard Wallet",
    "Client Wallet",
    "Carrier Wallet",
    "PlatformWallet",
    "CompanyWallet",
    "Reset demo data"
  ].forEach((text) => assert.equal(html.includes(text), false, `technical English leaked to UI: ${text}`));
}

function assertNoTechnicalEvents(html) {
  [
    "UI_VIEW_CHANGED",
    "SELECT_VIEW",
    "ONBOARDING_APPROVE",
    "EventBus",
    "undefined"
  ].forEach((text) => assert.equal(html.includes(text), false, `technical event leaked to UI: ${text}`));
}

function assertButtonsHaveBehavior(html) {
  [...html.matchAll(/<button\b([^>]*)>/g)].forEach((match, index) => {
    const attrs = match[1];
    const hasBehavior = [
      "data-action=",
      "data-module-route=",
      "data-profile-target=",
      "data-detail-route=",
      "data-role=",
      "data-reset-demo=",
      "type=\"submit\""
    ].some((marker) => attrs.includes(marker));
    assert.equal(hasBehavior, true, `dead button ${index + 1}: ${attrs}`);
  });
}

test("e2e: onboarding przechodzi od wyboru jezyka i telefonu do ekranu OTP", () => {
  const engine = createEngine();
  const startHtml = render(engine);
  assert.ok(startHtml.includes(`data-form-action="${ActionTypes.ONBOARDING_START}"`));

  const result = submitRenderedForm(engine, ActionTypes.ONBOARDING_START, {
    language: "pl",
    country: "PL",
    phone: "+48500999001"
  });
  const otpHtml = render(engine);

  assert.equal(result.ok, true);
  assert.ok(result.events.some((event) => event.type === EventTypes.ONBOARDING_STARTED));
  assert.ok(otpHtml.includes("Weryfikacja telefonu"));
  assert.ok(otpHtml.includes(`data-form-action="${ActionTypes.ONBOARDING_VERIFY_PHONE}"`));
  assert.equal(otpHtml.includes(`data-form-action="${ActionTypes.ONBOARDING_START}"`), false);
});

test("e2e: onboarding tworzy firme, UserCompanyRole i pozwala wybrac kontekst firmy", () => {
  const { engine, userId } = completeClientCompanyOnboarding();
  const user = engine.state.users.find((item) => item.id === userId);
  const company = engine.state.companies.find((item) => item.id === user.companyId);
  const membership = engine.state.userCompanyRoles.find((item) => item.userId === userId && item.companyId === company.id);

  assert.ok(company.company_id);
  assert.equal(company.name, "E2E Client Sp. z o.o.");
  assert.ok(membership.userCompanyRole_id);
  assert.equal(engine.state.session.contextType, "company");
  assert.equal(engine.state.session.companyId, company.id);
  assert.equal(engine.state.session.companyRoleId, membership.id);

  engine.state.session.contextType = "private";
  engine.state.session.companyId = null;
  engine.state.session.companyRoleId = null;
  const selected = engine.dispatchAction(ActionTypes.SELECT_CONTEXT, {
    contextType: "company",
    companyId: company.id,
    userCompanyRoleId: membership.id
  }, { source: "e2e-context-select" });
  const html = render(engine);

  assert.equal(selected.ok, true);
  assert.equal(engine.getActor().companyId, company.id);
  assert.ok(html.includes("E2E Client Sp. z o.o."));
});

test("e2e: client wchodzi na /wallet tylko do wlasnych rozliczen", () => {
  const engine = engineForUserContext("u-client-owner", "co-client-a");
  const result = selectView(engine, "wallet", "/wallet");
  const html = render(engine);

  assert.equal(result.ok, true);
  assert.equal(html.includes("GLW-SYSTEM-0001"), false);
  assert.equal(html.includes("Saldo systemu"), false);
  assert.equal(html.includes("access-panel"), false);
});

test("e2e: carrier wchodzi na /wallet bez dostepu do portfela platformy", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  const result = selectView(engine, "wallet", "/wallet");
  const html = render(engine);

  assert.equal(result.ok, true);
  assert.equal(html.includes("GLW-SYSTEM-0001"), false);
  assert.equal(html.includes("Saldo systemu"), false);
  assert.equal(html.includes("access-panel"), false);
});

test("e2e: driver wchodzi na /wallet tylko do osobistego UserWallet", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const result = selectView(engine, "wallet", "/wallet");
  const html = render(engine);

  assert.equal(result.ok, true);
  assert.ok(html.includes("GLW-DRIVER-0001"));
  assert.ok(html.includes("Portfel osobisty kierowcy"));
  assert.equal(html.includes("GLW-CARRIER-0001"), false);
  assert.equal(html.includes("GLW-SYSTEM-0001"), false);
  assert.equal(html.includes("Saldo systemu"), false);
  assert.equal(html.includes("access-panel"), false);
});

test("e2e: menu modulow wynika z permissions aktywnego kontekstu", () => {
  const driver = engineForUserContext("u-driver-1", "co-carrier-a");
  const driverActor = driver.getActor();
  const driverHtml = render(driver);
  const driverRoutes = moduleRoutes(driverHtml);
  const driverModules = getVisibleModules(driverActor, driverActor.role).map((module) => module.id);

  assert.ok(driverActor.permissions.includes(ModulePermissions.GPS));
  assert.ok(driverRoutes.includes("/gps"));
  assert.ok(driverRoutes.includes("/photos"));
  assert.ok(driverRoutes.includes("/wallet"));
  assert.ok(driverModules.includes("wallet"));

  const platform = engineForUserContext("u-platform");
  const platformActor = platform.getActor();
  const platformHtml = render(platform);
  const platformRoutes = moduleRoutes(platformHtml);

  assert.ok(platformActor.permissions.includes(ModulePermissions.WALLET));
  assert.ok(platformRoutes.includes("/wallet"));
  assert.ok(platformRoutes.length > driverRoutes.length);
});

test("e2e: bezposredni URL bez permission pokazuje Brak dostepu", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const result = selectView(engine, "billing", "/billing");
  const html = render(engine);

  assert.equal(result.ok, false);
  assert.ok(html.includes("Brak dostępu"));
  assert.equal(engine.state.session.deniedRoute, "/billing");
});

test("e2e: przełączanie ról i firm odswieza menu, pulpit, permissions i wallet scope", () => {
  const engine = createEngine();
  activateUserRole(engine, "u-role-switch", Roles.DRIVER, { contextType: "company", companyId: "co-carrier-a" });
  let html = render(engine);
  let routes = moduleRoutes(html);

  assert.ok(html.includes("data-role-select"));
  assert.ok(html.includes("data-context-select"));
  assert.ok(routes.includes("/gps"));
  assert.ok(routes.includes("/wallet"));
  assert.equal(routes.includes("/billing"), false);
  assert.equal(routes.includes("/audit"), false);
  assert.equal(engine.getSnapshot().access.walletView, "UserWallet");

  assert.equal(engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CARRIER_OWNER }).ok, true);
  html = render(engine);
  routes = moduleRoutes(html);
  assert.equal(engine.state.session.userId, "u-role-switch");
  assert.equal(engine.getActor().companyId, "co-carrier-a");
  assert.equal(engine.getSnapshot().access.walletView, "CompanyWallet");
  assert.ok(routes.includes("/loads"));
  assert.ok(routes.includes("/company"));
  assert.equal(routes.includes("/audit"), false);

  assert.equal(engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.CLIENT_OWNER }).ok, true);
  routes = moduleRoutes(render(engine));
  assert.equal(engine.state.session.userId, "u-role-switch");
  assert.equal(engine.getActor().companyId, "co-client-a");
  assert.equal(engine.getSnapshot().access.financialScope, "client");
  assert.ok(routes.includes("/billing"));
  assert.equal(routes.includes("/service-orders"), false);

  assert.equal(engine.dispatchAction(ActionTypes.SELECT_CONTEXT, { contextType: "company", companyId: "co-client-b" }).ok, true);
  routes = moduleRoutes(render(engine));
  assert.equal(engine.state.session.userId, "u-role-switch");
  assert.equal(engine.getActor().role, Roles.WAREHOUSE_WORKER);
  assert.equal(engine.getActor().companyId, "co-client-b");
  assert.equal(engine.getSnapshot().access.financialScope, "none");
  assert.ok(routes.includes("/photos"));
  assert.equal(routes.includes("/wallet"), false);

  assert.equal(engine.dispatchAction(ActionTypes.SELECT_CONTEXT, { contextType: "platform" }).ok, true);
  routes = moduleRoutes(render(engine));
  assert.equal(engine.state.session.userId, "u-role-switch");
  assert.equal(engine.getActor().role, Roles.PLATFORM_OWNER);
  assert.equal(engine.getActor().contextType, "platform");
  assert.equal(engine.getSnapshot().access.walletView, "PlatformWallet");
  assert.ok(routes.includes("/wallet"));
  assert.ok(routes.includes("/audit"));
  assert.ok(routes.includes("/system"));

  assert.equal(engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }).ok, true);
  routes = moduleRoutes(render(engine));
  assert.equal(engine.state.session.userId, "u-role-switch");
  assert.equal(engine.getActor().role, Roles.DRIVER);
  assert.equal(engine.getActor().companyId, "co-carrier-a");
  assert.equal(engine.getSnapshot().access.walletView, "UserWallet");
  assert.ok(routes.includes("/gps"));
  assert.equal(routes.includes("/audit"), false);

  const singleRoleDriver = engineForUserContext("u-driver-1", "co-carrier-a");
  const singleRoleHtml = render(singleRoleDriver);
  assert.equal(singleRoleHtml.includes("data-role-select"), false);
  assert.equal(singleRoleHtml.includes("data-context-select"), false);
});

test("e2e: driver nie widzi finansow firmy ani historii escrow, tylko UserWallet", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const snapshot = engine.getSnapshot();
  const html = render(engine);
  const routes = moduleRoutes(html);

  assert.equal(snapshot.access.financialScope, "user");
  assert.equal(snapshot.wallets.length, 1);
  assert.equal(snapshot.wallets[0].modelType, "UserWallet");
  assert.equal(snapshot.wallets[0].ownerUserId, "u-driver-1");
  assert.ok(snapshot.walletLedger.every((entry) => entry.walletId === snapshot.wallets[0].id));
  assert.equal(snapshot.walletTransactions.length, 0);
  assert.equal(snapshot.payments.length, 0);
  assert.equal(snapshot.invoices.length, 0);
  assert.equal(snapshot.settlements.length, 0);
  assert.equal(snapshot.escrows.length, 0);
  assert.equal(snapshot.escrowOperations.length, 0);
  assert.ok(routes.includes("/wallet"));
  assert.equal(routes.includes("/billing"), false);
  assert.equal(routes.includes("/invoices"), false);
});

test("e2e: role bez finansow nie widza escrowOperations", () => {
  [
    ["u-security", "co-security-a"],
    ["u-authority-police", "co-authority-police"],
    ["u-academy-student", null]
  ].forEach(([userId, companyId]) => {
    const engine = engineForUserContext(userId, companyId);
    const snapshot = engine.getSnapshot();

    assert.equal(snapshot.access.canViewFinancials, false, userId);
    assert.equal(snapshot.escrowOperations.length, 0, userId);
    assert.equal(snapshot.escrows.length, 0, userId);
    assert.equal(snapshot.walletTransactions.length, 0, userId);
  });
});

test("e2e: Platform Wallet jest widoczny tylko dla rol finansowych platformy", () => {
  [
    ["u-platform", Roles.PLATFORM_OWNER],
    ["u-gl-operator", Roles.GL_OPERATOR],
    ["u-admin-finance", Roles.ADMIN_FINANCE]
  ].forEach(([userId, role]) => {
    const engine = engineForUserContext(userId);
    const result = selectView(engine, "wallet", "/wallet");
    const snapshot = engine.getSnapshot();
    const html = render(engine);

    assert.equal(engine.getActor().role, role);
    assert.equal(result.ok, true, role);
    assert.equal(snapshot.access.canViewPlatformWallet, true, role);
    assert.ok(snapshot.wallets.some((wallet) => wallet.glWalletId === "GLW-SYSTEM-0001"), role);
    assert.ok(html.includes("GLW-SYSTEM-0001"), role);
  });

  [
    ["u-super", "super_admin"],
    ["u-admin", "admin"],
    ["u-client-owner", "client"],
    ["u-carrier-owner", "carrier"],
    ["u-driver-1", "driver"]
  ].forEach(([userId, label]) => {
    const companyId = userId === "u-client-owner"
      ? "co-client-a"
      : userId === "u-carrier-owner" || userId === "u-driver-1"
      ? "co-carrier-a"
      : null;
    const engine = engineForUserContext(userId, companyId);
    const result = selectView(engine, "wallet", "/wallet");
    const snapshot = engine.getSnapshot();
    const html = render(engine);

    assert.equal(snapshot.access.canViewPlatformWallet, false, label);
    assert.equal(snapshot.wallets.some((wallet) => wallet.glWalletId === "GLW-SYSTEM-0001"), false, label);
    assert.equal(html.includes("GLW-SYSTEM-0001"), false, label);
    if (["super_admin", "admin"].includes(label)) assert.equal(result.ok, false, label);
    if (label === "driver") assert.equal(result.ok, true, label);
  });
});

test("e2e: profil zaufania zastepuje osobny modul Reputacja GL", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const dashboardHtml = render(engine);
  const profile = selectView(engine, "profile", "/profile");
  const profileHtml = render(engine);
  const trust = selectView(engine, "trust", "/trust");
  const deniedHtml = render(engine);

  assert.equal(profile.ok, true);
  assert.ok(dashboardHtml.includes("data-profile-card=\"self\""));
  assert.equal(moduleRoutes(dashboardHtml).includes("/trust"), false);
  assert.ok(profileHtml.includes("Profil zaufania GL"));
  assert.ok(profileHtml.includes("Marek Driver"));
  assert.ok(profileHtml.includes("★"));
  assert.ok(profileHtml.includes("4.75 / 5.00"));
  assert.equal(profileHtml.includes("Trust Score Engine"), false);
  assert.equal(trust.ok, false);
  assert.ok(deniedHtml.includes("access-panel"));
});

test("e2e: profil publiczny nie ujawnia danych wrazliwych obcemu uzytkownikowi", () => {
  const engine = engineForUserContext("u-client-owner", "co-client-a");
  const transportHtml = render(engine);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId: "u-driver-1",
    profileTargetType: "user"
  });
  const profileHtml = render(engine);

  assert.equal(result.ok, true);
  assert.ok(transportHtml.includes("data-profile-target=\"u-driver-1\""));
  assert.ok(profileHtml.includes("Marek Driver"));
  assert.ok(profileHtml.includes("ukryty"));
  assert.equal(profileHtml.includes("+48500100108"), false);
  assert.equal(profileHtml.includes("GLW-SYSTEM-0001"), false);
});

test("e2e: opinia jest dostepna tylko po zakonczonej wspolpracy", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  engine.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId: "co-workshop-a",
    profileTargetType: "company"
  });
  const workshopHtml = render(engine);
  engine.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId: "u-driver-1",
    profileTargetType: "user"
  });
  const driverHtml = render(engine);

  assert.ok(workshopHtml.includes("data-profile-review-form=\"true\""));
  assert.ok(driverHtml.includes("Ocena b"));
  assert.equal(driverHtml.includes("data-profile-review-form=\"true\""), false);
});

test("e2e: polski UI nie pokazuje technicznych nazw angielskich na pulpicie i portfelu GL", () => {
  const driver = engineForUserContext("u-driver-1", "co-carrier-a");
  assertNoTechnicalEnglishUi(render(driver));

  const platform = engineForUserContext("u-platform");
  assert.equal(selectView(platform, "wallet", "/wallet").ok, true);
  assertNoTechnicalEnglishUi(render(platform));
});

test("e2e: UI rozroznia informacje, szczegoly i akcje bez martwych przyciskow", () => {
  const driver = engineForUserContext("u-driver-1", "co-carrier-a");
  const driverHtml = render(driver);
  assertButtonsHaveBehavior(driverHtml);
  assertNoTechnicalEvents(driverHtml);
  assert.equal(/<button[^>]*class="[^"]*\bmetric\b/.test(driverHtml), false);
  assert.equal(driverHtml.includes('data-action="RELEASE_PAYMENT"'), false);
  assert.ok(driverHtml.includes('data-ui-type="info"'));
  assert.ok(driverHtml.includes('data-ui-type="details"'));
  assert.ok(driverHtml.includes('data-detail-route="/transports"'));

  const carrier = engineForUserContext("u-carrier-owner", "co-carrier-a");
  assert.equal(selectView(carrier, "transports", "/transports").ok, true);
  const carrierHtml = render(carrier);
  assertButtonsHaveBehavior(carrierHtml);
  assert.ok(carrierHtml.includes('data-detail-route="/transports"'));
  assert.ok(carrierHtml.includes('data-profile-target="co-client-a"'));
});

test("e2e: przewoznik dodaje zasoby, znajduje ladunek i przypisuje kierowce oraz pojazd", () => {
  const carrier = engineForUserContext("u-carrier-owner", "co-carrier-a");
  const loadView = selectView(carrier, "create", "/loads");
  const loadHtml = render(carrier);

  assert.equal(loadView.ok, true);
  assert.ok(loadHtml.includes("Dostepne ladunki dla przewoznika"));
  assert.ok(loadHtml.includes("GL2-1003"));
  assert.ok(loadHtml.includes(`data-action="${ActionTypes.ACCEPT_CARRIER}"`));

  const driverResult = carrier.dispatchAction(ActionTypes.ADD_COMPANY_DRIVER, {
    firstName: "Ewa",
    lastName: "Carrier",
    phone: "+48500777001",
    email: "ewa.carrier@demo.gl",
    licenseCategories: "C+E",
    licenseNumber: "CE-777",
    documentsValid: true
  });
  const vehicleResult = carrier.dispatchAction(ActionTypes.ADD_VEHICLE, {
    vehicleType: "zestaw",
    brand: "Volvo",
    model: "FH",
    plate: "GL 777EC",
    registrationCountry: "PL",
    grossWeightKg: 40000,
    payloadKg: 22000,
    palletCapacity: 33,
    bodyType: "plandeka",
    status: "active"
  });
  const driver = carrier.state.users.find((user) => user.email === "ewa.carrier@demo.gl");
  const vehicle = carrier.state.vehicles.find((item) => item.plate === "GL 777EC");
  const accept = carrier.dispatchAction(ActionTypes.ACCEPT_CARRIER, { transportId: "tr-1003", carrierCompanyId: "co-carrier-a" });
  const assign = carrier.dispatchAction(ActionTypes.ASSIGN_DRIVER, { transportId: "tr-1003", driverId: driver.id, vehicleId: vehicle.id });
  const transport = carrier.state.transports.find((item) => item.id === "tr-1003");

  assert.equal(driverResult.ok, true);
  assert.equal(vehicleResult.ok, true);
  assert.equal(accept.ok, true);
  assert.equal(assign.ok, true);
  assert.equal(transport.driverId, driver.id);
  assert.equal(transport.vehicleId, vehicle.id);

  const driverContext = carrier.modules.companies.contextsForUser(driver.id).find((item) => item.companyId === "co-carrier-a");
  assert.ok(driverContext);
  carrier.state.session.userId = driver.id;
  carrier.state.session.role = driver.selectedRole;
  carrier.state.session.contextType = driverContext.contextType;
  carrier.state.session.companyId = driverContext.companyId;
  carrier.state.session.companyRoleId = driverContext.userCompanyRoleId;
  const driverSnapshot = carrier.getSnapshot();
  assert.equal(driverSnapshot.access.financialScope, "user");
  assert.equal(driverSnapshot.wallets.some((wallet) => wallet.modelType === "CompanyWallet"), false);
  assert.equal(driverSnapshot.escrowOperations.length, 0);
});
