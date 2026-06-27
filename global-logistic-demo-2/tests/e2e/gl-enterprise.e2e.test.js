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
    ? engine.modules.companies.contextsForUser(userId).find((item) => item.companyId === companyId)
    : engine.modules.companies.defaultContextForUser(user);
  assert.ok(context, `missing context for ${userId}`);
  engine.state.session.userId = userId;
  engine.state.session.role = user.selectedRole;
  engine.state.session.contextType = context.contextType;
  engine.state.session.companyId = context.companyId || null;
  engine.state.session.companyRoleId = context.userCompanyRoleId || null;
  engine.state.session.onboardingRequired = false;
  engine.state.session.onboardingUserId = null;
  return engine;
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
    "AccessDenied",
    "Dashboard Wallet",
    "Client Wallet",
    "Carrier Wallet",
    "PlatformWallet",
    "CompanyWallet",
    "Reset demo data"
  ].forEach((text) => assert.equal(html.includes(text), false, `technical English leaked to UI: ${text}`));
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

test("e2e: driver nie wchodzi na /wallet i widzi Brak dostepu", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const result = selectView(engine, "wallet", "/wallet");
  const html = render(engine);

  assert.equal(result.ok, false);
  assert.ok(html.includes("access-panel"));
  assert.ok(html.includes("Brak dostępu"));
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.ACTION_BLOCKED && entry.requestedAction === ActionTypes.SELECT_VIEW));
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
  assert.equal(driverRoutes.includes("/wallet"), false);
  assert.equal(driverModules.includes("wallet"), false);

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

test("e2e: polski UI nie pokazuje technicznych nazw angielskich na pulpicie i portfelu GL", () => {
  const driver = engineForUserContext("u-driver-1", "co-carrier-a");
  assertNoTechnicalEnglishUi(render(driver));

  const platform = engineForUserContext("u-platform");
  assert.equal(selectView(platform, "wallet", "/wallet").ok, true);
  assertNoTechnicalEnglishUi(render(platform));
});
