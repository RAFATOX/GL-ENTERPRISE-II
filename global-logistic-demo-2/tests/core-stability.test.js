import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AccountStatuses,
  ActionTypes,
  CompanyRoleNames,
  CompanyVerificationStatuses,
  DEMO_DATA_VERSION,
  EventTypes,
  KnowledgeSourceTypes,
  PaymentStatuses,
  Roles,
  TransportStatuses
} from "../src/core/constants.js";
import { GLCoreEngine } from "../src/core/gl-core-engine.js";
import {
  CompanyPermissions,
  DriverPermissions,
  FinancePermissions,
  KnowledgePermissions,
  LoadPermissions,
  ModulePermissions,
  getVisibleModules,
  modulesConfig,
  permissionsForRole
} from "../src/core/modules-config.js";
import { StateStore } from "../src/core/state-store.js";
import { roleDocumentRequirements } from "../src/roles/role-verification-engine.js";
import { parsePayload } from "../src/ui/action-handler.js";
import { menuForRole, viewAllowedForRole } from "../src/ui/role-config.js";
import { renderApp, selectedTransport } from "../src/ui/renderers.js";
import { EscrowEngine } from "../src/escrow/escrow-engine.js";
import { WalletEngine } from "../src/wallets/wallet-engine.js";
import { languageOptions } from "../src/translation/language-options.js";

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

function assertNoTechnicalDashboardCards(html, label = "dashboard") {
  [
    "Event Bus",
    "Audit Log",
    "Permission Engine",
    "Company Engine",
    "User Engine",
    "Baza danych",
    "Dziennik audytu",
    "magistrala zdarze"
  ].forEach((text) => assert.equal(html.includes(text), false, `${label}: ${text}`));
}

function assertNoTechnicalUserUi(html, label = "ui") {
  [
    "UI_VIEW_CHANGED",
    "SELECT_VIEW",
    "ONBOARDING_APPROVE",
    "EventBus",
    "Permission Engine",
    "Company Engine",
    "Audit Log",
    "undefined"
  ].forEach((text) => assert.equal(html.includes(text), false, `${label}: ${text}`));
}

function assertAllButtonsHaveBehavior(html, label = "ui") {
  const buttons = [...html.matchAll(/<button\b([^>]*)>/g)];
  assert.ok(buttons.length > 0, `${label}: expected buttons`);
  buttons.forEach((match, index) => {
    const attrs = match[1];
    const hasBehavior = [
      "data-action=",
      "data-module-route=",
      "data-profile-target=",
      "data-profile-tab=",
      "data-employee-category=",
      "data-detail-route=",
      "data-role=",
      "data-language-option",
      "data-brand-menu-toggle",
      "data-brand-menu-action",
      "data-brand-menu-cancel",
      "data-brand-confirm-reset",
      "data-reset-demo=",
      "type=\"submit\""
    ].some((marker) => attrs.includes(marker));
    assert.equal(hasBehavior, true, `${label}: button ${index + 1} has no behavior: ${attrs}`);
  });
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
    ? engine.modules.companies.contextsForUser(userId).find((item) => item.companyId === companyId && item.compatibleRoles.includes(user.selectedRole))
      || engine.modules.companies.contextsForUser(userId).find((item) => item.companyId === companyId)
    : engine.modules.companies.defaultContextForUser(user);
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

function payloadFromRenderedForm(html, actionType, overrides = {}) {
  const form = extractRenderedForm(html, actionType);
  const payload = {};
  for (const select of form.matchAll(/<select\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const selected = select[2].match(/<option\b[^>]*selected[^>]*value="([^"]*)"/)
      || select[2].match(/<option\b[^>]*value="([^"]*)"/);
    if (selected) payload[select[1]] = selected[1];
  }
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    const tag = input[0];
    const name = attribute(tag, "name");
    if (!name || tag.includes("disabled")) continue;
    const type = attribute(tag, "type");
    if (type === "checkbox" && !tag.includes("checked")) continue;
    payload[name] = attribute(tag, "value") || (type === "checkbox" ? "on" : "");
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

function submitRoleDocuments(engine, userId, role) {
  const documents = Object.fromEntries(roleDocumentRequirements(role).map((key) => [key, "true"]));
  return engine.dispatchAction(ActionTypes.ONBOARDING_SUBMIT_ROLE_DOCUMENTS, { userId, role, ...documents });
}

test("new user sees registration onboarding before the application", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.ok(html.includes("Rejestracja GL Enterprise"));
  assert.ok(html.includes("Silnik rejestracji i wdrożenia GL"));
  assert.equal(html.includes("Menu modułów"), false);
  assert.equal(html.includes("Jedna aplikacja modułowa"), false);
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
  assert.ok(missingLanguage.reasons.join(" ").includes("język"));
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
  assert.ok(missingIdentity.reasons.join(" ").includes("dokument tożsamości"));
});

test("language selection renders searchable country tiles before phone onboarding", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.state.session.detectedLanguage = "de-DE";
  const html = renderApp(engine.getSnapshot(), engine);
  const tileCount = [...html.matchAll(/data-language-option/g)].length;

  assert.ok(html.includes("data-language-selection"));
  assert.ok(html.includes("data-language-search"));
  assert.ok(html.includes("Deutschland"));
  assert.ok(html.includes("Deutsch"));
  assert.ok(html.includes("Rekomendowane"));
  assert.ok(tileCount >= 50);
  assert.equal(languageOptions.length >= 50, true);
  assert.equal(html.includes(`data-form-action="${ActionTypes.ONBOARDING_START}"`), false);
});

test("language selection action persists language and unlocks phone onboarding form", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const result = engine.dispatchAction(ActionTypes.SELECT_LANGUAGE, {
    language: "en",
    country: "GB",
    detectedLanguage: "en"
  });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, true);
  assert.equal(engine.state.session.language, "en");
  assert.equal(engine.state.session.country, "GB");
  assert.equal(engine.state.session.languageSelected, true);
  assert.ok(result.events.some((event) => event.type === EventTypes.ONBOARDING_LANGUAGE_SELECTED));
  assert.ok(html.includes(`data-form-action="${ActionTypes.ONBOARDING_START}"`));
  assert.ok(html.includes('name="language" value="en"'));
  assert.ok(html.includes('name="country" value="GB"'));
  assert.ok(html.includes("Start registration"));
});

test("GL logo menu exposes safe start, language and reset options without technical labels", () => {
  const engine = engineForUserContext("u-role-switch", "co-carrier-a");
  const html = renderApp(engine.getSnapshot(), engine);

  assert.ok(html.includes("data-brand-menu-toggle"));
  assert.ok(html.includes("data-brand-menu"));
  assert.ok(html.includes("Zmień język"));
  assert.ok(html.includes("Wróć do startu"));
  assert.ok(html.includes("Reset demo"));
  assert.ok(html.includes("Czy na pewno chcesz zresetować demo?"));
  assert.ok(html.includes("data-brand-confirm-reset"));
  assert.equal(html.includes("DEMO_RESET"), false);
  assert.equal(html.includes("SELECT_LANGUAGE"), false);
  assert.equal(html.includes("UI_VIEW_CHANGED"), false);
});

test("change language from GL logo keeps demo data and returns to current app context", () => {
  const engine = engineForUserContext("u-role-switch", "co-carrier-a");
  const before = {
    userId: engine.state.session.userId,
    companyId: engine.state.session.companyId,
    transports: engine.state.transports.length,
    wallets: engine.state.wallets.length
  };

  const opened = engine.dispatchAction(ActionTypes.OPEN_LANGUAGE_SELECTION, {});
  let html = renderApp(engine.getSnapshot(), engine);
  assert.equal(opened.ok, true);
  assert.ok(html.includes("data-language-selection"));

  const selected = engine.dispatchAction(ActionTypes.SELECT_LANGUAGE, { language: "de", country: "DE" });
  html = renderApp(engine.getSnapshot(), engine);

  assert.equal(selected.ok, true);
  assert.equal(engine.state.session.language, "de");
  assert.equal(engine.state.session.onboardingRequired, false);
  assert.equal(engine.state.session.userId, before.userId);
  assert.equal(engine.state.session.companyId, before.companyId);
  assert.equal(engine.state.transports.length, before.transports);
  assert.equal(engine.state.wallets.length, before.wallets);
  assert.equal(html.includes("data-language-selection"), false);
});

test("return to start opens first onboarding screen without deleting demo data", () => {
  const engine = engineForUserContext("u-role-switch", "co-carrier-a");
  const before = {
    users: engine.state.users.length,
    companies: engine.state.companies.length,
    transports: engine.state.transports.length,
    wallets: engine.state.wallets.length
  };
  const result = engine.dispatchAction(ActionTypes.RETURN_TO_START, {});
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, true);
  assert.equal(engine.state.session.onboardingRequired, true);
  assert.equal(engine.state.session.languageSelected, false);
  assert.ok(html.includes("data-language-selection"));
  assert.equal(engine.state.users.length, before.users);
  assert.equal(engine.state.companies.length, before.companies);
  assert.equal(engine.state.transports.length, before.transports);
  assert.equal(engine.state.wallets.length, before.wallets);
});

test("browser onboarding form flow moves from language and phone to OTP and account step", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_LANGUAGE, { language: "pl", country: "PL" });
  let html = renderApp(engine.getSnapshot(), engine);

  const start = engine.dispatchAction(
    ActionTypes.ONBOARDING_START,
    payloadFromRenderedForm(html, ActionTypes.ONBOARDING_START, {
      language: "pl",
      phone: "+48500111333"
    }),
    { source: "browser-flow-test" }
  );
  const userId = start.events.find((event) => event.type === EventTypes.ONBOARDING_STARTED).objectId;
  html = renderApp(engine.getSnapshot(), engine);

  assert.equal(start.ok, true);
  assert.ok(html.includes("Weryfikacja telefonu"));
  assert.ok(html.includes(`data-form-action="${ActionTypes.ONBOARDING_VERIFY_PHONE}"`));

  const otp = engine.dispatchAction(
    ActionTypes.ONBOARDING_VERIFY_PHONE,
    payloadFromRenderedForm(html, ActionTypes.ONBOARDING_VERIFY_PHONE, { userId, otpCode: "123456" }),
    { source: "browser-flow-test" }
  );
  html = renderApp(engine.getSnapshot(), engine);

  assert.equal(otp.ok, true);
  assert.ok(html.includes("Konto użytkownika"));
  assert.ok(html.includes(`data-form-action="${ActionTypes.ONBOARDING_CREATE_ACCOUNT}"`));
});

test("minimal onboarding submit renders OTP screen in clickable onboarding layout", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_LANGUAGE, { language: "pl", country: "PL" });
  const startHtml = renderApp(engine.getSnapshot(), engine);
  const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  const result = engine.dispatchAction(
    ActionTypes.ONBOARDING_START,
    payloadFromRenderedForm(startHtml, ActionTypes.ONBOARDING_START, {
      language: "pl",
      phone: "+48500111555"
    }),
    { source: "minimal-browser-flow-test" }
  );
  const otpHtml = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, true);
  assert.ok(startHtml.includes("onboarding-app"));
  assert.match(styles, /\.onboarding-app\s*{[^}]*display:\s*block;/s);
  assert.match(styles, /\.onboarding-main\s*{[^}]*width:\s*min\(1120px,\s*100%\);/s);
  assert.ok(otpHtml.includes("Weryfikacja telefonu"));
  assert.ok(otpHtml.includes(`data-form-action="${ActionTypes.ONBOARDING_VERIFY_PHONE}"`));
  assert.equal(otpHtml.includes(`data-form-action="${ActionTypes.ONBOARDING_START}"`), false);
});

test("phone verification rejects arbitrary OTP and audits failed attempt", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const start = engine.dispatchAction(ActionTypes.ONBOARDING_START, {
    language: "pl",
    country: "PL",
    phone: "+48500111666",
    termsConsent: "true",
    identityConsent: "true",
    documentsConsent: "true"
  });
  const userId = start.events.find((event) => event.type === EventTypes.ONBOARDING_STARTED).objectId;

  const wrong = engine.dispatchAction(ActionTypes.ONBOARDING_VERIFY_PHONE, { userId, otpCode: "000000" });
  const user = engine.state.users.find((item) => item.id === userId);
  assert.equal(user.phoneVerified, false);
  const good = engine.dispatchAction(ActionTypes.ONBOARDING_VERIFY_PHONE, { userId, otpCode: "123456" });

  assert.equal(wrong.ok, false);
  assert.equal(user.phoneVerified, true);
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.AUTH_OTP_FAILED && entry.objectId === userId));
  assert.equal(good.ok, true);
});

test("login OTP expires and blocks after too many failed attempts", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const expiredStart = engine.dispatchAction(ActionTypes.AUTH_LOGIN_START, { identifier: "+48500100103" });
  const expiredChallengeId = expiredStart.events.find((event) => event.type === EventTypes.AUTH_OTP_CHALLENGE_CREATED).newState;
  const expiredChallenge = engine.state.otpChallenges.find((challenge) => challenge.id === expiredChallengeId);
  expiredChallenge.expiresAt = new Date(Date.now() - 1000).toISOString();
  const expired = engine.dispatchAction(ActionTypes.AUTH_LOGIN_VERIFY_OTP, {
    challengeId: expiredChallenge.id,
    otpCode: engine.modules.auth.peekDemoOtp(expiredChallenge.id)
  });

  const lockStart = engine.dispatchAction(ActionTypes.AUTH_LOGIN_START, { identifier: "+48500100104" });
  const lockChallengeId = lockStart.events.find((event) => event.type === EventTypes.AUTH_OTP_CHALLENGE_CREATED).newState;
  const lockChallenge = engine.state.otpChallenges.find((challenge) => challenge.id === lockChallengeId);
  engine.dispatchAction(ActionTypes.AUTH_LOGIN_VERIFY_OTP, { challengeId: lockChallenge.id, otpCode: "000000" });
  engine.dispatchAction(ActionTypes.AUTH_LOGIN_VERIFY_OTP, { challengeId: lockChallenge.id, otpCode: "111111" });
  const locked = engine.dispatchAction(ActionTypes.AUTH_LOGIN_VERIFY_OTP, { challengeId: lockChallenge.id, otpCode: "222222" });
  const lockedUser = engine.state.users.find((user) => user.id === "u-client-dispatcher");

  assert.equal(expiredStart.ok, true);
  assert.equal(expired.ok, false);
  assert.equal(expiredChallenge.status, "expired");
  assert.equal(locked.ok, false);
  assert.equal(lockChallenge.status, "locked");
  assert.ok(Date.parse(lockedUser.authLockedUntil) > Date.now());
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.AUTH_OTP_LOCKED && entry.objectId === "u-client-dispatcher"));
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.AUTH_LOGIN_FAILED && entry.objectId === "u-client-dispatcher"));
});

test("login creates active auth session and logout revokes it", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const loginStart = engine.dispatchAction(ActionTypes.AUTH_LOGIN_START, { identifier: "+48500100103" });
  const challengeId = loginStart.events.find((event) => event.type === EventTypes.AUTH_OTP_CHALLENGE_CREATED).newState;
  const challenge = engine.state.otpChallenges.find((item) => item.id === challengeId);
  const login = engine.dispatchAction(ActionTypes.AUTH_LOGIN_VERIFY_OTP, {
    challengeId: challenge.id,
    otpCode: engine.modules.auth.peekDemoOtp(challenge.id)
  });
  const session = engine.state.authSessions.find((item) => item.id === engine.state.session.authSessionId);
  const logout = engine.dispatchAction(ActionTypes.AUTH_LOGOUT);

  assert.equal(loginStart.ok, true);
  assert.equal(login.ok, true);
  assert.equal(engine.state.session.userId, null);
  assert.equal(session.userId, "u-client-owner");
  assert.equal(session.status, "revoked");
  assert.equal(logout.ok, true);
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.AUTH_LOGIN_SUCCEEDED && entry.objectId === "u-client-owner"));
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.AUTH_LOGGED_OUT && entry.objectId === "u-client-owner"));
});

test("password reset requires valid OTP and new password before login", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const resetStart = engine.dispatchAction(ActionTypes.AUTH_PASSWORD_RESET_START, { identifier: "+48500100106" });
  const challengeId = resetStart.events.find((event) => event.type === EventTypes.AUTH_OTP_CHALLENGE_CREATED).newState;
  const challenge = engine.state.otpChallenges.find((item) => item.id === challengeId);
  const wrong = engine.dispatchAction(ActionTypes.AUTH_PASSWORD_RESET_CONFIRM, {
    challengeId: challenge.id,
    otpCode: "000000",
    newPassword: "NoweHaslo123"
  });
  const reset = engine.dispatchAction(ActionTypes.AUTH_PASSWORD_RESET_CONFIRM, {
    challengeId: challenge.id,
    otpCode: engine.modules.auth.peekDemoOtp(challenge.id),
    newPassword: "NoweHaslo123"
  });
  const oldPasswordLogin = engine.dispatchAction(ActionTypes.AUTH_LOGIN_START, {
    identifier: "+48500100106",
    password: "stare"
  });
  const newPasswordLogin = engine.dispatchAction(ActionTypes.AUTH_LOGIN_START, {
    identifier: "+48500100106",
    password: "NoweHaslo123"
  });

  assert.equal(resetStart.ok, true);
  assert.equal(wrong.ok, false);
  assert.equal(reset.ok, true);
  assert.equal(oldPasswordLogin.ok, false);
  assert.equal(newPasswordLogin.ok, true);
  assert.ok(engine.state.users.find((user) => user.id === "u-carrier-owner").passwordHash);
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.AUTH_PASSWORD_RESET_SUCCEEDED && entry.objectId === "u-carrier-owner"));
});

test("company onboarding creates Company Engine company, membership, document and active company context", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const start = engine.dispatchAction(ActionTypes.ONBOARDING_START, {
    language: "pl",
    country: "PL",
    phone: "+48500111444",
    termsConsent: "true",
    identityConsent: "true",
    documentsConsent: "true"
  });
  const userId = start.events.find((event) => event.type === EventTypes.ONBOARDING_STARTED).objectId;

  engine.dispatchAction(ActionTypes.ONBOARDING_VERIFY_PHONE, { userId, otpCode: "123456" });
  engine.dispatchAction(ActionTypes.ONBOARDING_CREATE_ACCOUNT, {
    userId,
    firstName: "Anna",
    lastName: "Klient",
    email: "anna.klient@demo.gl",
    passwordMethod: "passkey_demo",
    countryOfResidence: "PL",
    userType: "transport"
  });
  engine.dispatchAction(ActionTypes.ONBOARDING_SELECT_ROLE, { userId, role: "client" });
  engine.dispatchAction(ActionTypes.ONBOARDING_SUBMIT_IDENTITY, {
    userId,
    documentType: "identity_card",
    documentCountry: "PL",
    documentExpiresAt: "2030-12-31",
    selfieConfirmed: "true"
  });
  submitRoleDocuments(engine, userId, Roles.CLIENT_OWNER);
  const companyResult = engine.dispatchAction(ActionTypes.ONBOARDING_SUBMIT_COMPANY, {
    userId,
    role: "client",
    companyName: "Demo Client Sp. z o.o.",
    vatEu: "PL9876543210",
    companyDocuments: "true",
    walletReady: "true"
  });
  const user = engine.state.users.find((item) => item.id === userId);
  const company = engine.modules.companies.getById(user.companyId);
  const membership = engine.state.userCompanyRoles.find((item) => item.userId === userId && item.companyId === company.id);
  const approve = engine.dispatchAction(ActionTypes.ONBOARDING_APPROVE, { userId, role: "client" });

  assert.equal(companyResult.ok, true);
  assert.ok(companyResult.events.some((event) => event.type === EventTypes.COMPANY_CREATED));
  assert.ok(companyResult.events.some((event) => event.type === EventTypes.COMPANY_DOCUMENT_UPLOADED));
  assert.ok(companyResult.events.some((event) => event.type === EventTypes.COMPANY_VERIFIED));
  assert.equal(company.name, "Demo Client Sp. z o.o.");
  assert.equal(company.verificationStatus, CompanyVerificationStatuses.VERIFIED);
  assert.equal(membership.roleName, CompanyRoleNames.OWNER);
  assert.equal(engine.state.companyDocuments.some((document) => document.companyId === company.id), true);
  assert.equal(approve.ok, true);
  assert.equal(engine.state.session.contextType, "company");
  assert.equal(engine.state.session.companyId, company.id);
  assert.equal(engine.getActor().permissionsSource, "company_engine");
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

test("public browser demo starts with language selection before onboarding", () => {
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key)
    }
  };
  try {
    const engine = new GLCoreEngine({ store: new StateStore("gl-public-demo-test") });
    let html = renderApp(engine.getSnapshot(), engine);

    assert.equal(engine.state.session.userId, "u-platform");
    assert.equal(engine.state.session.onboardingRequired, true);
    assert.ok(html.includes("data-language-selection"));
    assert.ok(html.includes("data-language-search"));
    assert.equal(html.includes("data-role-select"), false);
    assert.equal(html.includes("data-context-select"), false);
    const selected = engine.dispatchAction(ActionTypes.SELECT_LANGUAGE, { language: "pl", country: "PL" });
    html = renderApp(engine.getSnapshot(), engine);
    assert.equal(selected.ok, true);
    assert.ok(html.includes(`data-form-action="${ActionTypes.ONBOARDING_START}"`));
  } finally {
    delete global.window;
  }
});

test("GL Enterprise header menu reset returns demo to clean language selection", () => {
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key)
    }
  };
  try {
    const engine = new GLCoreEngine({ store: new StateStore("gl-header-reset-test") });
    let html = renderApp(engine.getSnapshot(), engine);

    assert.match(html, /<button[^>]*class="brand onboarding-brand"[^>]*data-brand-menu-toggle/);
    assert.ok(html.includes("data-brand-menu-action=\"reset\""));
    assert.ok(html.includes("data-brand-confirm-reset"));

    assert.equal(engine.dispatchAction(ActionTypes.SELECT_LANGUAGE, {
      language: "en",
      country: "GB"
    }).ok, true);
    engine.state.session.activeRole = Roles.CARRIER_OWNER;
    engine.state.session.activeContext = { contextType: "company", companyId: "co-carrier-a" };
    html = renderApp(engine.getSnapshot(), engine);
    assert.ok(html.includes(`data-form-action="${ActionTypes.ONBOARDING_START}"`));

    const reset = engine.dispatchAction(ActionTypes.RESET_DEMO, {}, { demoOnly: true });
    html = renderApp(engine.getSnapshot(), engine);

    assert.equal(reset.ok, true);
    assert.equal(engine.state.session.role, Roles.PLATFORM_OWNER);
    assert.equal(engine.state.session.view, "onboarding");
    assert.equal(engine.state.session.onboardingRequired, true);
    assert.equal(engine.state.session.activeRole, undefined);
    assert.equal(engine.state.session.activeContext, undefined);
    assert.ok(html.includes("data-language-selection"));
    assert.equal(html.includes("data-role-select"), false);
  } finally {
    delete global.window;
  }
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
    assert.ok(html.includes("Pulpit"), role);
    assert.ok(html.includes("Funkcje"), role);
    if (role !== Roles.PLATFORM_OWNER) assertNoTechnicalDashboardCards(html, role);
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
  assert.equal(modules.includes("trust"), false);
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
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "system", route: "/system" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, false);
  assert.equal(engine.state.session.deniedView, "system");
  assert.ok(html.includes("Brak dostępu"));
  assert.ok(html.includes("Brak dostępu do modułu"));
});

test("Knowledge Engine registers source and creates real audit log", () => {
  const engine = engineForUserContext("u-platform");
  const result = engine.dispatchAction(ActionTypes.CREATE_KNOWLEDGE_SOURCE, {
    title: "Testowe zrodlo wiedzy",
    type: KnowledgeSourceTypes.LEGAL_UPDATE,
    description: "Zakres testowy Knowledge Engine",
    jurisdiction_country: "PL",
    language: "pl",
    tags: ["test", "prawo"],
    related_roles: [Roles.CARRIER_OWNER],
    related_modules: ["documents"]
  });
  const source = engine.state.knowledgeSources.find((item) => item.title === "Testowe zrodlo wiedzy");
  const audit = engine.state.audit.find((entry) => entry.id === source.audit_log_id);

  assert.equal(result.ok, true);
  assert.ok(source.knowledge_source_id);
  assert.ok(source.audit_log_id);
  assert.ok(audit);
  assert.equal(audit.objectType, "knowledge_source");
});

test("Knowledge Engine searches by type, country and role", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });

  assert.ok(engine.modules.knowledge.search({ type: KnowledgeSourceTypes.ADR_REGULATION }).some((source) => source.title === "ADR"));
  assert.ok(engine.modules.knowledge.search({ country: "PL" }).some((source) => source.title.includes("OCP")));
  assert.ok(engine.modules.knowledge.search({ role: Roles.DRIVER }).some((source) => source.type === KnowledgeSourceTypes.DRIVER_WORK_TIME));
});

test("Workflow Engine can query Knowledge Engine for relevant sources", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const result = engine.modules.workflow.getRelevantKnowledge({
    roles: [Roles.DRIVER, Roles.CARRIER_OWNER],
    countries: ["PL", "CZ"],
    vehicle_type: "zestaw",
    cargo_type: "towar ADR",
    adr_required: true,
    driver_id: "u-driver-1",
    company_id: "co-carrier-a"
  }, engine.modules);

  assert.ok(result.sources.some((source) => source.type === KnowledgeSourceTypes.ADR_REGULATION));
  assert.ok(result.sources.some((source) => source.type === KnowledgeSourceTypes.DRIVER_WORK_TIME));
  assert.ok(result.warnings.length > 0);
  assert.ok(result.carrierDocuments.presentTypes.includes("carrier_license"));
});

test("Knowledge module visibility follows permissions", () => {
  const driverModules = moduleIdsFor(Roles.DRIVER);
  const platformModules = moduleIdsFor(Roles.PLATFORM_OWNER);
  const compliance = engineForUserContext("u-compliance").getActor();
  const teacherModules = moduleIdsFor(Roles.ACADEMY_TEACHER);

  assert.equal(driverModules.includes("knowledge"), false);
  assert.ok(platformModules.includes("knowledge"));
  assert.ok(teacherModules.includes("knowledge"));
  assert.ok(compliance.permissions.includes(KnowledgePermissions.MANAGE));
  assert.ok(compliance.permissions.includes(KnowledgePermissions.COMPLIANCE_READ));
});

test("Knowledge route without permission shows access denied", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "knowledge", route: "/knowledge" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, false);
  assert.equal(engine.state.session.deniedView, "knowledge");
  assert.ok(html.includes("access-panel"));
});

test("modern user profile replaces old reputation ranking for regular users", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const dashboardHtml = renderApp(engine.getSnapshot(), engine);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "profile", route: "/profile" });
  const profileHtml = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, true);
  assert.ok(dashboardHtml.includes("data-profile-card=\"self\""));
  assert.ok(dashboardHtml.includes("data-profile-target=\"u-driver-1\""));
  assert.ok(profileHtml.includes("Profil użytkownika GL"));
  assert.ok(profileHtml.includes("Marek Driver"));
  assert.ok(profileHtml.includes("Identyfikator GL"));
  assert.ok(profileHtml.includes("data-profile-tab=\"info\""));
  assert.ok(profileHtml.includes("data-profile-tab=\"reputation\""));
  assert.ok(profileHtml.includes("data-profile-tab=\"wallet\""));
  assert.ok(profileHtml.includes("★"));
  assert.ok(profileHtml.includes("4.75 / 5.00"));
  assert.ok(profileHtml.includes("Prawo jazdy"));
  assert.ok(profileHtml.includes("Portfel osobisty"));
  assert.equal(profileHtml.includes("Trust Score Engine"), false);
  assert.equal(profileHtml.includes("Reputation for companies"), false);
  assertNoTechnicalUserUi(profileHtml, "driver profile");
});

test("clickable participant target opens company trust profile without sensitive data", () => {
  const engine = engineForUserContext("u-client-owner", "co-client-a");
  const transportHtml = renderApp(engine.getSnapshot(), engine);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId: "co-carrier-a",
    profileTargetType: "company"
  });
  const profileHtml = renderApp(engine.getSnapshot(), engine);

  assert.equal(result.ok, true);
  assert.ok(transportHtml.includes("data-profile-target=\"co-carrier-a\""));
  assert.ok(profileHtml.includes("Baltic Line"));
  assert.ok(profileHtml.includes("4.80 / 5.00"));
  assert.equal(profileHtml.includes("+48500100108"), false);
  assert.equal(profileHtml.includes("GLW-SYSTEM-0001"), false);
  assertNoTechnicalUserUi(profileHtml, "company public profile");
});

test("reviews are available only after completed cooperation", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  engine.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId: "co-workshop-a",
    profileTargetType: "company"
  });
  const workshopHtml = renderApp(engine.getSnapshot(), engine);
  engine.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId: "u-driver-1",
    profileTargetType: "user"
  });
  const driverHtml = renderApp(engine.getSnapshot(), engine);

  assert.ok(workshopHtml.includes("data-profile-review-form=\"true\""));
  assert.ok(workshopHtml.includes("Dodaj opini"));
  assert.ok(driverHtml.includes("Ocena b"));
  assert.equal(driverHtml.includes("data-profile-review-form=\"true\""), false);
});

test("modern profile tabs render business data and role scoped wallets", () => {
  const appSource = readFileSync(new URL("../src/ui/app.js", import.meta.url), "utf8");
  const cases = [
    ["u-driver-1", "co-carrier-a", "Marek Driver", "Portfel osobisty", "data-wallet-scope=\"user\""],
    ["u-carrier-owner", "co-carrier-a", "Kamil Carrier", "Portfel firmowy", "data-wallet-scope=\"company\""],
    ["u-client-owner", "co-client-a", "Jan Client", "Portfel firmowy", "data-wallet-scope=\"company\""],
    ["u-platform", null, "Ewa Core", "Portfel platformy GL", "data-wallet-scope=\"platform\""]
  ];

  cases.forEach(([userId, companyId, name, walletLabel, walletScope]) => {
    const engine = engineForUserContext(userId, companyId);
    const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "profile", route: "/profile" });
    const html = renderApp(engine.getSnapshot(), engine);

    assert.equal(result.ok, true, userId);
    assert.ok(html.includes("data-profile-view=\"modern\""), userId);
    assert.ok(html.includes(name), userId);
    assert.ok(html.includes("Informacje"), userId);
    assert.ok(html.includes("Reputacja"), userId);
    assert.ok(html.includes("Opinie"), userId);
    assert.ok(html.includes("Transporty"), userId);
    assert.ok(html.includes("Dokumenty"), userId);
    assert.ok(html.includes("Portfel"), userId);
    assert.ok(html.includes("Aktywność"), userId);
    assert.ok(html.includes("data-profile-tab=\"info\""), userId);
    assert.ok(html.includes("data-profile-panel=\"wallet\""), userId);
    assert.ok(html.includes("★"), userId);
    assert.ok(html.includes(walletLabel), userId);
    assert.ok(html.includes(walletScope), userId);
    assert.equal(html.includes("activeRole"), false, userId);
    assert.equal(html.includes("activeContext"), false, userId);
    if (userId !== "u-platform") assertNoTechnicalUserUi(html, userId);
    else assert.equal(html.includes("undefined"), false, userId);
    assertAllButtonsHaveBehavior(html, userId);
  });
  assert.ok(appSource.includes("function activateProfileTab"));
  assert.ok(appSource.includes("[data-profile-tab]"));
  assert.ok(appSource.includes("[data-profile-panel]"));
});

test("old reputation route is not a public module route", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "trust", route: "/trust" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(modulesConfig.some((module) => module.route === "/trust"), false);
  assert.equal(menuForRole(Roles.DRIVER, engine.getActor()).some((module) => module.label === "Reputacja GL"), false);
  assert.equal(result.ok, false);
  assert.ok(html.includes("Brak dost"));
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
  assert.ok(driverDashboard.includes("Pulpit"));
  assert.ok(ownerDashboard.includes("Pulpit"));
  assertNoTechnicalDashboardCards(driverDashboard, "driver");
});

test("technical platform data is visible only in developer or admin panel", () => {
  const platformSystem = renderRoleView(Roles.PLATFORM_OWNER, "system", "/system");
  const operatorSystem = renderRoleView(Roles.GL_OPERATOR, "system", "/system");
  const driverSystem = renderRoleView(Roles.DRIVER, "system", "/system");
  const complianceAudit = renderRoleView(Roles.COMPLIANCE, "audit", "/audit");

  ["Tryb developerski", "Event Bus", "Audit Log", "Silnik uprawnie", "Baza danych"].forEach((text) => {
    assert.ok(platformSystem.includes(text), text);
    assert.ok(operatorSystem.includes(text), text);
  });
  assert.ok(driverSystem.includes("Brak dost"));
  assert.ok(complianceAudit.includes("Brak dost"));
  assertNoTechnicalDashboardCards(renderRoleView(Roles.DRIVER), "driver dashboard");
  assertNoTechnicalDashboardCards(renderRoleView(Roles.CLIENT_OWNER), "client dashboard");
  assertNoTechnicalDashboardCards(renderRoleView(Roles.CARRIER_OWNER), "carrier dashboard");
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

test("permission engine rejects raw role actors outside controlled demo mode", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const rawActor = {
    userId: "raw-platform-owner",
    role: Roles.PLATFORM_OWNER,
    accountStatus: AccountStatuses.VERIFIED,
    permissions: []
  };
  const rawAccess = engine.modules.permissions.canPerformAction(rawActor, ActionTypes.RELEASE_PAYMENT, {
    actor: rawActor,
    actionType: ActionTypes.RELEASE_PAYMENT,
    payload: { transportId: "tr-1001" },
    state: engine.state,
    meta: {}
  });
  const uncontrolledRoleSwitch = engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER });
  const controlledRoleSwitch = engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });

  assert.equal(rawAccess.ok, false);
  assert.match(rawAccess.reason, /Company Engine/);
  assert.equal(uncontrolledRoleSwitch.ok, false);
  assert.equal(controlledRoleSwitch.ok, true);
});

test("same user can switch active role without relogin and receives fresh permissions, menu and wallet scope", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  activateUserRole(engine, "u-role-switch", Roles.DRIVER, { contextType: "company", companyId: "co-carrier-a" });

  const expected = [
    [Roles.DRIVER, "company", "co-carrier-a", "user", "UserWallet", ["wallet", "gps", "documents"], ["billing", "audit", "system"]],
    [Roles.CARRIER_OWNER, "company", "co-carrier-a", "carrier", "CompanyWallet", ["loads", "company", "wallet"], ["audit", "system"]],
    [Roles.CLIENT_OWNER, "company", "co-client-a", "client", "CompanyWallet", ["loads", "billing", "wallet"], ["audit", "system"]],
    [Roles.WAREHOUSE_WORKER, "company", "co-client-b", "none", null, ["photos", "documents"], ["wallet", "audit", "system"]],
    [Roles.WORKSHOP, "company", "co-workshop-a", "service", "PartnerWallet", ["service-orders", "billing", "invoices"], ["wallet", "audit", "system"]],
    [Roles.INSURANCE_PARTNER, "company", "co-insurance-a", "insurance", "PartnerWallet", ["policies", "claims", "risk"], ["wallet", "audit", "system"]],
    [Roles.PLATFORM_OWNER, "platform", null, "platform", "PlatformWallet", ["wallet", "audit", "system"], []],
    [Roles.DRIVER, "company", "co-carrier-a", "user", "UserWallet", ["wallet", "gps", "documents"], ["billing", "audit", "system"]]
  ];

  expected.forEach(([role, contextType, companyId, financialScope, walletView, includedModules, excludedModules]) => {
    const result = engine.dispatchAction(ActionTypes.SELECT_ROLE, { role });
    const actor = engine.getActor();
    const snapshot = engine.getSnapshot();
    const modules = getVisibleModules(actor, actor.role).map((module) => module.id);

    assert.equal(result.ok, true, role);
    assert.equal(engine.state.session.userId, "u-role-switch", role);
    assert.equal(actor.userId, "u-role-switch", role);
    assert.equal(actor.role, role);
    assert.equal(actor.contextType, contextType, role);
    assert.equal(actor.companyId || null, companyId, role);
    assert.equal(snapshot.access.financialScope, financialScope, role);
    assert.equal(snapshot.access.walletView, walletView, role);
    includedModules.forEach((moduleId) => assert.ok(modules.includes(moduleId), `${role} should see ${moduleId}`));
    excludedModules.forEach((moduleId) => assert.equal(modules.includes(moduleId), false, `${role} should not see ${moduleId}`));
    assert.equal(actor.permissions.includes(FinancePermissions.WALLET_PLATFORM_READ), role === Roles.PLATFORM_OWNER, role);
  });
});

test("changing company context refreshes active role, dashboard menu and wallet scope", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  activateUserRole(engine, "u-role-switch", Roles.CARRIER_OWNER, { contextType: "company", companyId: "co-carrier-a" });

  const carrier = engine.getActor();
  assert.equal(carrier.role, Roles.CARRIER_OWNER);
  assert.equal(carrier.companyId, "co-carrier-a");
  assert.ok(carrier.permissions.includes(DriverPermissions.ASSIGN));

  const clientSwitch = engine.dispatchAction(ActionTypes.SELECT_CONTEXT, { contextType: "company", companyId: "co-client-a" });
  const client = engine.getActor();
  const clientModules = getVisibleModules(client, client.role).map((module) => module.id);
  assert.equal(clientSwitch.ok, true);
  assert.equal(engine.state.session.userId, "u-role-switch");
  assert.equal(client.role, Roles.CLIENT_OWNER);
  assert.equal(client.companyId, "co-client-a");
  assert.equal(engine.getSnapshot().access.financialScope, "client");
  assert.ok(clientModules.includes("loads"));
  assert.equal(client.permissions.includes(DriverPermissions.ASSIGN), false);

  const warehouseSwitch = engine.dispatchAction(ActionTypes.SELECT_CONTEXT, { contextType: "company", companyId: "co-client-b" });
  const warehouse = engine.getActor();
  const warehouseModules = getVisibleModules(warehouse, warehouse.role).map((module) => module.id);
  assert.equal(warehouseSwitch.ok, true);
  assert.equal(warehouse.role, Roles.WAREHOUSE_WORKER);
  assert.equal(warehouse.companyId, "co-client-b");
  assert.equal(engine.getSnapshot().access.financialScope, "none");
  assert.ok(warehouseModules.includes("photos"));
  assert.equal(warehouseModules.includes("wallet"), false);

  const platformSwitch = engine.dispatchAction(ActionTypes.SELECT_CONTEXT, { contextType: "platform" });
  const platform = engine.getActor();
  assert.equal(platformSwitch.ok, true);
  assert.equal(platform.role, Roles.PLATFORM_OWNER);
  assert.equal(platform.contextType, "platform");
  assert.equal(engine.getSnapshot().access.walletView, "PlatformWallet");
});

test("company.people does not grant access without active UserCompanyRole", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const company = engine.state.companies.find((item) => item.id === "co-carrier-a");
  const membership = engine.state.userCompanyRoles.find((item) => item.userId === "u-carrier-owner" && item.companyId === "co-carrier-a");

  company.people = company.people.filter((userId) => userId !== "u-carrier-owner");
  engine.state.session.userId = "u-carrier-owner";
  engine.state.session.role = Roles.CARRIER_OWNER;
  engine.state.session.contextType = "company";
  engine.state.session.companyId = "co-carrier-a";
  engine.state.session.companyRoleId = membership.id;
  const actorFromMembership = engine.getActor();

  membership.status = "removed";
  company.people.push("u-carrier-owner");
  const actorFromPeopleOnly = engine.getActor();

  assert.equal(actorFromMembership.contextType, "company");
  assert.equal(actorFromMembership.userCompanyRoleId, membership.id);
  assert.equal(actorFromPeopleOnly.contextType, "private");
  assert.notEqual(actorFromPeopleOnly.companyId, "co-carrier-a");
});

test("module menu and direct route are blocked when permission is removed from membership", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const membership = engine.state.userCompanyRoles.find((item) => item.userId === "u-driver-1" && item.companyId === "co-carrier-a");
  membership.deniedPermissions = [ModulePermissions.PHOTOS];
  const actor = engine.getActor();
  const modules = getVisibleModules(actor, actor.role).map((item) => item.id);
  const route = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "photos", route: "/photos" });
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(actor.permissions.includes(ModulePermissions.PHOTOS), false);
  assert.equal(modules.includes("photos"), false);
  assert.equal(route.ok, false);
  assert.equal(engine.state.session.deniedView, "photos");
  assert.ok(html.includes("Brak dostępu"));
});

test("carrier owner sees company and transports through permissions", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  const actor = engine.getActor();
  const modules = getVisibleModules(actor, actor.role).map((item) => item.id);

  assert.equal(actor.companyRole, CompanyRoleNames.OWNER);
  assert.ok(modules.includes("company"));
  assert.ok(modules.includes("transports"));
  assert.ok(modules.includes("loads"));
  assert.ok(actor.permissions.includes(LoadPermissions.MANAGE_COMPANY));
  assert.ok(actor.permissions.includes(DriverPermissions.MANAGE));
});

test("carrier owner sees Employees module and driver without permission is blocked", () => {
  const owner = engineForUserContext("u-carrier-owner", "co-carrier-a");
  const ownerActor = owner.getActor();
  const ownerModules = getVisibleModules(ownerActor, ownerActor.role).map((item) => item.id);
  const employeesRoute = owner.dispatchAction(ActionTypes.SELECT_VIEW, { view: "employees", route: "/employees" });
  const employeesHtml = renderApp(owner.getSnapshot(), owner);

  assert.ok(ownerActor.permissions.includes(CompanyPermissions.EMPLOYEES_MANAGE));
  assert.ok(ownerModules.includes("employees"));
  assert.equal(employeesRoute.ok, true);
  assert.ok(employeesHtml.includes("Pracownicy firmy"));
  assert.ok(employeesHtml.includes("data-employee-category=\"drivers\""));
  assert.ok(employeesHtml.includes("Spedytorzy / Dyspozytorzy"));
  assert.ok(employeesHtml.includes("Managerowie floty"));

  owner.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId: "co-carrier-a",
    profileTargetType: "company"
  });
  const profileHtml = renderApp(owner.getSnapshot(), owner);
  assert.ok(profileHtml.includes("data-profile-tab=\"employees\""));

  const driver = engineForUserContext("u-driver-1", "co-carrier-a");
  const driverActor = driver.getActor();
  const driverModules = getVisibleModules(driverActor, driverActor.role).map((item) => item.id);
  const denied = driver.dispatchAction(ActionTypes.SELECT_VIEW, { view: "employees", route: "/employees" });
  const deniedHtml = renderApp(driver.getSnapshot(), driver);

  assert.equal(driverActor.permissions.includes(CompanyPermissions.EMPLOYEES_READ), false);
  assert.equal(driverModules.includes("employees"), false);
  assert.equal(denied.ok, false);
  assert.ok(deniedHtml.includes("Brak dost"));
});

test("hiring demo employees creates UserCompanyRole, company list entry and audit log", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "employees", route: "/employees" });
  const driverHire = engine.dispatchAction(ActionTypes.HIRE_COMPANY_EMPLOYEE, {
    candidateId: "cand-driver-1",
    companyId: "co-carrier-a"
  });
  const dispatcherHire = engine.dispatchAction(ActionTypes.HIRE_COMPANY_EMPLOYEE, {
    candidateId: "cand-dispatcher-1",
    companyId: "co-carrier-a"
  });
  const fleetHire = engine.dispatchAction(ActionTypes.HIRE_COMPANY_EMPLOYEE, {
    candidateId: "cand-fleet-1",
    companyId: "co-carrier-a"
  });
  const driverMembership = engine.state.userCompanyRoles.find((item) => item.userId === "u-cand-driver-1" && item.companyId === "co-carrier-a");
  const dispatcherMembership = engine.state.userCompanyRoles.find((item) => item.userId === "u-cand-dispatcher-1" && item.companyId === "co-carrier-a");
  const fleetMembership = engine.state.userCompanyRoles.find((item) => item.userId === "u-cand-fleet-1" && item.companyId === "co-carrier-a");
  const html = renderApp(engine.getSnapshot(), engine);

  assert.equal(driverHire.ok, true);
  assert.equal(dispatcherHire.ok, true);
  assert.equal(fleetHire.ok, true);
  assert.equal(driverMembership.roleName, CompanyRoleNames.DRIVER);
  assert.equal(dispatcherMembership.roleName, CompanyRoleNames.DISPATCHER);
  assert.equal(fleetMembership.roleName, CompanyRoleNames.FLEET_MANAGER);
  assert.ok(engine.state.companies.find((item) => item.id === "co-carrier-a").people.includes("u-cand-driver-1"));
  assert.ok(engine.state.audit.some((entry) => entry.action === EventTypes.COMPANY_EMPLOYEE_HIRED && entry.objectId === driverMembership.id));
  assert.ok(html.includes("Pracownik zosta"));
  assert.ok(html.includes("Adam Nowak"));

  activateUserRole(engine, "u-cand-driver-1", Roles.DRIVER, { contextType: "company", companyId: "co-carrier-a" });
  const hiredDriver = engine.getActor();
  const hiredDriverSnapshot = engine.getSnapshot();
  assert.equal(hiredDriver.companyRole, CompanyRoleNames.DRIVER);
  assert.equal(hiredDriver.permissions.includes(FinancePermissions.WALLET_COMPANY_READ), false);
  assert.equal(hiredDriverSnapshot.access.financialScope, "user");
  assert.equal(hiredDriverSnapshot.wallets.some((wallet) => wallet.modelType === "CompanyWallet"), false);

  activateUserRole(engine, "u-cand-dispatcher-1", Roles.CARRIER_DISPATCHER, { contextType: "company", companyId: "co-carrier-a" });
  const hiredDispatcher = engine.getActor();
  const dispatcherModules = getVisibleModules(hiredDispatcher, hiredDispatcher.role).map((item) => item.id);
  assert.equal(hiredDispatcher.companyRole, CompanyRoleNames.DISPATCHER);
  assert.ok(hiredDispatcher.permissions.includes(LoadPermissions.MANAGE_COMPANY));
  assert.ok(dispatcherModules.includes("transports"));
  assert.equal(dispatcherModules.includes("wallet"), false);
  assert.equal(hiredDispatcher.permissions.includes(FinancePermissions.WALLET_COMPANY_READ), false);

  activateUserRole(engine, "u-cand-fleet-1", Roles.CARRIER_DISPATCHER, { contextType: "company", companyId: "co-carrier-a" });
  const hiredFleetManager = engine.getActor();
  const fleetModules = getVisibleModules(hiredFleetManager, hiredFleetManager.role).map((item) => item.id);
  assert.equal(hiredFleetManager.companyRole, CompanyRoleNames.FLEET_MANAGER);
  assert.ok(hiredFleetManager.permissions.includes(DriverPermissions.MANAGE));
  assert.ok(fleetModules.includes("company"));
  assert.equal(fleetModules.includes("wallet"), false);
});

test("carrier can add driver, add vehicle, search load and assign both to accepted load", () => {
  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  const driverResult = engine.dispatchAction(ActionTypes.ADD_COMPANY_DRIVER, {
    firstName: "Adam",
    lastName: "Workflow",
    phone: "+48500111901",
    email: "adam.workflow@carrier.demo",
    licenseCategories: "C+E",
    licenseNumber: "PL-CE-901",
    documentsValid: true
  });
  const vehicleResult = engine.dispatchAction(ActionTypes.ADD_VEHICLE, {
    vehicleType: "zestaw",
    brand: "MAN",
    model: "TGX",
    plate: "GL 901WF",
    registrationCountry: "PL",
    grossWeightKg: 40000,
    payloadKg: 24000,
    palletCapacity: 33,
    bodyType: "plandeka",
    adr: false,
    refrigerated: false,
    lift: true,
    status: "active"
  });
  const driver = engine.state.users.find((user) => user.email === "adam.workflow@carrier.demo");
  const vehicle = engine.state.vehicles.find((item) => item.plate === "GL 901WF");
  const membership = engine.state.userCompanyRoles.find((item) => item.userId === driver.id && item.companyId === "co-carrier-a");
  const loadsRoute = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "create", route: "/loads" });
  const loadsHtml = renderApp(engine.getSnapshot(), engine);
  const accept = engine.dispatchAction(ActionTypes.ACCEPT_CARRIER, {
    transportId: "tr-1003",
    carrierCompanyId: "co-carrier-a"
  });
  const assign = engine.dispatchAction(ActionTypes.ASSIGN_DRIVER, {
    transportId: "tr-1003",
    driverId: driver.id,
    vehicleId: vehicle.id
  });
  const transport = engine.state.transports.find((item) => item.id === "tr-1003");

  assert.equal(driverResult.ok, true);
  assert.equal(vehicleResult.ok, true);
  assert.ok(driver.roles.includes(Roles.DRIVER));
  assert.equal(driver.companyId, "co-carrier-a");
  assert.equal(membership.roleName, CompanyRoleNames.EMPLOYEE);
  assert.equal(membership.status, "active");
  assert.equal(vehicle.companyId, "co-carrier-a");
  assert.equal(vehicle.palletCapacity, 33);
  assert.equal(loadsRoute.ok, true);
  assert.ok(loadsHtml.includes("Dostepne ladunki dla przewoznika"));
  assert.ok(loadsHtml.includes("GL2-1003"));
  assert.equal(accept.ok, true);
  assert.equal(assign.ok, true);
  assert.equal(transport.carrierCompanyId, "co-carrier-a");
  assert.equal(transport.driverId, driver.id);
  assert.equal(transport.vehicleId, vehicle.id);
  assert.equal(transport.status, TransportStatuses.DRIVER_ASSIGNED);
});

test("driver assigned to carrier company sees only own UserWallet, not company finance", () => {
  const engine = engineForUserContext("u-driver-1", "co-carrier-a");
  const actor = engine.getActor();
  const snapshot = engine.getSnapshot();

  assert.equal(actor.companyRole, CompanyRoleNames.EMPLOYEE);
  assert.equal(actor.permissions.includes(FinancePermissions.WALLET_COMPANY_READ), false);
  assert.equal(snapshot.access.financialScope, "user");
  assert.equal(snapshot.wallets.length, 1);
  assert.equal(snapshot.wallets[0].modelType, "UserWallet");
  assert.equal(snapshot.wallets[0].ownerUserId, "u-driver-1");
  assert.equal(snapshot.wallets.some((wallet) => wallet.ownerCompanyId === "co-carrier-a" && wallet.modelType === "CompanyWallet"), false);
  assert.equal(snapshot.escrows.length, 0);
  assert.equal(snapshot.escrowOperations.length, 0);
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

  const escrowOperation = engine.state.escrowOperations.find((entry) => entry.transportId === "tr-1003" && entry.operationType === "reserve");
  const walletTransaction = engine.state.walletTransactions.find((entry) => entry.transportId === "tr-1003" && entry.status === "Escrow");
  assert.ok(escrowOperation.audit_log_id);
  assert.ok(walletTransaction.audit_log_id);
  assert.equal(escrowOperation.auditId, escrowOperation.audit_log_id);
  assert.equal(walletTransaction.auditId, walletTransaction.audit_log_id);
  assert.ok(engine.state.audit.some((entry) => entry.id === escrowOperation.audit_log_id && entry.action === "ESCROW_RESERVED"));
  assert.ok(engine.state.audit.some((entry) => entry.id === walletTransaction.audit_log_id && entry.action === "WALLET_HOLD_CREATED"));
  assert.ok(result.events.some((event) => event.type === "ESCROW_RESERVED" && event.audit_log_id === escrowOperation.audit_log_id));
  assert.ok(result.events.some((event) => event.type === "WALLET_HOLD_CREATED" && event.audit_log_id === walletTransaction.audit_log_id));
});

test("wallet, escrow, payout and revenue demo records all point to real audit log rows", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const auditIds = new Set(engine.state.audit.map((entry) => entry.id));
  const linkedCollections = [
    engine.state.walletLedger,
    engine.state.walletTransactions,
    engine.state.escrowOperations,
    engine.state.revenueLedger,
    engine.state.payouts,
    engine.state.payments,
    engine.state.invoices,
    engine.state.settlements,
    engine.state.disputes,
    engine.state.disputeEvidencePacks
  ];

  linkedCollections.flat().forEach((entry) => {
    const auditLogId = entry.audit_log_id || entry.auditLogId || entry.auditId;
    assert.ok(auditLogId, entry.id);
    assert.equal(entry.auditId, auditLogId, entry.id);
    assert.ok(auditIds.has(auditLogId), entry.id);
  });
});

test("wallet transaction without Audit Service fails before financial write", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const walletEngine = new WalletEngine(engine.state);
  const beforeLedger = engine.state.walletLedger.length;
  const beforeTransactions = engine.state.walletTransactions.length;

  assert.throws(
    () => walletEngine.hold("co-client-a", "tr-1003", 980, "test without audit service"),
    /Audit Service is required/
  );
  assert.equal(engine.state.walletLedger.length, beforeLedger);
  assert.equal(engine.state.walletTransactions.length, beforeTransactions);
});

test("escrow operation without Audit Service fails before escrow write", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const escrowEngine = new EscrowEngine(engine.state);
  const transport = {
    ...engine.state.transports.find((item) => item.id === "tr-1003"),
    carrierCompanyId: "co-carrier-a"
  };
  const beforeOperations = engine.state.escrowOperations.length;
  const beforeEscrows = engine.state.escrows.length;

  assert.throws(
    () => escrowEngine.reserve(transport),
    /Audit Service is required/
  );
  assert.equal(engine.state.escrowOperations.length, beforeOperations);
  assert.equal(engine.state.escrows.length, beforeEscrows);
});

test("payment status changes create a real linked audit log record", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const transport = engine.state.transports.find((item) => item.id === "tr-1003");
  const payment = engine.state.payments.find((item) => item.transportId === "tr-1003");
  const previousAuditLogId = payment.audit_log_id;

  engine.modules.payments.setStatus(transport, PaymentStatuses.BLOCKED, { reason: "test payment audit" });

  assert.ok(payment.audit_log_id);
  assert.notEqual(payment.audit_log_id, previousAuditLogId);
  assert.ok(engine.state.audit.some((entry) => (
    entry.id === payment.audit_log_id
    && entry.objectType === "payment"
    && entry.newState === PaymentStatuses.BLOCKED
  )));
});

test("dispute decision and evidence pack have real audit log records", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.PLATFORM_OWNER }, { demoOnly: true });

  const result = engine.dispatchAction(ActionTypes.ADMIN_RESOLVE_DISPUTE, {
    transportId: "tr-1004",
    decision: "release",
    reason: "test dispute decision"
  });
  const dispute = engine.state.disputes.find((item) => item.id === "dis-1");
  const evidencePack = engine.state.disputeEvidencePacks.find((item) => item.disputeId === "dis-1");
  const auditIds = new Set(engine.state.audit.map((entry) => entry.id));

  assert.equal(result.ok, true);
  assert.ok(dispute.audit_log_id);
  assert.ok(dispute.decisionAudit_log_id);
  assert.ok(evidencePack.audit_log_id);
  assert.ok(auditIds.has(dispute.audit_log_id));
  assert.ok(auditIds.has(dispute.decisionAudit_log_id));
  assert.ok(auditIds.has(evidencePack.audit_log_id));
});

test("driver and non-finance roles cannot see escrow operation history in snapshots", () => {
  const driver = engineForUserContext("u-driver-1", "co-carrier-a");
  const security = engineForUserContext("u-security", "co-security-a");
  const driverSnapshot = driver.getSnapshot();
  const securitySnapshot = security.getSnapshot();

  assert.equal(driverSnapshot.access.financialScope, "user");
  assert.equal(driverSnapshot.escrowOperations.length, 0);
  assert.equal(securitySnapshot.access.canViewFinancials, false);
  assert.equal(securitySnapshot.escrowOperations.length, 0);
  assert.equal(securitySnapshot.escrows.length, 0);
});

test("payment release creates audited wallet settlement, platform fee and escrow release records", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  const transport = engine.state.transports.find((item) => item.id === "tr-1001");
  const payment = engine.state.payments.find((item) => item.transportId === "tr-1001");
  transport.status = TransportStatuses.PAYMENT_PENDING;
  transport.paymentStatus = PaymentStatuses.RESERVED;
  payment.status = PaymentStatuses.RESERVED;
  if (!engine.state.documents.some((doc) => doc.transportId === "tr-1001" && doc.type === "delivery_confirmation")) {
    engine.state.documents.push({
      id: "doc-test-delivery-release",
      transportId: "tr-1001",
      type: "delivery_confirmation",
      label: "Potwierdzenie rozładunku test",
      integrityHash: "hash-test-delivery-release"
    });
    transport.documentIds.unshift("doc-test-delivery-release");
  }

  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.PLATFORM_OWNER }, { demoOnly: true });
  const result = engine.dispatchAction(ActionTypes.RELEASE_PAYMENT, { transportId: "tr-1001" });

  assert.equal(result.ok, true);
  const auditIds = new Set(engine.state.audit.map((entry) => entry.id));
  const releaseOperation = engine.state.escrowOperations.find((entry) => entry.transportId === "tr-1001" && entry.operationType === "release");
  const settlementRows = engine.state.walletLedger.filter((entry) => (
    entry.transportId === "tr-1001"
    && ["hold_release", "settlement_credit", "platform_fee", "insurance_premium"].includes(entry.type)
  ));
  const settlementTransactions = engine.state.walletTransactions.filter((entry) => (
    entry.transportId === "tr-1001"
    && settlementRows.some((row) => row.walletTransactionId === entry.id)
  ));

  assert.ok(releaseOperation);
  assert.ok(auditIds.has(releaseOperation.audit_log_id));
  assert.ok(engine.state.audit.some((entry) => entry.id === releaseOperation.audit_log_id && entry.action === "ESCROW_RELEASED"));
  assert.equal(settlementRows.length, 4);
  assert.equal(settlementTransactions.length, 4);
  settlementRows.forEach((entry) => assert.ok(auditIds.has(entry.audit_log_id), entry.type));
  settlementTransactions.forEach((entry) => assert.ok(auditIds.has(entry.audit_log_id), entry.type));
  assert.ok(settlementRows.some((entry) => entry.type === "platform_fee" && engine.state.audit.some((audit) => audit.id === entry.audit_log_id && audit.action === "WALLET_CREDITED")));
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
    "/wallet",
    "/billing",
    "/policies",
    "/claims",
    "/risk",
    "/service-orders",
    "/invoices",
    "/profile",
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

test("UI interaction model separates info, details and actions", () => {
  const driverHtml = renderRoleView(Roles.DRIVER);
  const carrierHtml = renderRoleView(Roles.CARRIER_OWNER, "transports", "/transports");
  const clientEngine = engineForUserContext("u-client-owner", "co-client-a");
  clientEngine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "loads", route: "/loads" });
  const clientHtml = renderApp(clientEngine.getSnapshot(), clientEngine);

  [driverHtml, carrierHtml, clientHtml].forEach((html, index) => {
    assertAllButtonsHaveBehavior(html, `role ui ${index}`);
    assert.equal(/<button[^>]*class="[^"]*\bmetric\b/.test(html), false, `metrics are clickable in ${index}`);
    assert.equal(/<article[^>]*class="[^"]*\bmetric\b[^>]*data-action=/.test(html), false, `metrics have action in ${index}`);
    assert.equal(html.includes("action blocked"), false, `blocked action button leaked in ${index}`);
    assertNoTechnicalUserUi(html, `role ui ${index}`);
  });

  assert.ok(driverHtml.includes('data-ui-type="info"'));
  assert.ok(driverHtml.includes('data-ui-type="details"'));
  assert.ok(carrierHtml.includes('data-detail-route="/transports"'));
  assert.ok(carrierHtml.includes('data-transport="tr-1001"'));
  assert.ok(carrierHtml.includes("Zobacz szczeg"));
  assert.ok(clientHtml.includes('data-ui-type="info"') || clientHtml.includes('data-ui-type="details"'));
});

test("actions without permission are not rendered as clickable buttons", () => {
  const driverHtml = renderRoleView(Roles.DRIVER, "transports", "/transports");
  const driverEngine = engineForUserContext("u-driver-1", "co-carrier-a");
  const blocked = driverEngine.explainAction(ActionTypes.RELEASE_PAYMENT, { transportId: "tr-1001" });

  assert.equal(blocked.ok, false);
  assert.equal(driverHtml.includes(`data-action="${ActionTypes.RELEASE_PAYMENT}"`), false);
  assert.equal(driverHtml.includes("action blocked"), false);
});

test("detail records expose routes for transports, companies and own profile", () => {
  const engine = engineForUserContext("u-client-owner", "co-client-a");
  const dashboardHtml = renderApp(engine.getSnapshot(), engine);
  engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "transports", route: "/transports" });
  const transportsHtml = renderApp(engine.getSnapshot(), engine);

  assert.ok(dashboardHtml.includes('data-profile-card="self"'));
  assert.ok(dashboardHtml.includes('data-profile-target="u-client-owner"'));
  assert.ok(dashboardHtml.includes('data-detail-route="/transports"'));
  assert.ok(transportsHtml.includes('data-profile-target="co-carrier-a"'));
  assert.ok(transportsHtml.includes('data-detail-route="/transports"'));
  assert.ok(transportsHtml.includes('data-transport="tr-1001"'));
});

test("UI labels are localized through Translation Engine", () => {
  const walletHtml = renderRoleView(Roles.PLATFORM_OWNER, "wallet", "/wallet");
  const driverHtml = renderRoleView(Roles.DRIVER, "dashboard", "/dashboard");
  const rendererSource = readFileSync(new URL("../src/ui/renderers.js", import.meta.url), "utf8");
  const translationSource = readFileSync(new URL("../src/translation/ui-translation-engine.js", import.meta.url), "utf8");

  [
    "Reset demo data",
    "Permission Engine",
    "Company Engine",
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

  assert.ok(walletHtml.includes("Pulpit portfela"));
  assert.ok(walletHtml.includes("Saldo dostępne"));
  assert.ok(driverHtml.includes("Dostepne funkcje"));
  assertNoTechnicalDashboardCards(driverHtml, "driver localized dashboard");
  assert.equal(rendererSource.includes("localizeHtml"), false);
  assert.equal(translationSource.includes("localizeHtml"), false);
  assert.ok(translationSource.includes("export function t("));
});
