import {
  AccountStatuses,
  ActionTypes,
  AllRoles,
  DEMO_MODE,
  RoleLabels,
  Roles,
  StatusProgress,
  TransportStatuses
} from "../core/constants.js";
import {
  getRoleConfig,
  menuForRole,
  viewAllowedForRole
} from "./role-config.js";
import { t, translateValue } from "../translation/ui-translation-engine.js";

let uiLanguage = "pl";

function ui(key, params = {}) {
  return t(key, params, uiLanguage);
}

function valueLabel(value) {
  return translateValue(value, uiLanguage);
}

export function renderApp(state, engine) {
  state = sanitizeStateForUi(state);
  uiLanguage = state.session.language || "pl";
  if (shouldRenderOnboarding(state)) {
    return renderOnboardingApp(state, engine);
  }
  const selected = selectedTransport(state);
  const accessActor = state.access?.actor || { role: state.session.role };
  const roleConfig = getRoleConfig(state.session.role);
  const activeView = state.session.deniedView
    ? state.session.deniedView
    : viewAllowedForRole(state.session.role, state.session.view, null, accessActor)
    ? state.session.view
    : "dashboard";
  return `
    <div class="app-shell role-${state.session.role}">
      <aside class="side">
        <div class="brand">
          <div class="brand-mark">GL</div>
          <div>
            <strong>GL Enterprise II</strong>
            <span>${roleConfig.workspace}</span>
          </div>
        </div>
        ${renderAppNavigation(state, activeView)}
        <div class="core-seal">
          <span>${ui("app.active_space")}</span>
          <strong>${state.access?.activeContextLabel || roleConfig.workspace}</strong>
        </div>
      </aside>
      <main class="main">
        ${renderTopbar(state, activeView, roleConfig)}
        ${renderLastResult(state)}
        ${renderView(state, engine, selected, activeView)}
      </main>
      ${renderContextRail(state, engine, selected, roleConfig)}
    </div>
  `;
}

function shouldRenderOnboarding(state) {
  const user = onboardingUser(state);
  if (state.session.onboardingRequired) return true;
  if (!user) return true;
  return ![AccountStatuses.APPROVED, AccountStatuses.VERIFIED].includes(user.accountStatus);
}

function renderOnboardingApp(state, engine) {
  const user = onboardingUser(state);
  const missing = user ? onboardingMissing(state, engine, user) : [
    ui("onboarding.language"),
    ui("onboarding.country"),
    ui("onboarding.field.phone"),
    "zgody"
  ];
  return `
    <div class="app-shell onboarding-app">
      <main class="main onboarding-main">
        <section class="panel onboarding-hero">
          <span class="eyebrow">${ui("onboarding.engine")}</span>
          <h1>${ui("onboarding.title")}</h1>
          <p class="muted">${ui("onboarding.description")}</p>
          <div class="pipeline">
            ${[
              "onboarding.step.language",
              "onboarding.step.phone",
              "onboarding.step.account",
              "onboarding.step.role",
              "onboarding.step.identity",
              "onboarding.step.role_documents",
              "onboarding.step.approval"
            ].map((step) => `<span>${ui(step)}</span>`).join("")}
          </div>
        </section>

        <section class="grid two">
          <article class="panel">
            ${renderLastResult(state)}
            ${renderOnboardingStep(state, engine, user)}
          </article>
          <article class="panel">
            <span class="eyebrow">${ui("onboarding.status.title")}</span>
            <h2>${user ? valueLabel(user.accountStatus) : ui("onboarding.no_account")}</h2>
            <div class="detail-grid">
              <div><span>${ui("onboarding.field.phone")}</span><strong>${user?.phoneVerified ? ui("onboarding.status.confirmed") : ui("onboarding.status.required")}</strong></div>
              <div><span>${ui("onboarding.field.identity")}</span><strong>${user?.documentVerified && user?.faceVerified ? ui("onboarding.status.confirmed") : ui("onboarding.status.required")}</strong></div>
              <div><span>${ui("onboarding.field.role")}</span><strong>${user?.selectedRole ? valueLabel(user.selectedRole) : ui("onboarding.status.not_selected")}</strong></div>
              <div><span>${ui("onboarding.field.wallet_company")}</span><strong>${user?.walletReady ? ui("onboarding.status.ready") : ui("onboarding.status.required_if_applicable")}</strong></div>
            </div>
            <div class="finance-list">
              ${missing.map((item) => `<div><strong>${valueLabel(item)}</strong><span>${ui("onboarding.missing_item")}</span></div>`).join("") || `<div><strong>${ui("onboarding.ready_title")}</strong><span>${ui("onboarding.ready_message")}</span></div>`}
            </div>
          </article>
        </section>
      </main>
    </div>
  `;
}

function renderOnboardingStep(state, engine, user) {
  if (!user || !state.session.onboardingUserId) return renderOnboardingStartForm();
  if (!user.phoneVerified) return renderOtpForm(user);
  if (!user.firstName || !user.lastName || !user.email) return renderAccountForm(user);
  if (!user.selectedRole) return renderRoleSelectionForm(engine, user);
  if (!user.identityDocument || !user.documentVerified || !user.faceVerified) return renderIdentityForm(user);
  const missingDocs = onboardingRoleMissing(engine, user);
  if (missingDocs.length) return renderRoleDocumentsForm(engine, user, missingDocs);
  if (onboardingCompanyRequired(user) && user.accountStatus !== AccountStatuses.APPROVED) return renderCompanyForm(user);
  return renderOnboardingApprovalForm(user);
}

function renderOnboardingStartForm() {
  return `
    <span class="eyebrow">${ui("onboarding.step1.eyebrow")}</span>
    <h2>${ui("onboarding.step1.title")}</h2>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_START}">
      <label>${ui("onboarding.language")}<select name="language">
        <option value="pl">Polski</option>
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select></label>
      <label>${ui("onboarding.country")}<select name="country">
        <option value="PL">Polska</option>
        <option value="DE">Niemcy</option>
        <option value="NL">Holandia</option>
        <option value="CZ">Czechy</option>
      </select></label>
      <label>${ui("onboarding.phone_number")}<input name="phone" value="+48500111222" /></label>
      <label><input type="checkbox" name="termsConsent" value="true" checked /> ${ui("onboarding.terms")}</label>
      <label><input type="checkbox" name="identityConsent" value="true" checked /> ${ui("onboarding.identity_consent")}</label>
      <label><input type="checkbox" name="documentsConsent" value="true" checked /> ${ui("onboarding.documents_consent")}</label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.start")}</strong><span>${ui("onboarding.start_hint")}</span></button>
    </form>
  `;
}

function renderOtpForm(user) {
  return `
    <span class="eyebrow">${ui("onboarding.step2.eyebrow")}</span>
    <h2>${ui("onboarding.step2.title")}</h2>
    <p class="muted">${ui("onboarding.step2.description")}</p>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_VERIFY_PHONE}">
      <input type="hidden" name="userId" value="${user.id}" />
      <label>${ui("onboarding.field.phone")}<input name="phone" value="${user.phone}" disabled /></label>
      <label>${ui("onboarding.otp_code")}<input name="otpCode" value="123456" inputmode="numeric" /></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.confirm_phone")}</strong><span>${ui("onboarding.confirm_phone_hint")}</span></button>
    </form>
  `;
}

function renderAccountForm(user) {
  return `
    <span class="eyebrow">${ui("onboarding.step3.eyebrow")}</span>
    <h2>${ui("onboarding.step3.title")}</h2>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_CREATE_ACCOUNT}">
      <input type="hidden" name="userId" value="${user.id}" />
      <label>${ui("onboarding.first_name")}<input name="firstName" value="Jan" /></label>
      <label>${ui("onboarding.last_name")}<input name="lastName" value="Nowak" /></label>
      <label>${ui("onboarding.email")}<input name="email" value="jan.nowak@demo.gl" /></label>
      <label>${ui("onboarding.password")}<input name="passwordMethod" value="passkey_demo" /></label>
      <label>${ui("onboarding.country_of_residence")}<input name="countryOfResidence" value="${user.country || "PL"}" /></label>
      <label>${ui("onboarding.user_type")}<input name="userType" value="transport" /></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.create_account")}</strong><span>${ui("onboarding.create_account_hint")}</span></button>
    </form>
  `;
}

function renderRoleSelectionForm(engine, user) {
  const options = engine.modules.onboarding.roleOptions();
  return `
    <span class="eyebrow">${ui("onboarding.step4.eyebrow")}</span>
    <h2>${ui("onboarding.step4.title")}</h2>
    <p class="muted">${ui("onboarding.step4.description")}</p>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_SELECT_ROLE}">
      <input type="hidden" name="userId" value="${user.id}" />
      <label>${ui("onboarding.role")}<select name="role">
        ${options.map((item) => `<option value="${item.id}">${item.label}</option>`).join("")}
      </select></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.save_role")}</strong><span>${ui("onboarding.save_role_hint")}</span></button>
    </form>
  `;
}

function renderIdentityForm(user) {
  return `
    <span class="eyebrow">${ui("onboarding.step5.eyebrow")}</span>
    <h2>${ui("onboarding.step5.title")}</h2>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_SUBMIT_IDENTITY}">
      <input type="hidden" name="userId" value="${user.id}" />
      <label>${ui("onboarding.identity_document")}<select name="documentType">
        <option value="identity_card">${ui("onboarding.identity_card")}</option>
        <option value="passport">${ui("onboarding.passport")}</option>
        <option value="residence_card">${ui("onboarding.residence_card")}</option>
      </select></label>
      <label>${ui("onboarding.document_country")}<input name="documentCountry" value="${user.country || "PL"}" /></label>
      <label>${ui("onboarding.document_expires")}<input name="documentExpiresAt" value="2030-12-31" /></label>
      <label><input type="checkbox" name="selfieConfirmed" value="true" checked /> ${ui("onboarding.selfie_confirmed")}</label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.submit_identity")}</strong><span>${ui("onboarding.submit_identity_hint")}</span></button>
    </form>
  `;
}

function renderRoleDocumentsForm(engine, user, missingDocs) {
  return `
    <span class="eyebrow">${ui("onboarding.step6.eyebrow")}</span>
    <h2>${ui("onboarding.step6.title")}</h2>
    <p class="muted">${ui("onboarding.step6.description", { role: valueLabel(user.selectedRole) })}</p>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_SUBMIT_ROLE_DOCUMENTS}">
      <input type="hidden" name="userId" value="${user.id}" />
      <input type="hidden" name="role" value="${user.selectedRole}" />
      ${engine.modules.onboarding.requirementsForRole(user.selectedRole).map((doc) => `
        <label><input type="checkbox" name="${doc}" value="true" ${missingDocs.includes(doc) ? "checked" : "checked"} /> ${valueLabel(doc)}</label>
      `).join("")}
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.submit_role_documents")}</strong><span>${ui("onboarding.submit_role_documents_hint")}</span></button>
    </form>
  `;
}

function renderCompanyForm(user) {
  return `
    <span class="eyebrow">${ui("onboarding.step7.eyebrow")}</span>
    <h2>${ui("onboarding.step7.title")}</h2>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_SUBMIT_COMPANY}">
      <input type="hidden" name="userId" value="${user.id}" />
      <input type="hidden" name="role" value="${user.selectedRole}" />
      <label>${ui("onboarding.company_name")}<input name="companyName" value="Demo Company GL" /></label>
      <label>${ui("onboarding.vat")}<input name="vatEu" value="PL1234567890" /></label>
      <label><input type="checkbox" name="companyDocuments" value="true" checked /> ${ui("onboarding.company_documents")}</label>
      <label><input type="checkbox" name="walletReady" value="true" checked /> ${ui("onboarding.wallet_ready")}</label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.save_company")}</strong><span>${ui("onboarding.save_company_hint")}</span></button>
    </form>
  `;
}

function renderOnboardingApprovalForm(user) {
  return `
    <span class="eyebrow">${ui("onboarding.approval.eyebrow")}</span>
    <h2>${ui("onboarding.approval.title")}</h2>
    <p class="muted">${ui("onboarding.approval.description")}</p>
    <form class="demo-form" data-form-action="${ActionTypes.ONBOARDING_APPROVE}">
      <input type="hidden" name="userId" value="${user.id}" />
      <input type="hidden" name="role" value="${user.selectedRole}" />
      <button class="action ready" data-ui-type="action" type="submit"><strong>${ui("onboarding.approve_demo")}</strong><span>${ui("onboarding.approve_demo_hint")}</span></button>
    </form>
  `;
}

function onboardingUser(state) {
  if (state.session.onboardingRequired && !state.session.onboardingUserId) return null;
  return state.users.find((user) => user.id === state.session.onboardingUserId)
    || state.users.find((user) => user.id === state.session.userId)
    || null;
}

function onboardingMissing(state, engine, user) {
  if (!engine?.modules?.onboarding) return [];
  return engine.modules.onboarding.missingForUser(user);
}

function onboardingRoleMissing(engine, user) {
  const submitted = user.roleDocuments?.[user.selectedRole] || [];
  return engine.modules.onboarding.requirementsForRole(user.selectedRole).filter((doc) => !submitted.includes(doc));
}

function onboardingCompanyRequired(user) {
  return [
    Roles.CARRIER_OWNER,
    Roles.CLIENT_OWNER,
    Roles.WAREHOUSE_WORKER,
    Roles.WORKSHOP,
    Roles.MOBILE_SERVICE,
    Roles.ROADSIDE_ASSISTANCE,
    Roles.INSURANCE_PARTNER,
    Roles.CARRIER_DISPATCHER,
    Roles.SUPPORT_AGENT
  ].includes(user.selectedRole);
}

function renderAppNavigation(state, activeView) {
  const items = menuForRole(state.session.role, state.access?.actor || { role: state.session.role });
  const buttons = items.map((item) => `
    <button class="module-nav-button ${activeView === item.id ? "active" : ""}" data-ui-type="details" data-module-route="${item.route}" data-view="${item.id}">
      <span class="module-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join("");
  return `
    <nav class="nav nav-desktop">
      ${buttons}
    </nav>
    <details class="mobile-menu">
      <summary>${ui("app.menu")}</summary>
      <nav class="nav">${buttons}</nav>
    </details>
  `;
}

function renderTopbar(state, activeView, roleConfig) {
  const contexts = contextOptionsForTopbar(state);
  const roleOptions = roleOptionsForTopbar(state);
  const developer = canViewDeveloperPanel(state);
  return `
    <header class="topbar">
      <div>
        <span class="eyebrow">${state.access?.activeContextLabel || roleConfig.workspace}</span>
        <h1>${viewTitle(state.session.role, activeView, state.access?.actor || { role: state.session.role })}</h1>
      </div>
      <div class="role-login">
        ${contexts.length > 1 ? `
          <label>
            <span>${ui("topbar.active_context")}</span>
            <select data-context-select aria-label="${ui("topbar.active_context")}">
              ${contexts.map((context) => `
                <option value="${context.contextType}|${context.companyId || ""}|${context.userCompanyRoleId || ""}" ${contextSelected(state, context) ? "selected" : ""}>${context.label}</option>
              `).join("")}
            </select>
          </label>
        ` : ""}
        ${roleOptions.length > 1 ? `
          <label>
            <span>${ui("topbar.active_role")}</span>
            <select data-role-select aria-label="${ui("topbar.active_role")}">
              ${roleOptions.map((role) => `
                <option value="${role}" ${state.session.role === role ? "selected" : ""}>${RoleLabels[role] || valueLabel(role)}</option>
              `).join("")}
            </select>
          </label>
        ` : `
          <div class="role-badge">
            <span>${ui("topbar.active_role")}</span>
            <strong>${RoleLabels[state.session.role] || valueLabel(state.session.role)}</strong>
          </div>
        `}
        ${developer ? `
          <button class="reset-demo" data-ui-type="action" data-reset-demo="true">${ui("topbar.reset_demo")}</button>
        ` : ""}
      </div>
    </header>
  `;
}

function renderLastResult(state) {
  const result = state.session.lastResult;
  const developer = canViewDeveloperPanel(state);
  if (!developer) {
    if (!result || result.ok) return "";
    return `
      <section class="business-alert blocked">
        <strong>${ui("result.blocked")}</strong>
        <span>${ui("result.blocked_user_message")}</span>
      </section>
    `;
  }
  if (!result) {
    return `
      <section class="result ok">
        <strong>${ui("result.ready_title")}</strong>
        <span>${ui("result.ready_message")}</span>
      </section>
    `;
  }
  const statusLabel = result.result === "error"
    ? ui("result.error")
    : result.ok ? ui("result.success") : ui("result.blocked");
  return `
    <section class="result ${result.ok ? "ok" : "blocked"}">
      <strong>${statusLabel}</strong>
      <span>${developer
        ? (result.ok ? result.events.map(valueLabel).join(", ") : result.reasons.map(valueLabel).join("; "))
        : (result.ok ? ui("result.success_user_message") : ui("result.blocked_user_message"))}</span>
    </section>
  `;
}

function renderView(state, engine, selected, activeView = state.session.view) {
  const view = activeView;
  if (state.session.deniedView) return renderModuleAccessDenied(state);
  if (view === "system_tests") return renderSystemTests(state, engine, selected);
  if (view === "profile") return renderProfile(state);
  if (view === "knowledge") return renderKnowledgeLibrary(state, engine, selected);
  if (view === "companies") return renderCompanies(state, engine);
  if (view === "users") return renderUsers(state);
  if (view === "statistics") return renderStatistics(state);
  if (view === "system") return renderSystem(state, engine);
  if (view === "auth") return renderAuth(state, engine);
  if (view === "roles") return renderRoles(state, engine);
  if (view === "transports") return renderTransportList(state);
  if (!selected && transportScopedView(view)) return renderNoTransport(state, engine);
  if (view === "live_map") return renderGps(state, engine, selected);
  if (view === "photos") return renderPhotos(state, engine, selected);
  if (view === "academy") return renderAcademy(state);
  if (view === "details") return renderDetails(state, engine, selected);
  if (view === "shipments") return renderShipments(state);
  if (view === "create") return isCarrierActor(state) ? renderCarrierLoadSearch(state, engine, selected) : renderCreateLoad(state, engine, selected);
  if (view === "warehouse") return renderWarehouse(state, engine, selected);
  if (view === "carrier") return renderCarrier(state, engine, selected);
  if (view === "driver_assignment") return renderDriverAssignment(state, engine, selected);
  if (view === "gps") return renderGps(state, engine, selected);
  if (view === "parking") return renderParking(state, engine, selected);
  if (view === "documents") return renderDocuments(state, engine, selected);
  if (view === "wallet") return renderPlatformWallet(state, engine, selected);
  if (view === "billing") return renderBillingModule(state, "billing");
  if (view === "invoices") return renderBillingModule(state, "invoices");
  if (view === "policies") return renderPolicies(state);
  if (view === "claims") return renderClaims(state, engine, selected);
  if (view === "risk") return renderRisk(state);
  if (view === "payments") return renderPayments(state, engine, selected);
  if (view === "wallets") return renderWallets(state);
  if (view === "escrow") return renderEscrow(state);
  if (view === "revenue") return renderRevenue(state);
  if (view === "insurance") return renderInsurance(state, engine, selected);
  if (view === "jobs") return renderJobs(state);
  if (view === "communication") return renderCommunication(state, engine, selected);
  if (view === "translations") return renderTranslations(state, engine);
  if (view === "security") return renderSecurity(state, engine, selected);
  if (view === "customs") return renderCustoms(state, engine, selected);
  if (view === "authority") return renderAuthority(state, engine, selected);
  if (view === "ferry") return renderFerry(state, engine, selected);
  if (view === "service_orders") return renderService(state, engine, selected);
  if (view === "service") return renderService(state, engine, selected);
  if (view === "api") return renderApi(state, engine);
  if (view === "integrations") return renderIntegrations(state, engine);
  if (view === "compliance") return renderCompliance(state, engine, selected);
  if (view === "resilience") return renderResilience(state, engine);
  if (view === "ai") return renderAi(state, engine, selected);
  if (view === "audit") return renderAudit(state);
  if (view === "admin") return renderAdmin(state, engine, selected);
  return renderDashboard(state, engine, selected);
}

function renderDashboard(state, engine, selected) {
  const metrics = dashboardOperationalMetrics(state, selected);
  const modules = menuForRole(state.session.role, state.access?.actor || { role: state.session.role });
  return `
    <section class="business-dashboard">
      ${renderWorkspaceHero(state, selected)}
      <section class="business-metrics">
        ${metrics.map((item) => metric(item.label, item.value, item.sub)).join("")}
      </section>
      <section class="workspace-grid">
        ${renderTodayWorkPanel(state, selected)}
        ${renderBusinessFocusPanel(state, engine, selected)}
        ${renderBusinessNotificationsPanel(state, selected)}
      </section>
      ${isCarrierActor(state) ? renderCarrierOperationsPanel(state) : ""}
      ${renderBusinessModuleLauncher(modules)}
    </section>
  `;
}

function renderWorkspaceHero(state, selected) {
  const subject = resolveProfileSubject(state);
  const rating = profileRating(state, subject);
  return `
    <section class="workspace-hero">
      <div>
        <span class="eyebrow">${dashboardTitleForRole(state.session.role)}</span>
        <h2>${roleDashboardIntro(state, selected)}</h2>
        <p>${roleDashboardDescription(state)}</p>
      </div>
      <button class="workspace-identity detail-card" data-ui-type="details" data-profile-card="self" data-profile-target="${subject.id}" data-profile-type="${subject.kind}">
        <div class="profile-avatar">${profileInitials(subject.name)}</div>
        <div>
          <span>${subject.name}</span>
          <strong>${rating.hasRating ? rating.label : ui("profile.no_reviews")}</strong>
          <small>${state.access?.activeContextLabel || subject.roleLabel}</small>
        </div>
        <small class="detail-hint">Zobacz profil</small>
      </button>
    </section>
  `;
}

function renderTodayWorkPanel(state, selected) {
  const tasks = dashboardTasks(state, selected);
  return `
    <article class="panel business-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Dzisiaj</span>
          <h2>Najważniejsze zadania</h2>
        </div>
      </div>
      <div class="business-list">
        ${tasks.map((task) => `
          <div class="business-row" data-ui-type="info">
            <strong>${task.title}</strong>
            <span>${task.value}</span>
            <small>${task.note}</small>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderBusinessFocusPanel(state, engine, selected) {
  if (!selected) return renderNoTransport(state, engine);
  const progress = StatusProgress[selected.status] ?? 10;
  return `
    <article class="panel business-panel transport-focus detail-card" data-ui-type="details" data-detail-route="/transports" data-transport="${selected.id}">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Aktywny transport</span>
          <h2>${selected.number}</h2>
        </div>
        <mark class="${tone(selected.status)}">${valueLabel(selected.status)}</mark>
      </div>
      <p class="muted">${selected.cargo.description}</p>
      <div class="route-points">
        <div><span>Załadunek</span><strong>${selected.pickup.address}</strong></div>
        <div><span>Dostawa</span><strong>${selected.delivery.address}</strong></div>
      </div>
      <div class="progress">
        <span style="width:${progress}%"></span>
      </div>
      <div class="detail-grid">
        <div><span>ETA</span><strong>${selected.eta ? formatTime(selected.eta) : "brak"}</strong></div>
        <div><span>Kierowca</span><strong>${selected.driverId ? profileLink(state, selected.driverId, "user") : ui("ui.not_assigned")}</strong></div>
        <div><span>Przewoźnik</span><strong>${selected.carrierCompanyId ? profileLink(state, selected.carrierCompanyId, "company") : ui("ui.not_assigned")}</strong></div>
        <div><span>Płatność</span><strong>${state.access?.canViewFinancials ? valueLabel(selected.paymentStatus) : ui("ui.restricted")}</strong></div>
      </div>
      <small class="detail-hint">Zobacz szczegóły transportu</small>
    </article>
  `;
}

function renderBusinessNotificationsPanel(state, selected) {
  const items = operationalActivity(state, selected).slice(0, 4);
  return `
    <article class="panel business-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Komunikaty</span>
          <h2>Ostatnia aktywność</h2>
        </div>
      </div>
      <div class="business-list">
        ${items.map((item) => `
          <div class="business-row" data-ui-type="info">
            <strong>${item.title}</strong>
            <span>${item.value}</span>
            <small>${item.note}</small>
          </div>
        `).join("") || `<p class="muted">Brak nowych komunikatów.</p>`}
      </div>
    </article>
  `;
}

function renderCarrierOperationsPanel(state) {
  const companyId = activeCompanyId(state);
  const availableLoads = availableCarrierLoads(state).length;
  const drivers = carrierDrivers(state).length;
  const vehicles = carrierVehicles(state).length;
  const transports = carrierTransports(state).length;
  const items = [
    { label: "Moje ladunki", value: availableLoads, route: "/loads", note: "Szukaj i przyjmuj ladunki" },
    { label: "Moi kierowcy", value: drivers, route: "/company", note: "Zaproszenia, dokumenty, status" },
    { label: "Moje pojazdy", value: vehicles, route: "/company", note: "Flota i zgodnosc pojazdow" },
    { label: "Moje transporty", value: transports, route: "/transports", note: "Oczekujace, w trasie i zakonczone" },
    { label: "Rozliczenia", value: state.settlements.filter((item) => item.ownerCompanyId === companyId || item.carrierCompanyId === companyId).length, route: "/wallet", note: "Naleznosci, wyplaty, prowizje GL" },
    { label: "Dokumenty firmy", value: state.companyDocuments?.filter((item) => item.companyId === companyId).length || 0, route: "/company", note: "Licencje, OCP, dokumenty firmowe" },
    { label: "Profil firmy", value: profileRating(state, profileParticipant(state, companyId, "company")).label || ui("profile.no_reviews"), route: "/profile", note: "Reputacja i dane publiczne", profileTarget: companyId }
  ];

  return `
    <section class="panel business-panel carrier-workflow">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Przewoznik</span>
          <h2>Centrum pracy przewoznika</h2>
        </div>
      </div>
      <div class="module-tile-grid compact-modules">
        ${items.map((item) => item.profileTarget ? `
          <button class="module-tile" data-ui-type="details" data-profile-target="${item.profileTarget}" data-profile-type="company">
            <span class="module-icon">PF</span>
            <strong>${valueLabel(item.label)}</strong>
            <small>${valueLabel(item.note)} / ${item.value}</small>
          </button>
        ` : `
          <button class="module-tile" data-ui-type="details" data-module-route="${item.route}">
            <span class="module-icon">${String(item.label).slice(0, 2).toUpperCase()}</span>
            <strong>${valueLabel(item.label)}</strong>
            <small>${item.value} / ${valueLabel(item.note)}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderBusinessModuleLauncher(modules) {
  return `
    <section class="panel module-menu-panel business-modules">
      <div class="panel-head">
        <div>
          <span class="eyebrow">${ui("app.available_functions")}</span>
          <h2>${ui("app.module_menu")}</h2>
        </div>
      </div>
      <div class="module-tile-grid">
        ${modules.map((module) => `
          <button class="module-tile" data-ui-type="details" data-module-route="${module.route}" data-view="${module.id}">
            <span class="module-icon">${module.icon}</span>
            <strong>${valueLabel(module.label)}</strong>
            <small>${module.description ? valueLabel(module.description) : ui("app.available_for_role")}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function roleDashboardIntro(state, selected) {
  if (state.session.role === Roles.DRIVER) return selected ? `Następny kurs: ${selected.number}` : "Twoje zadania na dziś";
  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(state.session.role)) return selected ? `Ładunek ${selected.number}` : "Twoje ładunki i płatności";
  if ([Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(state.session.role)) return "Transporty, kierowcy i flota";
  if (state.session.role === Roles.WAREHOUSE_WORKER) return "Kolejka ramp i dokumenty";
  if (state.session.role === Roles.INSURANCE_PARTNER) return "Polisy, szkody i ocena ryzyka";
  if ([Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE].includes(state.session.role)) return "Zlecenia serwisowe i rozliczenia";
  return "Twoje centrum pracy";
}

function roleDashboardDescription(state) {
  if (canViewDeveloperPanel(state)) return "Widok operacyjny platformy. Dane techniczne są dostępne w module System.";
  return "Widzisz tylko informacje i funkcje potrzebne w aktywnym kontekście pracy.";
}

function dashboardOperationalMetrics(state, selected) {
  const role = state.session.role;
  const companyId = state.session.companyId;
  const userId = state.session.userId;
  const companyTransports = state.transports.filter((transport) => (
    transport.clientCompanyId === companyId
    || transport.carrierCompanyId === companyId
    || transport.driverId === userId
    || transport.warehouseWorkerId === userId
  ));
  const selectedDocs = selected ? state.documents.filter((doc) => doc.transportId === selected.id).length : state.documents.length;
  const selectedMessages = selected ? (state.messages || []).filter((message) => message.transportId === selected.id).length : (state.messages || []).length;

  if (role === Roles.DRIVER) {
    const driverTransports = state.transports.filter((transport) => transport.driverId === userId);
    const time = state.driverTime.find((item) => item.driverId === userId);
    return [
      { label: ui("dashboard.metric.my_transports"), value: driverTransports.length, sub: ui("dashboard.metric.today") },
      { label: ui("dashboard.metric.route_status"), value: valueLabel(selected?.status || ui("ui.missing")), sub: selected?.number || ui("ui.not_assigned") },
      { label: ui("dashboard.metric.eta"), value: selected?.eta ? formatTime(selected.eta) : ui("ui.missing"), sub: ui("dashboard.metric.delivery") },
      { label: ui("dashboard.metric.work_time"), value: time ? `${time.remainingLegalHours}h` : ui("ui.missing"), sub: ui("dashboard.metric.legal_time") },
      { label: ui("dashboard.metric.documents"), value: selectedDocs, sub: ui("dashboard.metric.transport_files") }
    ];
  }

  if ([Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(role)) {
    return [
      { label: ui("dashboard.metric.fleet_transports"), value: companyTransports.length, sub: ui("dashboard.metric.active_scope") },
      { label: ui("dashboard.metric.vehicles"), value: state.vehicles.filter((vehicle) => vehicle.companyId === companyId).length, sub: ui("dashboard.metric.ready") },
      { label: ui("dashboard.metric.drivers"), value: state.users.filter((user) => user.companyId === companyId && user.roles?.includes(Roles.DRIVER)).length, sub: ui("dashboard.metric.team") },
      { label: ui("dashboard.metric.service_orders"), value: (state.serviceRequests || []).filter((item) => item.carrierCompanyId === companyId).length, sub: ui("dashboard.metric.on_route") },
      { label: ui("dashboard.metric.notifications"), value: selectedMessages, sub: ui("dashboard.metric.messages") }
    ];
  }

  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(role)) {
    const clientTransports = state.transports.filter((transport) => transport.clientCompanyId === companyId);
    return [
      { label: ui("dashboard.metric.loads"), value: clientTransports.length, sub: ui("dashboard.metric.active_scope") },
      { label: ui("dashboard.metric.route_status"), value: valueLabel(selected?.status || ui("ui.missing")), sub: selected?.number || ui("ui.not_assigned") },
      { label: ui("dashboard.metric.documents"), value: selectedDocs, sub: ui("dashboard.metric.transport_files") },
      { label: ui("dashboard.metric.payments"), value: state.payments.filter((payment) => clientTransports.some((transport) => transport.id === payment.transportId)).length, sub: ui("dashboard.metric.payment_status") },
      { label: ui("dashboard.metric.notifications"), value: selectedMessages, sub: ui("dashboard.metric.messages") }
    ];
  }

  if (role === Roles.WAREHOUSE_WORKER) {
    const queue = state.transports.filter((transport) => transport.warehouseWorkerId === userId);
    return [
      { label: ui("dashboard.metric.queue"), value: queue.length, sub: ui("dashboard.metric.loading") },
      { label: ui("dashboard.metric.photos"), value: state.photos.filter((photo) => queue.some((transport) => transport.id === photo.transportId)).length, sub: ui("dashboard.metric.transport_files") },
      { label: ui("dashboard.metric.documents"), value: selectedDocs, sub: ui("dashboard.metric.transport_files") },
      { label: ui("dashboard.metric.route_status"), value: valueLabel(selected?.status || ui("ui.missing")), sub: selected?.number || ui("ui.not_assigned") },
      { label: ui("dashboard.metric.notifications"), value: selectedMessages, sub: ui("dashboard.metric.messages") }
    ];
  }

  if (role === Roles.INSURANCE_PARTNER) {
    return [
      { label: ui("dashboard.metric.policies"), value: state.insurancePolicies.length, sub: ui("dashboard.metric.active_scope") },
      { label: ui("dashboard.metric.claims"), value: (state.claims || []).length, sub: ui("dashboard.metric.open_cases") },
      { label: ui("dashboard.metric.risk"), value: state.aiAlerts.length, sub: ui("dashboard.metric.to_review") },
      { label: ui("dashboard.metric.documents"), value: state.documents.length, sub: ui("dashboard.metric.case_files") },
      { label: ui("dashboard.metric.payments"), value: state.settlements.filter((item) => item.ownerCompanyId === companyId).length, sub: ui("dashboard.metric.payment_status") }
    ];
  }

  if ([Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE].includes(role)) {
    return [
      { label: ui("dashboard.metric.service_orders"), value: (state.serviceRequests || []).filter((item) => item.providerCompanyId === companyId).length, sub: ui("dashboard.metric.active_scope") },
      { label: ui("dashboard.metric.payments"), value: (state.servicePayments || []).filter((item) => item.providerCompanyId === companyId).length, sub: ui("dashboard.metric.payment_status") },
      { label: ui("dashboard.metric.invoices"), value: state.invoices.filter((item) => item.ownerCompanyId === companyId).length, sub: ui("dashboard.metric.documents") },
      { label: ui("dashboard.metric.notifications"), value: selectedMessages, sub: ui("dashboard.metric.messages") },
      { label: ui("dashboard.metric.profile_rating"), value: profileRating(state, resolveProfileSubject(state)).label || ui("profile.no_reviews"), sub: ui("profile.reputation") }
    ];
  }

  return [
    { label: ui("dashboard.metric.active_transports"), value: companyTransports.length || state.transports.length, sub: ui("dashboard.metric.active_scope") },
    { label: ui("dashboard.metric.documents"), value: selectedDocs, sub: ui("dashboard.metric.transport_files") },
    { label: ui("dashboard.metric.notifications"), value: selectedMessages, sub: ui("dashboard.metric.messages") },
    { label: ui("dashboard.metric.profile_rating"), value: profileRating(state, resolveProfileSubject(state)).label || ui("profile.no_reviews"), sub: ui("profile.reputation") },
    { label: ui("dashboard.metric.route_status"), value: valueLabel(selected?.status || ui("ui.missing")), sub: selected?.number || ui("ui.not_assigned") }
  ];
}

function renderRoleWorkPanel(state, selected) {
  const tasks = dashboardTasks(state, selected);
  return `
    <article class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">${ui("dashboard.eyebrow")}</span>
          <h2>${dashboardTitleForRole(state.session.role)}</h2>
        </div>
      </div>
      <p class="muted">${ui("dashboard.description")}</p>
      <div class="list compact-list">
        ${tasks.map((task) => `
          <div class="row">
            <strong>${task.title}</strong>
            <span>${task.value}</span>
            <small>${task.note}</small>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function dashboardTasks(state, selected) {
  if (state.session.role === Roles.DRIVER) {
    return [
      { title: ui("dashboard.task.next_stop"), value: selected?.delivery?.address || ui("ui.missing"), note: ui("dashboard.metric.delivery") },
      { title: ui("dashboard.task.documents"), value: selected ? `${selected.documentIds.length}` : "0", note: ui("dashboard.metric.transport_files") },
      { title: ui("dashboard.task.messages"), value: `${(state.messages || []).filter((message) => !selected || message.transportId === selected.id).length}`, note: ui("dashboard.metric.messages") }
    ];
  }
  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(state.session.role)) {
    return [
      { title: ui("dashboard.task.current_transport"), value: selected?.number || ui("ui.missing"), note: valueLabel(selected?.status || ui("ui.missing")) },
      { title: ui("dashboard.task.carrier"), value: selected?.carrierCompanyId ? companyName(state, selected.carrierCompanyId) : ui("ui.not_assigned"), note: ui("profile.reputation") },
      { title: ui("dashboard.task.payment"), value: selected ? valueLabel(selected.paymentStatus) : ui("ui.missing"), note: ui("dashboard.metric.payment_status") }
    ];
  }
  if ([Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(state.session.role)) {
    return [
      { title: ui("dashboard.task.current_transport"), value: selected?.number || ui("ui.missing"), note: valueLabel(selected?.status || ui("ui.missing")) },
      { title: ui("dashboard.task.driver"), value: selected?.driverId ? userName(state, selected.driverId) : ui("ui.not_assigned"), note: ui("dashboard.metric.team") },
      { title: ui("dashboard.task.vehicle"), value: selected?.vehicleId ? vehiclePlate(state, selected.vehicleId) : ui("ui.not_assigned"), note: ui("dashboard.metric.ready") }
    ];
  }
  return [
    { title: ui("dashboard.task.current_transport"), value: selected?.number || ui("ui.missing"), note: valueLabel(selected?.status || ui("ui.missing")) },
    { title: ui("dashboard.task.documents"), value: selected ? `${selected.documentIds.length}` : `${state.documents.length}`, note: ui("dashboard.metric.transport_files") },
    { title: ui("dashboard.task.messages"), value: `${(state.messages || []).filter((message) => !selected || message.transportId === selected.id).length}`, note: ui("dashboard.metric.messages") }
  ];
}

function dashboardTitleForRole(role) {
  if (role === Roles.DRIVER) return ui("dashboard.title.driver");
  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(role)) return ui("dashboard.title.client");
  if ([Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(role)) return ui("dashboard.title.carrier");
  if (role === Roles.WAREHOUSE_WORKER) return ui("dashboard.title.warehouse");
  if (role === Roles.INSURANCE_PARTNER) return ui("dashboard.title.insurer");
  if ([Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE].includes(role)) return ui("dashboard.title.service");
  if (canViewDeveloperRole(role)) return ui("dashboard.title.platform");
  return ui("dashboard.title");
}

function renderSelfProfileCard(state) {
  const user = state.users.find((item) => item.id === state.session.userId);
  const subject = profileSubjectForUser(state, user);
  const rating = profileRating(state, subject);
  return `
    <article class="panel profile-card" data-profile-card="self">
      <div class="profile-card-head">
        <div class="profile-avatar">${profileInitials(subject.name)}</div>
        <div>
          <span class="eyebrow">${ui("profile.card_title")}</span>
          <h2>${subject.name}</h2>
          <div class="stars" aria-label="${ui("profile.rating")} ${rating.label}">${renderStars(rating.value)}</div>
        </div>
      </div>
      <p class="muted">${ui("profile.card_hint")}</p>
      <div class="profile-card-score">
        <strong>${rating.hasRating ? rating.label : ui("profile.no_reviews")}</strong>
        <span>${rating.hasRating ? ui("profile.reviews_count", { count: rating.reviewCount }) : ui("profile.no_reviews")}</span>
      </div>
      <button class="detail-button" data-ui-type="details" data-profile-target="${subject.id}" data-profile-type="${subject.kind}">
        <strong>${ui("profile.open_my_profile")}</strong>
        <span>${ui("profile.public_scope")}</span>
      </button>
    </article>
  `;
}

function renderProfilePreviewPanel(state) {
  const selected = selectedTransport(state);
  if (!selected) return renderSelfProfileCard(state);
  const participants = [
    profileParticipant(state, selected.clientCompanyId, "company"),
    profileParticipant(state, selected.carrierCompanyId, "company"),
    profileParticipant(state, selected.driverId, "user"),
    profileParticipant(state, selected.warehouseWorkerId, "user")
  ].filter(Boolean);
  return `
    <article class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">${ui("profile.reputation")}</span>
          <h2>${ui("profile.cooperation_history")}</h2>
        </div>
      </div>
      <div class="list">
        ${participants.map((participant) => {
          const rating = profileRating(state, participant);
          return `
            <button class="row profile-row detail-card" data-ui-type="details" data-profile-target="${participant.id}" data-profile-type="${participant.kind}">
              <strong>${participant.name}</strong>
              <span>${participant.roleLabel}</span>
              <small>${renderStars(rating.value)} ${rating.hasRating ? rating.label : ui("profile.no_reviews")}</small>
            </button>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function renderModuleMenuPanel(state) {
  const modules = menuForRole(state.session.role, state.access?.actor || { role: state.session.role });
  return `
    <section class="panel module-menu-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">${ui("app.available_functions")}</span>
          <h2>${ui("app.module_menu")}</h2>
        </div>
      </div>
      <div class="module-tile-grid">
        ${modules.map((module) => `
          <button class="module-tile" data-ui-type="details" data-module-route="${module.route}" data-view="${module.id}">
            <span class="module-icon">${module.icon}</span>
            <strong>${valueLabel(module.label)}</strong>
            <small>${ui("app.available_for_role")}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderModuleAccessDenied(state) {
  return `
    <section class="panel access-panel">
      <span class="eyebrow">${ui("ui.permission_guard")}</span>
      <h2>${ui("access.module_title")}</h2>
      <p class="muted">${ui("access.module_message")}</p>
    </section>
  `;
}

function renderAuth(state, engine) {
  const pending = state.users.find((user) => user.accountStatus !== AccountStatuses.APPROVED) || state.users[state.users.length - 1];
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">${ui("ui.auth_engine")}</span>
            <h2>${ui("auth.title")}</h2>
          </div>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.REGISTER_USER, ui("auth.register_phone"), { phone: "+48500777111", role: Roles.CLIENT_DISPATCHER, language: "pl", companyId: "co-client-a", name: "Użytkownik demo telefonu" })}
          ${actionButton(engine, ActionTypes.VERIFY_ACCOUNT, ui("auth.verify_identity"), { userId: pending.id })}
          ${actionButton(engine, ActionTypes.CHANGE_PHONE, ui("auth.change_phone"), { userId: pending.id, phone: "+48500777222" })}
        </div>
      </article>
      <article class="panel">
        <h2>${ui("auth.accounts")}</h2>
        <div class="list">
          ${state.users.slice(0, 10).map((user) => `
            <div class="row">
              <strong>${user.name}</strong>
              <span>${user.phone}</span>
              <mark class="${tone(user.accountStatus)}">${valueLabel(user.accountStatus)}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderRoles(state, engine) {
  return `
    <section class="panel">
        <div class="panel-head">
        <div>
          <span class="eyebrow">${ui("ui.permission_engine")}</span>
          <h2>${ui("roles.title")}</h2>
        </div>
      </div>
      <div class="role-grid">
        ${AllRoles.map((role) => `
          <article class="role-card ${state.session.role === role ? "active" : ""}">
            <button data-ui-type="action" data-role="${role}">${RoleLabels[role]}</button>
            <p>${engine.modules.permissions.listForRole(role).slice(0, 8).join(", ")}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTransportList(state) {
  const transports = isCarrierActor(state) ? carrierTransports(state) : state.transports;
  if (!transports.length) return renderNoTransportTable();
  const selected = selectedTransport(state);
  return `
    ${selected && transports.some((transport) => transport.id === selected.id) ? renderTransportCard(state, selected) : ""}
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Transporty</span>
          <h2>Aktywne zlecenia</h2>
        </div>
      </div>
      <div class="transport-table">
        <div class="table-row table-head">
          <span>Transport</span><span>Klient</span><span>Przewoznik</span><span>Status</span><span>Trasa</span><span>Platnosc</span>
        </div>
        ${transports.map((transport) => `
          <button class="table-row detail-card ${state.session.selectedTransportId === transport.id ? "selected" : ""}" data-ui-type="details" data-detail-route="/transports" data-transport="${transport.id}">
            <span>${transport.number}</span>
            <span>${profileLink(state, transport.clientCompanyId, "company")}</span>
            <span>${transport.carrierCompanyId ? profileLink(state, transport.carrierCompanyId, "company") : ui("ui.not_assigned")}</span>
            <span><mark class="${tone(transport.status)}">${valueLabel(transport.status)}</mark></span>
            <span>${transport.pickup.gps && transport.delivery.gps ? ui("ui.confirmed") : ui("ui.missing")}</span>
            <span>${state.access?.canViewFinancials ? valueLabel(transport.paymentStatus) : ui("ui.restricted")}</span>
            <small class="detail-hint">Zobacz szczegóły</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderShipments(state) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Ładunki</span>
          <h2>Ładunki w obsłudze</h2>
        </div>
      </div>
      <div class="transport-table compact-table">
        <div class="table-row table-head">
          <span>Ładunek</span><span>Transport</span><span>Klient</span><span>Status</span><span>Zdjęcia</span><span>Dokumenty</span>
        </div>
        ${state.shipments.map((shipment) => `
          <div class="table-row" data-ui-type="info">
            <span>${shipment.id}</span>
            <span>${transportNumber(state, shipment.transportId)}</span>
            <span>${companyName(state, shipment.clientCompanyId)}</span>
            <span><mark class="${tone(shipment.status)}">${valueLabel(shipment.status)}</mark></span>
            <span>${shipment.photoIds.length}</span>
            <span>${shipment.documentIds.length}</span>
          </div>
        `).join("") || `<p class="muted">Brak ładunków widocznych dla tej roli.</p>`}
      </div>
    </section>
  `;
}

function renderDetails(state, engine, selected) {
  return `
    <section class="grid two">
      ${renderTransportCard(state, selected)}
      <article class="panel">
        <h2>Kolejne kroki</h2>
        <div class="blockers">
          ${blockerList(engine, selected)}
        </div>
      </article>
    </section>
    <section class="grid two">
      ${renderTimeline(state, selected)}
      ${canViewDeveloperPanel(state) ? renderAuditSlice(state, selected) : renderPhotoList(state, selected)}
    </section>
  `;
}

function renderCreateLoad(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Nowy ładunek</span>
            <h2>Utwórz transport</h2>
          </div>
        </div>
        ${renderCreateTransportForm(state)}
        <div class="actions">
          ${actionButton(engine, ActionTypes.CREATE_LOAD, "Utworz ladunek", {
            clientCompanyId: "co-client-a",
            pickupAddress: "Wroclaw pickup",
            deliveryAddress: "Prague delivery",
            pickupGps: { lat: 51.1079, lng: 17.0385 },
            deliveryGps: { lat: 50.0755, lng: 14.4378 },
            description: "Nowy ladunek",
            weightKg: 1800,
            dimensions: "6 palet",
            price: 1600,
            warehouseWorkerId: "u-warehouse"
          })}
          ${selected ? actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Dodaj zdjecie przed publikacja", { transportId: selected.id, type: "pre_publish_load", label: "Zdjecie ladunku przed publikacja" }) : disabledAction("Dodaj zdjecie przed publikacja", "Brak transportow")}
          ${selected ? actionButton(engine, ActionTypes.CONFIRM_GPS, "Potwierdz GPS", { transportId: selected.id, pickupGps: { lat: 51.1079, lng: 17.0385 }, deliveryGps: { lat: 50.0755, lng: 14.4378 } }) : disabledAction("Potwierdz GPS", "Brak transportow")}
          ${selected ? actionButton(engine, ActionTypes.PUBLISH_LOAD, "Opublikuj wybrany ladunek", { transportId: selected.id }) : disabledAction("Opublikuj wybrany ladunek", "Brak transportow")}
        </div>
      </article>
      ${selected ? renderTransportCard(state, selected) : renderNoTransport(state, engine)}
    </section>
  `;
}

function renderCarrierLoadSearch(state, engine, selected) {
  const loads = availableCarrierLoads(state);
  const activeLoad = selected && loads.some((item) => item.id === selected.id)
    ? selected
    : loads[0] || selected;
  return `
    <section class="grid two carrier-load-search">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Szukaj ladunkow</span>
            <h2>Dostepne ladunki dla przewoznika</h2>
          </div>
          <mark class="info">${loads.length}</mark>
        </div>
        <div class="transport-table compact-table">
          <div class="table-row table-head">
            <span>Ladunek</span><span>Trasa</span><span>Wymagania</span><span>Cena</span><span>Platnosc</span>
          </div>
          ${loads.map((transport) => `
            <button class="table-row detail-card ${activeLoad?.id === transport.id ? "selected" : ""}" data-ui-type="details" data-detail-route="/loads" data-transport="${transport.id}">
              <span>${transport.number}</span>
              <span>${transport.pickup.address} -> ${transport.delivery.address}</span>
              <span>${loadRequirementsLabel(transport)}</span>
              <strong>${formatMoney(transport.price || 0, "EUR")}</strong>
              <span>${escrowStatusLabel(state, transport)}</span>
              <small class="detail-hint">Zobacz szczegoly ladunku</small>
            </button>
          `).join("") || `<p class="muted">Brak opublikowanych ladunkow dostepnych dla tej firmy.</p>`}
        </div>
      </article>
      ${activeLoad ? renderCarrierLoadDetails(state, engine, activeLoad) : renderCarrierFleetReadiness(state, engine)}
    </section>
    <section class="grid two">
      ${renderCarrierDriversPanel(state, engine)}
      ${renderCarrierVehiclesPanel(state, engine)}
    </section>
  `;
}

function renderCarrierLoadDetails(state, engine, transport) {
  const acceptedByThisCarrier = transport.carrierCompanyId === activeCompanyId(state);
  const drivers = carrierAssignableDrivers(state);
  const vehicles = carrierAssignableVehicles(state, transport);
  const firstDriver = drivers[0];
  const firstVehicle = vehicles[0];
  return `
    <article class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Szczegoly ladunku</span>
          <h2>${transport.number}</h2>
        </div>
        <mark class="${tone(transport.status)}">${valueLabel(transport.status)}</mark>
      </div>
      <p class="muted">${transport.cargo.description}</p>
      <div class="detail-grid">
        <div><span>Zaladunek</span><strong>${transport.pickup.address}</strong></div>
        <div><span>Rozladunek</span><strong>${transport.delivery.address}</strong></div>
        <div><span>Waga</span><strong>${transport.cargo.weightKg || 0} kg</strong></div>
        <div><span>Palety</span><strong>${palletsForLoad(transport)}</strong></div>
        <div><span>Klient</span><strong>${profileLink(state, transport.clientCompanyId, "company")}</strong></div>
        <div><span>Reputacja klienta</span><strong>${renderStars(profileRating(state, profileParticipant(state, transport.clientCompanyId, "company")).value)}</strong></div>
        <div><span>Escrow</span><strong>${escrowStatusLabel(state, transport)}</strong></div>
        <div><span>Cena</span><strong>${formatMoney(transport.price || 0, "EUR")}</strong></div>
      </div>
      <div class="actions">
        ${actionButton(engine, ActionTypes.ACCEPT_CARRIER, "Przyjmij ladunek", { transportId: transport.id, carrierCompanyId: activeCompanyId(state) })}
      </div>
      <div class="panel-subsection">
        <h3>Przypisanie zasobow</h3>
        <p class="muted">System pokazuje tylko zweryfikowanych kierowcow i aktywne pojazdy z tej firmy, zgodne z wymaganiami ladunku.</p>
        ${renderCarrierAssignmentForm(transport, drivers, vehicles)}
        <div class="actions">
          ${acceptedByThisCarrier && firstDriver && firstVehicle
            ? actionButton(engine, ActionTypes.ASSIGN_DRIVER, "Przypisz kierowce i pojazd", { transportId: transport.id, driverId: firstDriver.id, vehicleId: firstVehicle.id })
            : disabledAction("Przypisz kierowce i pojazd", acceptedByThisCarrier ? "Brak zweryfikowanego kierowcy lub zgodnego pojazdu" : "Najpierw przyjmij ladunek")}
        </div>
      </div>
    </article>
  `;
}

function renderCarrierAssignmentForm(transport, drivers, vehicles) {
  if (!drivers.length || !vehicles.length) {
    return `<div class="action-unavailable" data-ui-type="info"><strong>Brak gotowych zasobow</strong><span>Dodaj zweryfikowanego kierowce i aktywny pojazd w module Moja firma.</span></div>`;
  }
  return `
    <form class="demo-form" data-form-action="${ActionTypes.ASSIGN_DRIVER}" data-payload="${encodePayload({ transportId: transport.id })}">
      <label>Kierowca<select name="driverId">${drivers.map((driver) => `<option value="${driver.id}">${driver.name}</option>`).join("")}</select></label>
      <label>Pojazd<select name="vehicleId">${vehicles.map((vehicle) => `<option value="${vehicle.id}">${vehicle.plate} / ${vehicle.bodyType || vehicle.type}</option>`).join("")}</select></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>Przypisz z formularza</strong><span>Silnik sprawdzi dokumenty, firme, pojazd i status escrow</span></button>
    </form>
  `;
}

function renderCarrierFleetReadiness(state, engine) {
  return `
    <article class="panel">
      <span class="eyebrow">Gotowosc floty</span>
      <h2>Zasoby przewoznika</h2>
      <p class="muted">Dodaj kierowce i pojazd w module Moja firma, a potem wroc do wyszukiwarki ladunkow.</p>
    </article>
  `;
}

function renderCarrierDriversPanel(state, engine) {
  const drivers = carrierDrivers(state);
  return `
    <article class="panel carrier-drivers">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Moi kierowcy</span>
          <h2>Kierowcy firmy</h2>
        </div>
        <mark class="info">${drivers.length}</mark>
      </div>
      ${renderAddDriverForm(state)}
      <div class="transport-table compact-table">
        <div class="table-row table-head">
          <span>Kierowca</span><span>Kontakt</span><span>Weryfikacja</span><span>Dokumenty</span><span>Czas pracy</span>
        </div>
        ${drivers.map((driver) => `
          <button class="table-row detail-card" data-ui-type="details" data-profile-target="${driver.id}" data-profile-type="user">
            <span>${driver.name}</span>
            <span>${driver.email || driver.phone || ui("ui.missing")}</span>
            <span>${valueLabel(driver.accountStatus || driver.verificationStatus)}</span>
            <span>${driver.documentsValid ? "Prawo jazdy OK" : "Brak dokumentow"}</span>
            <span>${driverTimeLabel(state, driver.id)}</span>
            <small class="detail-hint">Zobacz profil kierowcy</small>
          </button>
        `).join("") || `<p class="muted">Brak kierowcow przypisanych do firmy.</p>`}
      </div>
    </article>
  `;
}

function renderCarrierVehiclesPanel(state, engine) {
  const vehicles = carrierVehicles(state);
  return `
    <article class="panel carrier-vehicles">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Moje pojazdy</span>
          <h2>Flota przewoznika</h2>
        </div>
        <mark class="info">${vehicles.length}</mark>
      </div>
      ${renderAddVehicleForm()}
      <div class="transport-table compact-table">
        <div class="table-row table-head">
          <span>Pojazd</span><span>Typ</span><span>Ladownosc</span><span>Wyposazenie</span><span>Status</span>
        </div>
        ${vehicles.map((vehicle) => `
          <button class="table-row detail-card" data-ui-type="details" data-detail-route="/company" data-vehicle="${vehicle.id}">
            <span>${vehicle.plate}</span>
            <span>${vehicle.brand || ""} ${vehicle.model || ""} / ${vehicle.vehicleType || vehicle.type}</span>
            <span>${vehicle.payloadKg || 0} kg / ${vehicle.palletCapacity || 0} palet</span>
            <span>${vehicleFeatureLabel(vehicle)}</span>
            <span>${vehicleStatusLabel(vehicle)}</span>
            <small class="detail-hint">Zobacz karte pojazdu</small>
          </button>
        `).join("") || `<p class="muted">Brak pojazdow w firmie.</p>`}
      </div>
    </article>
  `;
}

function renderAddDriverForm(state) {
  return `
    <form class="demo-form carrier-form" data-form-action="${ActionTypes.ADD_COMPANY_DRIVER}">
      <label>Imie<input name="firstName" value="Adam" /></label>
      <label>Nazwisko<input name="lastName" value="Nowak" /></label>
      <label>Telefon<input name="phone" value="+48500666001" /></label>
      <label>E-mail<input name="email" value="adam.nowak@carrier.demo" /></label>
      <label>Kategorie prawa jazdy<input name="licenseCategories" value="C+E" /></label>
      <label>Numer prawa jazdy<input name="licenseNumber" value="PL/CE/2026/001" /></label>
      <label>Dokumenty<select name="documentsValid"><option value="true">Zweryfikowane</option><option value="false">Do uzupelnienia</option></select></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>Dodaj kierowce</strong><span>Utworzy konto kierowcy i przypisze go do firmy</span></button>
    </form>
  `;
}

function renderAddVehicleForm() {
  return `
    <form class="demo-form carrier-form" data-form-action="${ActionTypes.ADD_VEHICLE}">
      <label>Typ pojazdu<select name="vehicleType">
        <option value="zestaw">Zestaw</option>
        <option value="bus">Bus</option>
        <option value="solo">Solo</option>
        <option value="tir">TIR</option>
        <option value="chlodnia">Chlodnia</option>
        <option value="laweta">Laweta</option>
        <option value="inne">Inne</option>
      </select></label>
      <label>Marka<input name="brand" value="MAN" /></label>
      <label>Model<input name="model" value="TGX" /></label>
      <label>Rejestracja<input name="plate" value="GL 2026T" /></label>
      <label>Kraj rejestracji<input name="registrationCountry" value="PL" /></label>
      <label>DMC kg<input name="grossWeightKg" value="40000" inputmode="numeric" /></label>
      <label>Ladownosc kg<input name="payloadKg" value="24000" inputmode="numeric" /></label>
      <label>Palety<input name="palletCapacity" value="33" inputmode="numeric" /></label>
      <label>Zabudowa<input name="bodyType" value="plandeka" /></label>
      <label>ADR<select name="adr"><option value="false">Nie</option><option value="true">Tak</option></select></label>
      <label>Chlodnia<select name="refrigerated"><option value="false">Nie</option><option value="true">Tak</option></select></label>
      <label>Winda<select name="lift"><option value="false">Nie</option><option value="true">Tak</option></select></label>
      <label>Status<select name="status"><option value="active">Aktywny</option><option value="inactive">Nieaktywny</option><option value="service">W serwisie</option></select></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>Dodaj pojazd</strong><span>Silnik zapisze pojazd w firmie przewoznika</span></button>
    </form>
  `;
}

function renderWarehouse(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Załadunek</span>
        <h2>Zdjęcia i potwierdzenie</h2>
        <p class="muted">Przed publikacją i załadunkiem dodaj zdjęcia przypisane do transportu.</p>
        ${renderPhotoForm(selected)}
        <div class="actions">
          ${actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Zdjecie przed publikacja", { transportId: selected.id, type: "pre_publish_load", label: "Ladunek przed publikacja" })}
          ${actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Zdjecie przy zaladunku", { transportId: selected.id, type: "loading", label: "Zdjecie przy zaladunku" })}
          ${actionButton(engine, ActionTypes.CONFIRM_LOADING, "Potwierdz zaladunek", { transportId: selected.id })}
        </div>
      </article>
      ${renderPhotoList(state, selected)}
    </section>
  `;
}

function renderCarrier(state, engine, selected) {
  if (isCarrierActor(state)) return renderCarrierLoadDetails(state, engine, selected);
  const carriers = state.companies.filter((company) => company.type === "carrier");
  return `
    <section class="panel">
      <span class="eyebrow">Przewoźnik</span>
      <h2>Wybór przewoźnika</h2>
      <div class="card-grid">
        ${carriers.map((carrier) => `
          <article class="mini-card" data-ui-type="info">
            <strong>${profileLink(state, carrier.id, "company")}</strong>
            <span>${renderStars(profileRating(state, profileParticipant(state, carrier.id, "company")).value)}</span>
            ${actionButton(engine, ActionTypes.ACCEPT_CARRIER, "Akceptuj przewoznika", { transportId: selected.id, carrierCompanyId: carrier.id })}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDriverAssignment(state, engine, selected) {
  const drivers = carrierAssignableDrivers(state);
  const vehicles = carrierAssignableVehicles(state, selected);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Kierowca i pojazd</span>
        <h2>Przypisanie do transportu</h2>
        ${renderCarrierAssignmentForm(selected, drivers, vehicles)}
      </article>
      ${renderCarrierLoadDetails(state, engine, selected)}
    </section>
  `;
}

function renderGps(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">GL GPS</span>
        <h2>Pozycja i trasa</h2>
        <img class="map" src="./assets/route-network.svg" alt="GL route network" />
        <div class="detail-grid">
          <div><span>Załadunek</span><strong>${gpsLabel(selected.pickup.gps)}</strong></div>
          <div><span>Dostawa</span><strong>${gpsLabel(selected.delivery.gps)}</strong></div>
          <div><span>Odchylenie trasy</span><strong>${selected.routeDeviation ? ui("ui.yes") : ui("ui.no")}</strong></div>
        </div>
        ${renderGpsForm(selected)}
        ${actionButton(engine, ActionTypes.CONFIRM_GPS, "Potwierdz wybrany GPS", { transportId: selected.id, pickupGps: { lat: 54.352, lng: 18.6466 }, deliveryGps: { lat: 52.52, lng: 13.405 } })}
      </article>
      ${renderTimeline(state, selected)}
    </section>
  `;
}

function renderParking(state, engine, selected) {
  return `
    <section class="panel">
      <span class="eyebrow">Parking Live Network</span>
      <h2>Dostępne parkingi</h2>
      ${renderParkingReportForm(state)}
      <div class="card-grid">
        ${state.parking.map((parking) => `
          <article class="mini-card" data-ui-type="info">
            <strong>${parking.name}</strong>
            <span>${parking.freePlaces} wolnych miejsc / ocena ${parking.trustScore}</span>
            <span>${parking.amenities.join(", ")}</span>
            ${actionButton(engine, ActionTypes.SELECT_PARKING, "Wybierz", { transportId: selected.id, parkingId: parking.id })}
            ${actionButton(engine, ActionTypes.PARKING_REPORT, "Zglos wolne miejsca", { parkingId: parking.id, freePlaces: parking.freePlaces + 2, photoAdded: true, credible: true })}
            ${actionButton(engine, ActionTypes.PARKING_REPORT, "Zglos brak potwierdzenia", { parkingId: parking.id, freePlaces: 99, photoAdded: false, credible: false })}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDocuments(state, engine, selected) {
  const docs = state.documents.filter((doc) => doc.transportId === selected.id);
  const cmr = state.digitalCmrs.find((item) => item.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Dokumenty</span>
        <h2>Dokumenty transportu</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Dodaj CMR", { transportId: selected.id, type: "cmr", label: "CMR transportu" })}
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Dodaj potwierdzenie zaladunku", { transportId: selected.id, type: "pickup_confirmation", label: "Potwierdzenie zaladunku" })}
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Dodaj potwierdzenie rozladunku", { transportId: selected.id, type: "delivery_confirmation", label: "Potwierdzenie rozladunku" })}
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Dodaj dokument szkody", { transportId: selected.id, type: "damage_report", label: "Dokument szkody" })}
        </div>
      </article>
      <article class="panel">
        <h2>Lista dokumentów</h2>
        <div class="list">
          ${cmr ? `
            <div class="row">
              <strong>Digital CMR ${cmr.id}</strong>
              <span>${cmr.signatures.join(", ")}</span>
              <mark class="${tone(cmr.status)}">${valueLabel(cmr.status)}</mark>
            </div>
          ` : ""}
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${formatTime(doc.uploadedAt)}</small>
            </div>
          `).join("") || `<p class="muted">Brak dokumentów dla wybranego transportu.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderPhotos(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Zdjecia GL</span>
        <h2>Dowody zdjeciowe transportu</h2>
        <p class="muted">Dodaj zdjęcia załadunku, rozładunku, szkody albo stanu ładunku.</p>
        <div class="actions">
          ${selected ? actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Dodaj zdjecie", { transportId: selected.id, type: "loading", label: "Zdjecie transportowe" }) : disabledAction("Dodaj zdjecie", "Brak transportow")}
        </div>
      </article>
      ${selected ? renderPhotoList(state, selected) : renderNoTransport(state, engine)}
    </section>
  `;
}

function renderAcademy(state) {
  const isStudent = state.session.role === Roles.ACADEMY_STUDENT;
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Akademia GL</span>
        <h2>${isStudent ? "Panel studenta" : "Panel szkolen"}</h2>
        <p class="muted">Szkolenia i certyfikaty przypisane do aktywnego profilu.</p>
        <div class="detail-grid">
          <div><span>Kursy</span><strong>4</strong></div>
          <div><span>Certyfikaty</span><strong>2</strong></div>
          <div><span>Status</span><strong>${isStudent ? "student" : "trener / uczestnik"}</strong></div>
        </div>
      </article>
      <article class="panel">
        <h2>Program</h2>
        <div class="list">
          <div class="row"><strong>Bezpieczny zaladunek</strong><span>transport</span><mark class="good">gotowe</mark></div>
          <div class="row"><strong>CMR i dokumenty</strong><span>praktyka</span><mark class="warning">w toku</mark></div>
          <div class="row"><strong>GPS i ETA</strong><span>trasa</span><mark class="good">gotowe</mark></div>
        </div>
      </article>
    </section>
  `;
}

function renderKnowledgeLibrary(state, engine, selected) {
  const sources = state.knowledgeSources || [];
  const auditIds = new Set((state.audit || []).map((entry) => entry.id || entry.audit_log_id));
  const relevant = selected && engine?.modules?.workflow
    ? engine.modules.workflow.getRelevantKnowledge({
      roles: [state.session.role],
      countries: ["PL", "EU"],
      transport_type: selected.transportMode || "ROAD",
      vehicle_type: state.vehicles.find((vehicle) => vehicle.id === selected.vehicleId)?.type || null,
      cargo_type: selected.cargo?.description || null,
      adr_required: Boolean(selected.adrRequired),
      driver_id: selected.driverId,
      company_id: selected.carrierCompanyId || state.access?.actor?.companyId
    }, engine.modules)
    : { sources: [], warnings: [], carrierDocuments: null };

  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Silnik wiedzy GL</span>
            <h2>Biblioteka wiedzy GL</h2>
          </div>
          <mark class="info">DEMO</mark>
        </div>
        <p class="muted">Centralny rejestr zrodel wiedzy dla workflow, AI Control, Akademii GL, dokumentow i zgodnosci. Na tym etapie system tylko informuje, nie blokuje transportow.</p>
        <div class="metrics">
          ${metric("Zrodla aktywne", sources.filter((source) => source.status === "active").length, "wersjonowane")}
          ${metric("Audyt", sources.filter((source) => auditIds.has(source.audit_log_id)).length, "realne wpisy")}
          ${metric("Materialy akademii", sources.filter((source) => source.type === "academy_material").length, "przyszle szkolenia")}
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.CREATE_KNOWLEDGE_SOURCE, "Dodaj zrodlo wiedzy", {
            title: "Aktualizacja prawna demo",
            type: "legal_update",
            description: "Informacyjne zrodlo demo dodane przez Knowledge Engine",
            jurisdiction_country: "PL",
            language: "pl",
            tags: ["prawo", "demo"],
            related_roles: [Roles.CARRIER_OWNER],
            related_modules: ["documents", "transport"],
            source_reference: "demo"
          })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Workflow Engine</span>
        <h2>Dopasowanie do transportu</h2>
        <div class="list">
          ${(relevant.sources || []).slice(0, 5).map((source) => `
            <div class="row" data-ui-type="info">
              <strong>${valueLabel(source.title)}</strong>
              <span>${knowledgeTypeLabel(source.type)}</span>
              <mark class="info">${source.jurisdiction_country}</mark>
            </div>
          `).join("") || `<div class="empty-state">Brak dopasowania dla aktualnego transportu.</div>`}
        </div>
        ${(relevant.warnings || []).length ? `
          <div class="notice-list">
            ${relevant.warnings.map((warning) => `<p class="notice">${valueLabel(warning)}</p>`).join("")}
          </div>
        ` : ""}
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Zrodla wiedzy</span>
            <h2>Rejestr</h2>
          </div>
        </div>
        <div class="list">
          ${sources.map((source) => `
            <div class="row detail-card" data-ui-type="details" data-detail-route="/knowledge">
              <strong>${valueLabel(source.title)}</strong>
              <span>${knowledgeTypeLabel(source.type)} / ${source.jurisdiction_country} / v${source.version}</span>
              <small>${valueLabel(source.description)}</small>
              <mark class="${auditIds.has(source.audit_log_id) ? "good" : "bad"}">${auditIds.has(source.audit_log_id) ? "audyt OK" : "brak audytu"}</mark>
            </div>
          `).join("")}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Dokumenty przewoznika</span>
        <h2>Powiazanie z Company Engine</h2>
        ${renderCarrierKnowledgeDocuments(state, relevant.carrierDocuments)}
      </article>
    </section>
  `;
}

function renderCarrierKnowledgeDocuments(state, carrierDocuments) {
  const status = carrierDocuments || {
    companyId: state.access?.actor?.companyId || null,
    requiredTypes: ["professional_competence_certificate", "carrier_license", "ocp", "adr_certificate"],
    presentTypes: [],
    missingTypes: []
  };
  return `
    <div class="detail-grid">
      <div><span>Firma</span><strong>${status.companyId ? companyName(state, status.companyId) : "brak kontekstu"}</strong></div>
      <div><span>Dokumenty obecne</span><strong>${status.presentTypes.length}</strong></div>
      <div><span>Braki informacyjne</span><strong>${status.missingTypes.length}</strong></div>
    </div>
    <div class="list compact">
      ${status.requiredTypes.map((type) => `
        <div class="row" data-ui-type="info">
          <strong>${carrierDocumentLabel(type)}</strong>
          <span>${status.presentTypes.includes(type) ? "dokument oznaczony w Company Engine" : "moze byc wymagany w workflow"}</span>
          <mark class="${status.presentTypes.includes(type) ? "good" : "warning"}">${status.presentTypes.includes(type) ? "jest" : "brak"}</mark>
        </div>
      `).join("")}
    </div>
  `;
}

function knowledgeTypeLabel(type) {
  const labels = {
    professional_competence_certificate: "Certyfikat kompetencji",
    carrier_license: "Licencja transportowa",
    cmr_convention: "Konwencja CMR",
    adr_regulation: "ADR",
    mobility_package: "Pakiet Mobilnosci",
    driver_work_time: "Czas pracy kierowcy",
    tachograph_rules: "Tachograf",
    insurance_rules: "Ubezpieczenia",
    customs_rules: "Reguly celne",
    warehouse_procedure: "Procedura magazynu",
    gl_internal_policy: "Polityka GL",
    academy_material: "Material Akademii GL",
    legal_update: "Aktualizacja prawna",
    test_question_bank: "Baza pytan",
    training_module: "Modul szkoleniowy",
    certification_path: "Sciezka certyfikacji"
  };
  return labels[type] || valueLabel(type);
}

function carrierDocumentLabel(type) {
  const labels = {
    professional_competence_certificate: "Certyfikat Kompetencji Zawodowych",
    carrier_license: "Licencja transportowa",
    ocp: "OCP",
    adr_certificate: "ADR, jesli dotyczy"
  };
  return labels[type] || valueLabel(type);
}

function renderPayments(state, engine, selected) {
  return renderPlatformWallet(state, engine, selected);
}

function renderPlatformWallet(state, engine, selected) {
  if (state.access?.canViewPlatformWallet) {
    return renderFintechModule(state, engine, selected, "dashboard");
  }
  if (state.access?.canViewOwnWallet) {
    return renderOwnWalletRoute(state);
  }
  return renderAccessDenied("wallet", "access.wallet_no_active");
}

function renderWallets(state) {
  if (!state.access?.canViewPlatformWallet) {
    return renderAccessDenied("ui.platform_wallet", "access.platform_balance_restricted");
  }
  return renderFintechModule(state, null, selectedTransport(state), "accounts");
}

function renderEscrow(state) {
  if (!state.access?.canViewPlatformWallet) {
    return renderAccessDenied("ui.escrow_engine", "access.escrow_restricted");
  }
  return renderFintechModule(state, null, selectedTransport(state), "escrow");
}

function renderBillingModule(state, mode) {
  if (!state.access?.canViewFinancials || state.access?.canViewPlatformWallet) {
    return renderAccessDenied("billing", "access.billing_own_only");
  }
  const scope = state.access.financialScope;
  const copy = billingCopy(scope, mode);
  const payments = state.payments || [];
  const escrows = state.escrows || [];
  const transactions = state.walletTransactions || [];
  const servicePayments = state.servicePayments || [];
  const policies = state.insurancePolicies || [];
  const totals = financialTotals(state);
  return `
    <section class="finance-shell own-finance-shell">
      <div class="finance-hero">
        <div>
          <span class="finance-demo">${ui("finance.demo_mode")}</span>
          <h2>${copy.title}</h2>
          <p>${copy.description}</p>
        </div>
        <div class="finance-hero-balance">
          <span>${copy.balanceLabel}</span>
          <strong>${formatMoney(copy.balanceValue(state, totals), "EUR")}</strong>
          <small>${valueLabel("saldo informacyjne / dane symulowane")}</small>
        </div>
      </div>

      <div class="finance-metrics">
        ${financeMetric(copy.metricA, copy.metricAValue(state, totals), "EUR", "info")}
        ${financeMetric(copy.metricB, copy.metricBValue(state, totals), "EUR", "warning")}
        ${financeMetric(copy.metricC, copy.metricCValue(state, totals), "EUR", "success")}
        ${financeMetric(copy.metricD, copy.metricDValue(state, totals), "EUR", "info")}
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${copy.tableEyebrow}</span>
              <h2>${copy.tableTitle}</h2>
            </div>
            <span class="finance-pill">${copy.scopeLabel}</span>
          </div>
          ${renderOwnFinanceRows(state, mode, payments, servicePayments, policies, transactions)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${valueLabel("Zakres dostepu")}</span>
              <h2>${valueLabel("Zakres dostepu")}</h2>
            </div>
          </div>
          <div class="finance-list">
            ${copy.allowed.map((item) => `<div><strong>${valueLabel(item)}</strong><span>${valueLabel("dane wlasne")}</span></div>`).join("")}
            <div><strong>${ui("access.generic_title")}</strong><span>${valueLabel("saldo platformy, prowizje systemowe, ID portfela GL, cudze rozliczenia")}</span></div>
          </div>
        </article>
      </div>

      ${mode === "transport_escrow" ? `
        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${valueLabel("Escrow transportu")}</span>
              <h2>${valueLabel("Depozyty przypisane do wlasnych transportow")}</h2>
            </div>
          </div>
          ${renderEscrowRows({ ...state, escrows })}
        </article>
      ` : ""}
    </section>
  `;
}

function renderOwnWalletRoute(state) {
  const scope = state.access.financialScope;
  if (["insurance", "service"].includes(scope)) {
    return renderBillingModule(state, "wallet");
  }

  const copy = ownWalletCopy(scope);
  const totals = financialTotals(state);
  const wallet = (state.wallets || [])[0] || null;
  const escrows = state.escrows || [];
  const transactions = state.walletTransactions || [];

  return `
    <section class="finance-shell own-finance-shell">
      <div class="finance-hero">
        <div>
          <span class="finance-demo">${ui("finance.demo_mode")}</span>
          <h2>${copy.title}</h2>
          <p>${copy.description}</p>
        </div>
        <div class="finance-hero-balance">
          <span>${copy.balanceLabel}</span>
          <strong>${formatMoney(totals.available, wallet?.currency || "EUR")}</strong>
          <small>${wallet ? "konto rozliczeniowe aktywne" : valueLabel("brak aktywnego portfela")}</small>
        </div>
      </div>

      <div class="finance-metrics">
        ${financeMetric(copy.metricA, totals.available, wallet?.currency || "EUR", "success")}
        ${financeMetric(copy.metricB, totals.blocked, wallet?.currency || "EUR", "warning")}
        ${financeMetric(copy.metricC, totals.pending, wallet?.currency || "EUR", "info")}
        ${financeMetric(copy.metricD, totals.inTransit, wallet?.currency || "EUR", "info")}
      </div>

      <div class="finance-grid">
        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${copy.accountEyebrow}</span>
              <h2>${copy.accountTitle}</h2>
            </div>
             <span class="finance-pill">${wallet ? "aktywny zakres rozliczeń" : valueLabel("brak")}</span>
          </div>
          <div class="wallet-card-grid">
            ${wallet ? renderWalletAccount(state, wallet) : `<p class="finance-muted">${valueLabel("Brak portfela przypisanego do tej roli.")}</p>`}
          </div>
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${valueLabel("Zakres dostepu")}</span>
              <h2>${valueLabel("Wlasne dane finansowe")}</h2>
            </div>
          </div>
          <div class="finance-list">
            ${copy.allowed.map((item) => `<div><strong>${valueLabel(item)}</strong><span>${valueLabel("zakres wlasny")}</span></div>`).join("")}
            <div><strong>${ui("access.generic_title")}</strong><span>${valueLabel("saldo GL, cudze portfele i cudze rozliczenia")}</span></div>
          </div>
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.transaction_history")}</span>
              <h2>${copy.historyTitle}</h2>
            </div>
            <span class="finance-pill">płatności i rozliczenia</span>
          </div>
          ${renderOwnTransactionHistory(state, transactions)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Escrow</span>
              <h2>${copy.escrowTitle}</h2>
            </div>
          </div>
          ${renderEscrowRows({ ...state, escrows })}
        </article>
      </div>
    </section>
  `;
}

function ownWalletCopy(scope) {
  const byScope = {
    client: {
      title: "Moj portfel klienta",
      description: "Klient widzi saldo wlasnego portfela, blokady pod transporty, platnosci, faktury i escrow swoich transportow. Nie widzi salda GL ani portfeli innych firm.",
      balanceLabel: "Saldo wlasnego portfela",
      metricA: "Dostepne",
      metricB: "Zablokowane",
      metricC: "Oczekujace",
      metricD: "Platnosci w drodze",
      accountEyebrow: "UserWallet / CompanyWallet",
      accountTitle: "Portfel klienta",
      historyTitle: "Platnosci klienta",
      escrowTitle: "Escrow wlasnych transportow",
      allowed: ["saldo wlasnego portfela", "doladowanie demo", "escrow transportow", "historia platnosci"]
    },
    carrier: {
      title: "Moj portfel przewoznika",
      description: "Przewoznik widzi saldo wlasnego portfela, naleznosci za transporty, srodki oczekujace na wyplate, potracone prowizje GL i historie rozliczen.",
      balanceLabel: "Saldo przewoznika",
      metricA: "Dostepne",
      metricB: "Blokady",
      metricC: "Oczekujace",
      metricD: "W drodze",
      accountEyebrow: "CompanyWallet",
      accountTitle: "Portfel przewoznika",
      historyTitle: "Naleznosci i wyplaty",
      escrowTitle: "Transporty zabezpieczone escrow",
      allowed: ["saldo wlasnego portfela", "naleznosci", "status wyplat", "potracone prowizje GL"]
    },
    user: {
      title: "Portfel osobisty kierowcy",
      description: "Kierowca widzi tylko osobisty UserWallet i ewentualne rozliczenia przypisane bezposrednio do swojego user_id. Nie widzi finansow firmy przewoznika.",
      balanceLabel: "Saldo osobiste",
      metricA: "Dostepne",
      metricB: "Zablokowane",
      metricC: "Oczekujace",
      metricD: "W drodze",
      accountEyebrow: "UserWallet",
      accountTitle: "Portfel kierowcy",
      historyTitle: "Osobiste rozliczenia",
      escrowTitle: "Brak dostepu do escrow firmy",
      allowed: ["saldo osobiste", "rozliczenia osobiste", "status wyplaty osobistej"]
    }
  };
  return byScope[scope] || byScope.client;
}

function billingCopy(scope, mode) {
  const defaults = {
    title: "Moje rozliczenia",
    description: "Widok pokazuje wylacznie wlasne faktury, statusy platnosci i naleznosci. To nie jest portfel platformy GL.",
    balanceLabel: "Saldo informacyjne",
    balanceValue: (_state, totals) => totals.available + totals.pending + totals.inTransit,
    metricA: "Naleznosci",
    metricAValue: (_state, totals) => totals.pending + totals.inTransit,
    metricB: "Escrow transportu",
    metricBValue: (_state, totals) => totals.escrow,
    metricC: "Zapisy platnosci",
    metricCValue: (state) => (state.payments || []).length,
    metricD: "Historia",
    metricDValue: (state) => (state.walletTransactions || []).length,
    tableEyebrow: "Rozliczenia",
    tableTitle: "Historia rozliczen",
    scopeLabel: "dane wlasne",
    allowed: ["faktury", "status platnosci", "historia rozliczen"]
  };
  const byScope = {
    client: {
      title: mode === "transport_escrow" ? "Escrow transportu" : mode === "invoices" ? "Faktury klienta" : "Platnosci za transporty",
      description: "Klient widzi faktury, platnosci za wlasne transporty, depozyty escrow i status oplacenia. Nie widzi portfela ani salda platformy.",
      metricA: "Platnosci za transporty",
      metricB: "Depozyty escrow",
      metricC: "Faktury",
      metricD: "Historia platnosci",
      tableTitle: "Faktury i platnosci klienta",
      allowed: ["faktury", "platnosci za transporty", "depozyty escrow", "status oplacenia"]
    },
    carrier: {
      title: mode === "payouts" ? "Status wyplaty" : "Moje rozliczenia",
      description: "Przewoznik widzi naleznosci za wykonane transporty, faktury, status wyplat, historie rozliczen i potracone prowizje GL.",
      metricA: "Naleznosci za transporty",
      metricB: "Potracone prowizje GL",
      metricC: "Statusy wyplat",
      metricD: "Historia rozliczen",
      tableTitle: "Naleznosci i faktury przewoznika",
      allowed: ["naleznosci", "faktury", "status wyplat", "potracone prowizje GL"]
    },
    insurance: {
      title: "Rozliczenia polis",
      description: "Partner ubezpieczeniowy widzi skladki przypisane do polis, prowizje GL, status platnosci polis, wyplaty szkod i rozliczenia z GL.",
      metricA: "Skladki polis",
      metricAValue: (state) => sumMoney(state.insurancePolicies || [], (policy) => policy.cost),
      metricB: "Prowizje GL",
      metricBValue: (state) => Math.round(sumMoney(state.insurancePolicies || [], (policy) => policy.cost) * 0.08),
      metricC: "Polisy",
      metricCValue: (state) => (state.insurancePolicies || []).length,
      metricD: "Wyplaty szkod",
      metricDValue: (state) => (state.claims || []).length,
      tableTitle: "Skladki, prowizje i status polis",
      allowed: ["skladki polis", "prowizje GL", "status platnosci polis", "wyplaty szkod"]
    },
    service: {
      title: "Rozliczenia serwisu",
      description: "Warsztat i serwis mobilny widza zlecenia serwisowe, faktury, naleznosci, status platnosci i historie uslug.",
      metricA: "Naleznosci serwisowe",
      metricAValue: (state) => sumMoney(state.servicePayments || [], (payment) => payment.amount),
      metricB: "Faktury serwisowe",
      metricBValue: (state) => (state.servicePayments || []).length,
      metricC: "Zlecenia serwisowe",
      metricCValue: (state) => (state.serviceRequests || []).length,
      metricD: "Historia uslug",
      metricDValue: (state) => (state.serviceRequests || []).length,
      tableTitle: "Zlecenia serwisowe i faktury",
      allowed: ["zlecenia serwisowe", "faktury", "naleznosci", "status platnosci"]
    },
    payment_status: {
      title: "Statusy platnosci",
      description: "Widok operacyjny platnosci bez salda platformy i bez portfeli firm.",
      tableTitle: "Platnosci w toku",
      allowed: ["status platnosci", "blokady", "historia operacyjna"]
    }
  };
  return { ...defaults, ...(byScope[scope] || {}) };
}

function renderOwnFinanceRows(state, mode, payments, servicePayments, policies, transactions) {
  if (state.access.financialScope === "insurance") {
    return `
      <div class="finance-table transactions">
        <div class="finance-row finance-head-row">
          <span>Polisa</span><span>Transport</span><span>Skladka</span><span>Status</span><span>Prowizja GL</span><span>Zakres</span>
        </div>
        ${policies.map((policy) => `
          <div class="finance-row" data-ui-type="info">
            <span>${policy.number}</span>
            <span>${transportNumber(state, policy.transportId)}</span>
            <strong>${formatMoney(policy.cost, "EUR")}</strong>
            <span><mark class="${financeTone(policy.status)}">${policy.status}</mark></span>
            <span>${formatMoney(Math.round(policy.cost * 0.08), "EUR")}</span>
            <small>${policy.scope}</small>
          </div>
        `).join("") || `<p class="finance-muted">Brak rozliczen polis.</p>`}
      </div>
    `;
  }
  if (state.access.financialScope === "service") {
    return `
      <div class="finance-table transactions">
        <div class="finance-row finance-head-row">
          <span>Zlecenie</span><span>Transport</span><span>Kwota</span><span>Status</span><span>Usluga</span><span>Historia</span>
        </div>
        ${servicePayments.map((payment) => {
          const request = (state.serviceRequests || []).find((item) => item.id === payment.serviceRequestId);
          return `
            <div class="finance-row" data-ui-type="info">
              <span>${payment.id}</span>
              <span>${transportNumber(state, payment.transportId)}</span>
              <strong>${formatMoney(payment.amount, payment.currency)}</strong>
              <span><mark class="${financeTone(payment.status)}">${payment.status}</mark></span>
              <span>${request?.faultType || "serwis"}</span>
              <small>${request?.status || "historia uslugi"}</small>
            </div>
          `;
        }).join("") || `<p class="finance-muted">Brak faktur serwisowych.</p>`}
      </div>
    `;
  }
  return `
    <div class="finance-table transactions">
      <div class="finance-row finance-head-row">
        <span>Płatność</span><span>Transport</span><span>Kwota</span><span>Status</span><span>Rozliczenie</span><span>Ostatnia zmiana</span>
      </div>
      ${payments.map((payment) => {
        const fee = calculateGlFee({ price: payment.amount, currency: payment.currency });
        const settlementLabel = mode === "payouts"
          ? `do wyplaty: ${formatMoney(fee.carrierAmount, payment.currency)}`
          : mode === "transport_escrow"
          ? "escrow transportu"
          : "faktura / status";
        return `
          <div class="finance-row" data-ui-type="info">
            <span>${payment.id}</span>
            <span>${transportNumber(state, payment.transportId)}</span>
            <strong>${formatMoney(payment.amount, payment.currency)}</strong>
            <span><mark class="${financeTone(payment.status)}">${payment.status}</mark></span>
            <span>${settlementLabel}</span>
            <small>${payment.updatedAt ? formatTime(payment.updatedAt) : formatTime(payment.at)}</small>
          </div>
        `;
      }).join("") || `<p class="finance-muted">Brak wlasnych rozliczen.</p>`}
    </div>
  `;
}

function sumMoney(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

function renderFintechModule(state, engine, selected, mode) {
  const totals = financialTotals(state);
  const fee = calculateGlFee(selected);
  const policy = selected ? state.insurancePolicies.find((item) => item.id === selected.insuranceId) : null;
  const activeTransactions = (state.walletTransactions || []).slice(0, 8);
  const sortedTransactions = [...(state.walletTransactions || [])].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  const sectionTitle = mode === "accounts" ? valueLabel("Konta portfela GL") : mode === "escrow" ? valueLabel("Escrow i spory") : ui("ui.wallet_dashboard");

  return `
    <section class="finance-shell">
      <div class="finance-hero">
        <div>
          <span class="finance-demo">${ui("finance.demo_mode")}</span>
          <h2>${sectionTitle}</h2>
          <p>${valueLabel("Brak rzeczywistych operacji finansowych. Dane, salda, hash transakcji i API sa symulowane pod przyszla integracje z licencjonowanym operatorem.")}</p>
        </div>
        <div class="finance-hero-balance">
          <span>${valueLabel("Saldo systemu")}</span>
          <strong>${formatMoney(totals.totalSystem, "EUR")}</strong>
          <small>${valueLabel("symulowany portfel GL")}</small>
        </div>
      </div>

      <div class="finance-metrics">
        ${financeMetric("finance.available_balance", totals.available, "EUR", "success")}
        ${financeMetric("finance.blocked_balance", totals.blocked, "EUR", "warning")}
        ${financeMetric("finance.pending_balance", totals.pending, "EUR", "info")}
        ${financeMetric("finance.escrow_funds", totals.escrow, "EUR", "warning")}
        ${financeMetric("finance.in_transit", totals.inTransit, "EUR", "info")}
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.transaction_history")}</span>
              <h2>${ui("finance.ledger_title")}</h2>
            </div>
            <span class="finance-pill">${ui("finance.hash_audit")}</span>
          </div>
          ${renderTransactionHistory(state, activeTransactions)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${valueLabel("Ostatnie operacje")}</span>
              <h2>${valueLabel("Operacje portfela")}</h2>
            </div>
          </div>
          <div class="finance-list">
            ${(state.walletLedger || []).slice(0, 6).map((entry) => `
              <div>
                <strong>${entry.type}</strong>
                <span>${formatMoney(entry.amount, entry.currency)} / ${transportNumber(state, entry.transportId)}</span>
                <small>${entry.reason}</small>
              </div>
            `).join("") || `<p class="finance-muted">${valueLabel("Brak operacji.")}</p>`}
          </div>
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.accounts")}</span>
              <h2>${ui("finance.wallet_accounts")}</h2>
            </div>
            <span class="finance-pill">${(state.wallets || []).length} ${valueLabel("ID portfela GL")}</span>
          </div>
          <div class="wallet-card-grid">
            ${(state.wallets || []).map((wallet) => renderWalletAccount(state, wallet)).join("") || `<p class="finance-muted">${ui("ui.no_visible_wallets")}</p>`}
          </div>
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.statuses")}</span>
              <h2>${ui("finance.payment_cycle")}</h2>
            </div>
          </div>
          <div class="status-cloud">
            ${["Pending", "Reserved", "Escrow", "Released", "Completed", "Rejected", "Blocked", "Refunded", "Cancelled", "Disputed"].map((status) => `
              <mark class="${financeTone(status)}">${valueLabel(status.toLowerCase())}</mark>
            `).join("")}
          </div>
          <div class="status-cloud currencies">
            ${(state.exchangeRates || []).map((rate) => `<span>${rate.currency}</span>`).join("")}
          </div>
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("ui.escrow_engine")}</span>
              <h2>${ui("finance.escrow_release")}</h2>
            </div>
            ${engine && selected ? actionButton(engine, ActionTypes.RELEASE_PAYMENT, ui("finance.release_payment"), { transportId: selected.id }) : ""}
          </div>
          ${renderEscrowFlow()}
          ${renderEscrowRows(state)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${valueLabel("Spory")}</span>
              <h2>${ui("finance.admin_decisions")}</h2>
            </div>
          </div>
          ${renderDisputeFinance(state)}
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.gl_fee")}</span>
              <h2>${ui("finance.fee_calculation")}</h2>
            </div>
          </div>
          <div class="finance-kv">
            <div><span>${ui("finance.gross_amount")}</span><strong>${formatMoney(fee.gross, fee.currency)}</strong></div>
            <div><span>${ui("finance.gl_fee")}</span><strong>${formatMoney(fee.feeGross, fee.currency)}</strong></div>
            <div><span>${ui("finance.fee_net")}</span><strong>${formatMoney(fee.feeNet, fee.currency)}</strong></div>
            <div><span>${ui("finance.tax")}</span><strong>${formatMoney(fee.tax, fee.currency)}</strong></div>
            <div><span>${ui("finance.carrier_amount")}</span><strong>${formatMoney(fee.carrierAmount, fee.currency)}</strong></div>
          </div>
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.insurance")}</span>
              <h2>${ui("finance.policy")}</h2>
            </div>
          </div>
          ${policy ? `
            <div class="finance-kv">
              <div><span>Numer polisy</span><strong>${policy.number}</strong></div>
              <div><span>Firma</span><strong>${policy.partner}</strong></div>
              <div><span>Zakres</span><strong>${policy.scope}</strong></div>
              <div><span>Kwota</span><strong>${formatMoney(policy.cost, "EUR")}</strong></div>
              <div><span>${valueLabel("Status")}</span><strong>${valueLabel(policy.status)}</strong></div>
            </div>
          ` : `<p class="finance-muted">Ten transport nie ma aktywnej polisy.</p>`}
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.admin_dashboard")}</span>
              <h2>${ui("finance.risk_title")}</h2>
            </div>
          </div>
          <div class="finance-admin-grid">
            <div><span>Calkowite saldo</span><strong>${formatMoney(totals.totalSystem, "EUR")}</strong></div>
            <div><span>Escrow</span><strong>${formatMoney(totals.escrow, "EUR")}</strong></div>
            <div><span>Blokady</span><strong>${formatMoney(totals.blocked, "EUR")}</strong></div>
            <div><span>Spory</span><strong>${totals.disputes}</strong></div>
            <div><span>Alarmy</span><strong>${(state.walletRiskAlerts || []).length}</strong></div>
            <div><span>Podejrzane operacje</span><strong>${(state.walletRiskAlerts || []).filter((alert) => ["HIGH", "CRITICAL"].includes(alert.level)).length}</strong></div>
          </div>
          ${renderLargestTransactions(state, sortedTransactions)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.ai_risk")}</span>
              <h2>${ui("finance.aml_fraud")}</h2>
            </div>
          </div>
          <div class="finance-list">
            ${(state.walletRiskAlerts || []).map((alert) => `
              <div>
                <strong>${alert.title}</strong>
                <span><mark class="${financeTone(alert.level)}">${alert.level}</mark> ${alert.source}</span>
                <small>${alert.description}</small>
              </div>
            `).join("") || `<p class="finance-muted">${valueLabel("Brak alertow.")}</p>`}
          </div>
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.reports")}</span>
              <h2>${ui("finance.export_demo")}</h2>
            </div>
          </div>
          <div class="report-grid">
            ${(state.walletReports || []).map((report) => `
              <div>
                <strong>${report.name}</strong>
                <span>${report.exports.join(" / ")}</span>
              </div>
            `).join("")}
          </div>
        </article>

        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${ui("finance.api_architecture")}</span>
              <h2>${ui("finance.api_ready")}</h2>
            </div>
            <span class="finance-pill">${ui("finance.backend_inactive")}</span>
          </div>
          <div class="api-grid">
            ${(state.walletApiEndpoints || []).map((endpoint) => `
              <div>
                <span>${endpoint.group}</span>
                <strong>${endpoint.method} ${endpoint.path}</strong>
                <small>${endpoint.purpose}</small>
              </div>
            `).join("")}
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderOwnTransactionHistory(state, transactions) {
  return `
    <div class="finance-table transactions">
      <div class="finance-row finance-head-row">
        <span>Data</span><span>Kwota</span><span>Od</span><span>Do</span><span>Status</span><span>Powód</span>
      </div>
      ${transactions.map((entry) => `
        <div class="finance-row" data-ui-type="info">
          <span>${formatWalletDate(entry.at).day}</span>
          <strong>${formatMoney(entry.amount, entry.currency)}</strong>
          <span>${entityName(state, entry.senderId)}</span>
          <span>${entityName(state, entry.receiverId)}</span>
          <span><mark class="${financeTone(entry.status)}">${valueLabel(entry.status)}</mark></span>
          <small>${entry.reason}</small>
        </div>
      `).join("") || `<p class="finance-muted">Brak historii płatności.</p>`}
    </div>
  `;
}

function renderTransactionHistory(state, transactions) {
  return `
    <div class="finance-table transactions">
      <div class="finance-row finance-head-row">
        <span>ID</span><span>Data</span><span>Godzina</span><span>Kwota</span><span>Nadawca</span><span>Odbiorca</span><span>Status</span><span>Hash demo</span><span>Audit ID</span>
      </div>
      ${transactions.map((entry) => {
        const date = formatWalletDate(entry.at);
        return `
          <div class="finance-row" data-ui-type="info">
            <span>${entry.id}</span>
            <span>${date.day}</span>
            <span>${date.time}</span>
            <strong>${formatMoney(entry.amount, entry.currency)}</strong>
            <span>${entityName(state, entry.senderId)}</span>
            <span>${entityName(state, entry.receiverId)}</span>
            <span><mark class="${financeTone(entry.status)}">${valueLabel(entry.status)}</mark></span>
            <small>${entry.hash}</small>
            <small>${entry.auditId}</small>
          </div>
        `;
      }).join("") || `<p class="finance-muted">Brak transakcji.</p>`}
    </div>
  `;
}

function renderWalletAccount(state, wallet) {
  return `
    <div class="wallet-card" data-ui-type="info">
      <span>${valueLabel(wallet.walletType)}</span>
      <strong>${wallet.glWalletId}</strong>
      <p>${walletOwnerName(state, wallet)}</p>
      <div>
        <small>${ui("finance.available_balance")}</small>
        <b>${formatMoney(wallet.balance, wallet.currency)}</b>
      </div>
      <div>
        <small>${ui("finance.blocked_balance")} / escrow</small>
        <b>${formatMoney((wallet.heldBalance || 0) + (wallet.blockedBalance || 0), wallet.currency)}</b>
      </div>
    </div>
  `;
}

function renderEscrowFlow() {
  const steps = [
    "Klient tworzy transport",
    "Srodki zostaja zablokowane",
    "Transport rusza",
    "Rozladunek zakonczony",
    "Dokumenty zaakceptowane",
    "Brak sporu",
    "Escrow zwolnione do przewoznika"
  ];
  return `<div class="finance-flow">${steps.map((step, index) => `<div><span>${index + 1}</span><strong>${valueLabel(step)}</strong></div>`).join("")}</div>`;
}

function renderEscrowRows(state) {
  return `
    <div class="finance-table escrow-table">
      <div class="finance-row finance-head-row">
        <span>ID</span><span>Transport</span><span>Platnik</span><span>Status</span><span>Kwota</span><span>Odbiorca</span>
      </div>
      ${(state.escrows || []).map((escrow) => `
        <div class="finance-row" data-ui-type="info">
          <span>${escrow.id}</span>
          <span>${transportNumber(state, escrow.transportId)}</span>
          <span>${companyName(state, escrow.payerCompanyId)}</span>
          <span><mark class="${financeTone(escrow.status)}">${valueLabel(escrow.status)}</mark></span>
          <strong>${formatMoney(escrow.amount, escrow.currency)}</strong>
          <span>${companyName(state, escrow.payeeCompanyId)}</span>
        </div>
      `).join("") || `<p class="finance-muted">Brak rekordow escrow.</p>`}
    </div>
  `;
}

function renderDisputeFinance(state) {
  const disputes = state.disputes || [];
  if (!disputes.length) return `<p class="finance-muted">${valueLabel("Brak aktywnych sporow. Escrow moze przejsc do release po dokumentach.")}</p>`;
  return `
    <div class="finance-list">
      ${disputes.map((dispute) => `
        <div>
          <strong>${transportNumber(state, dispute.transportId)}</strong>
          <span>${valueLabel("Status")}: ${valueLabel(dispute.status)} / ${valueLabel("escrow zamrozone")}</span>
          <small>${valueLabel("AI analizuje historie, dokumenty, GPS i zdjecia.")}</small>
          <small>Decyzję sporu wykonuje administrator w module administracyjnym.</small>
        </div>
      `).join("")}
    </div>
  `;
}

function renderLargestTransactions(state, transactions) {
  return `
    <div class="finance-list compact-finance-list">
      ${transactions.slice(0, 3).map((entry) => `
        <div>
          <strong>${formatMoney(entry.amount, entry.currency)}</strong>
          <span>${entityName(state, entry.senderId)} -> ${entityName(state, entry.receiverId)}</span>
          <small>${entry.reason}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function renderRevenue(state) {
  if (!state.access?.canViewPlatformWallet) {
    return renderAccessDenied("Revenue Engine", "Platform revenue is restricted for this role.");
  }
  return `
    <section class="panel">
      <span class="eyebrow">GL Revenue Engine</span>
      <h2>Platform fees recorded by events</h2>
      <div class="transport-table compact-table">
        <div class="table-row table-head">
        <span>ID</span><span>Transport</span><span>Typ</span><span>Kwota</span><span>Waluta</span><span>Powod</span>
        </div>
        ${state.revenueLedger.map((entry) => `
          <div class="table-row" data-ui-type="info">
            <span>${entry.id}</span>
            <span>${transportNumber(state, entry.transportId)}</span>
            <span>${entry.type}</span>
            <span>${entry.amount}</span>
            <span>${entry.currency}</span>
            <span>${entry.reason}</span>
          </div>
        `).join("") || `<p class="muted">No revenue rows visible.</p>`}
      </div>
    </section>
  `;
}

function renderPolicies(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Polisy</span>
      <h2>Polisy transportowe</h2>
      <div class="list">
        ${(state.insurancePolicies || []).map((policy) => `
          <div class="row">
            <strong>${policy.number}</strong>
            <span>${transportNumber(state, policy.transportId)} / ${policy.partner}</span>
            <mark class="${tone(policy.status)}">${policy.status}</mark>
            <small>${policy.scope} / ${formatMoney(policy.cost, "EUR")}</small>
          </div>
        `).join("") || `<p class="muted">Brak polis widocznych dla tej roli.</p>`}
      </div>
    </section>
  `;
}

function renderClaims(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Zgloszenia szkod</span>
        <h2>Szkody i roszczenia</h2>
        ${selected ? actionButton(engine, ActionTypes.OPEN_CLAIM, "Otworz roszczenie", { transportId: selected.id, reason: "damage claim from demo" }) : disabledAction("Otworz roszczenie", "Brak transportu")}
      </article>
      <article class="panel">
        <h2>Sprawy</h2>
        <div class="list">
          ${(state.claims || []).map((claim) => `
            <div class="row">
              <strong>${claim.id}</strong>
              <span>${transportNumber(state, claim.transportId)}</span>
              <mark class="${tone(claim.status)}">${claim.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak aktywnych roszczen.</p>`}
          ${(state.disputeEvidencePacks || []).map((pack) => `
            <div class="row">
              <strong>${pack.id}</strong>
              <span>${transportNumber(state, pack.transportId)}</span>
              <small>${pack.photoIds.length} zdjec / ${pack.documentIds.length} dokumentow</small>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderRisk(state) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Ocena ryzyka</span>
        <h2>Ryzyko transportu</h2>
        <div class="list">
          ${(state.transports || []).map((transport) => `
            <div class="row">
              <strong>${transport.number}</strong>
              <span>${transport.status}</span>
              <mark class="${transport.riskFlagged ? "danger" : "good"}">${transport.riskFlagged ? "ryzyko" : "ok"}</mark>
            </div>
          `).join("") || `<p class="muted">Brak transportow do oceny.</p>`}
        </div>
      </article>
      <article class="panel">
        <h2>Alerty AI</h2>
        <div class="list">
          ${(state.aiAlerts || []).map((alert) => `
            <div class="row">
              <strong>${alert.title || alert.id}</strong>
              <span>${transportNumber(state, alert.transportId)}</span>
              <mark class="${tone(alert.level || alert.status)}">${alert.level || alert.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak alertow AI.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderInsurance(state, engine, selected) {
  const packs = state.disputeEvidencePacks.filter((pack) => pack.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Insurance Engine</span>
        <h2>Claim binds photos, GPS, docs and liability</h2>
        ${actionButton(engine, ActionTypes.OPEN_CLAIM, "Otworz roszczenie ubezpieczeniowe", { transportId: selected.id, reason: "roszczenie demo za szkode" })}
      </article>
      <article class="panel">
        <h2>Policies</h2>
        <div class="list">
          ${state.insurancePolicies.map((policy) => `
            <div class="row">
              <strong>${policy.number}</strong>
              <span>${policy.partner}</span>
              <mark class="${tone(policy.status)}">${policy.status}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <span class="eyebrow">Dispute Evidence Engine</span>
      <h2>Evidence packs</h2>
      <div class="list">
        ${packs.map((pack) => `
          <div class="row">
            <strong>${pack.id}</strong>
            <span>${pack.photoIds.length} photos / ${pack.documentIds.length} docs / ${pack.messageIds.length} messages</span>
            <mark class="${pack.locked ? "good" : "warning"}">${pack.locked ? "locked" : "draft"}</mark>
          </div>
        `).join("") || `<p class="muted">No evidence pack for selected transport.</p>`}
      </div>
    </section>
  `;
}

function renderJobs(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Praca</span>
      <h2>Zlecenia kierowców</h2>
      <div class="card-grid">
        ${state.jobs.map((job) => `
          <article class="mini-card" data-ui-type="info">
            <strong>${transportNumber(state, job.transportId)}</strong>
            <span>${userName(state, job.driverId)} / ${companyName(state, job.carrierCompanyId)}</span>
            <mark class="${tone(job.status)}">${valueLabel(job.status)}</mark>
          </article>
        `).join("") || `<p class="muted">Brak zleceń widocznych dla tej roli.</p>`}
      </div>
    </section>
  `;
}

function renderCommunication(state, engine, selected) {
  const messages = state.messages.filter((message) => message.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Komunikaty</span>
        <h2>Rozmowa transportowa</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Wyslij aktualizacje PL", { transportId: selected.id, body: "Prosze potwierdzic odprawe na bramie przed zaladunkiem.", language: "pl" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Wyslij aktualizacje EN", { transportId: selected.id, body: "Please confirm gate clearance before loading.", language: "en" })}
        </div>
      </article>
      <article class="panel">
        <h2>Wiadomości</h2>
        <div class="list">
          ${messages.map((message) => `
            <div class="row">
              <strong>${userName(state, message.authorId) || message.authorRole}</strong>
              <span>${message.language}</span>
              <small>${message.body}</small>
            </div>
          `).join("") || `<p class="muted">Brak wiadomości dla wybranego transportu.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderTranslations(state, engine) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Tłumaczenia</span>
        <h2>Tłumaczenia wiadomości</h2>
        <div class="list">
          ${state.messages.slice(0, 8).map((message) => `
            <div class="row">
              <strong>${transportNumber(state, message.transportId)}</strong>
              <span>${message.language}: ${message.body}</span>
              ${actionButton(engine, ActionTypes.REQUEST_TRANSLATION, "Przetlumacz na PL", { transportId: message.transportId, messageId: message.id, targetLanguage: "pl" })}
            </div>
          `).join("") || `<p class="muted">Brak wiadomości do tłumaczenia.</p>`}
        </div>
      </article>
      <article class="panel">
        <h2>Gotowe tłumaczenia</h2>
        <div class="list">
          ${state.translations.map((translation) => `
            <div class="row">
              <strong>${translation.sourceLanguage} -> ${translation.targetLanguage}</strong>
              <span>${translation.body}</span>
              <small>${translation.messageId}</small>
            </div>
          `).join("") || `<p class="muted">Brak gotowych tłumaczeń.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderSecurity(state, engine, selected) {
  const checks = state.securityChecks.filter((check) => check.transportId === selected.id);
  const lookups = state.plateLookups.filter((lookup) => !lookup.transportId || lookup.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Ochrona</span>
        <h2>Kontrola bramy</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.SCAN_LICENSE_PLATE, "Skanuj wybrana tablice", { licensePlate: vehiclePlate(state, selected.vehicleId), reason: "kontrola wjazdu na brame" })}
          ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Zatwierdz brame zaladunku", { transportId: selected.id, checkpoint: "pickup", status: "cleared", reason: "Brama zatwierdzona. Kierowca moze rozpoczac zaladunek." })}
          ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Zablokuj brame zaladunku", { transportId: selected.id, checkpoint: "pickup", status: "blocked", reason: "niezgodnosc plomby przy bramie zaladunku" })}
          ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Zatwierdz brame dostawy", { transportId: selected.id, checkpoint: "delivery", status: "cleared", reason: "brama dostawy zatwierdzona" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Powiadom watek", { transportId: selected.id, body: "Brama zatwierdzona. Kierowca moze rozpoczac zaladunek.", language: "pl" })}
        </div>
      </article>
      <article class="panel">
        <h2>Security checks</h2>
        <div class="list">
          ${checks.map((check) => `
            <div class="row">
              <strong>${check.checkpoint}</strong>
              <span>${check.reason}</span>
              <mark class="${tone(check.status)}">${check.status}</mark>
            </div>
          `).join("") || `<p class="muted">No checks for selected transport.</p>`}
        </div>
      </article>
    </section>
    <section class="panel">
      <span class="eyebrow">Plate-to-driver</span>
      <h2>Recent plate lookups</h2>
      <div class="list">
        ${lookups.map((lookup) => `
          <div class="row">
            <strong>${lookup.licensePlate}</strong>
            <span>${lookup.status} / ${transportNumber(state, lookup.transportId)}</span>
            <small>${lookup.reason}</small>
          </div>
        `).join("") || `<p class="muted">No plate lookups yet.</p>`}
      </div>
    </section>
  `;
}

function renderCustoms(state, engine, selected) {
  const cases = state.customsCases || [];
  const activeCase = cases.find((item) => item.transportId === selected.id) || cases[0] || null;
  const transport = activeCase
    ? state.transports.find((item) => item.id === activeCase.transportId) || selected
    : selected;
  const docs = state.documents.filter((doc) => doc.transportId === transport.id && [
    "sad",
    "t1",
    "ex",
    "mrn",
    "commercial_invoice",
    "packing_list",
    "certificate_of_origin"
  ].includes(doc.type));
  const payments = (state.customsPayments || []).filter((payment) => payment.transportId === transport.id);
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">23.8 Silnik agencji celnej</span>
            <h2>Odprawa celna transportu ${transport.number}</h2>
          </div>
          <mark class="${tone(transport.status)}">${transport.status}</mark>
        </div>
        ${renderDocumentForm(selected)}
        <div class="actions">
          ${actionButton(engine, ActionTypes.MARK_CUSTOMS_REQUIRED, "Wymagana odprawa", { transportId: transport.id, agentCompanyId: "co-customs-a", borderPoint: "Rotterdam / DE border" })}
          ${actionButton(engine, ActionTypes.SEND_TO_CUSTOMS, "Przekaż do agencji", { transportId: transport.id, agentCompanyId: "co-customs-a" })}
          ${actionButton(engine, ActionTypes.START_CUSTOMS, "Rozpocznij odprawę", { transportId: transport.id, agentCompanyId: "co-customs-a" })}
          ${actionButton(engine, ActionTypes.CLEAR_CUSTOMS, "Zwolnij po odprawie", { transportId: transport.id, mrn: "MRN-GL2-1001", fee: 180 })}
          ${actionButton(engine, ActionTypes.HOLD_CUSTOMS, "Zatrzymaj celnie", { transportId: transport.id, reason: "brak wymaganego MRN" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Wiadomość do kierowcy", { transportId: transport.id, body: "Agencja celna prosi o potwierdzenie dokumentów MRN i packing list.", language: "pl" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Aktywna odprawa</span>
        <h2>${activeCase?.mrn || "brak MRN"}</h2>
        <div class="detail-grid">
          <div><span>Agencja</span><strong>${companyName(state, activeCase?.agentCompanyId) || "Baltic Customs Agency"}</strong></div>
          <div><span>Punkt graniczny</span><strong>${activeCase?.borderPoint || "brak"}</strong></div>
          <div><span>Status odprawy</span><strong>${activeCase?.status || "brak"}</strong></div>
          <div><span>Opłata celna</span><strong>${payments[0] ? `${payments[0].amount} ${payments[0].currency}` : "brak"}</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Dokumenty celne</span>
        <h2>SAD / T1 / EX / MRN / faktura / lista pakowa</h2>
        <div class="list">
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${doc.integrityHash}</small>
            </div>
          `).join("") || `<p class="muted">Brak widocznych dokumentów celnych.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Sprawy celne</span>
        <h2>ID sprawy celnej jako osobna tożsamość</h2>
        <div class="list">
          ${cases.map((customsCase) => `
            <div class="row">
              <strong>${customsCase.id}</strong>
              <span>${transportNumber(state, customsCase.transportId)} / ${companyName(state, customsCase.agentCompanyId)}</span>
              <mark class="${tone(customsCase.status)}">${customsCase.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak widocznych spraw celnych.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderAuthority(state, engine, selected) {
  const controls = state.authorityControls || [];
  const history = state.authorityControlHistory || [];
  const control = controls.find((item) => item.transportId === selected.id) || controls[0] || null;
  const transport = control
    ? state.transports.find((item) => item.id === control.transportId) || selected
    : selected;
  const docs = state.documents.filter((doc) => doc.transportId === transport.id && [
    "cmr",
    "transport_license",
    "road_permit",
    "certificate",
    "legal_required_document",
    "insurance_policy"
  ].includes(doc.type));
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">23.9 Silnik dostępu organów / kontroli drogowej</span>
            <h2>Kontrolowany dostęp organu</h2>
          </div>
          <mark class="${tone(transport.status)}">${transport.status}</mark>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.START_AUTHORITY_CONTROL, "Rozpocznij kontrolę", { transportId: transport.id, authoritySubtype: "police", place: "A2 Poznań" })}
          ${actionButton(engine, ActionTypes.RECORD_DOCUMENT_CHECK, "Sprawdź dokumenty", { transportId: transport.id, checkedDocumentTypes: ["cmr", "transport_license", "road_permit", "insurance_policy"] })}
          ${actionButton(engine, ActionTypes.RECORD_ROAD_INSPECTION, "Kontrola drogowa", { transportId: transport.id, place: "A2 Poznań" })}
          ${actionButton(engine, ActionTypes.PASS_AUTHORITY_CONTROL, "Kontrola pozytywna", { transportId: transport.id, place: "A2 Poznań" })}
          ${actionButton(engine, ActionTypes.REPORT_AUTHORITY_ISSUE, "Wykryto problem", { transportId: transport.id, issue: "brak wymaganego pozwolenia" })}
          ${actionButton(engine, ActionTypes.SCAN_LICENSE_PLATE, "Skanuj tablicę", { licensePlate: vehiclePlate(state, transport.vehicleId), reason: "kontrola drogowa" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Zakres widoczności</span>
        <h2>Organ widzi tylko dane wymagane do kontroli</h2>
        <div class="detail-grid">
          <div><span>Pojazd</span><strong>${vehiclePlate(state, transport.vehicleId)}</strong></div>
          <div><span>Przewoźnik</span><strong>${companyName(state, transport.carrierCompanyId)}</strong></div>
          <div><span>Status</span><strong>${transport.status}</strong></div>
          <div><span>Legalność</span><strong>${transport.legalStatus || (transport.riskFlagged ? "do sprawdzenia" : "brak blokady")}</strong></div>
          <div><span>Ubezpieczenie</span><strong>${transport.insuranceId ? "wymagane / dostępne" : "brak podstawy"}</strong></div>
          <div><span>Finanse</span><strong>niewidoczne</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Dokumenty dla organu</span>
        <h2>CMR, licencje, pozwolenia, certyfikaty</h2>
        <div class="list">
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${doc.integrityHash}</small>
            </div>
          `).join("") || `<p class="muted">Brak widocznych dokumentów dla organu.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Historia kontroli organów</span>
        <h2>Historia kontroli w audycie</h2>
        <div class="list">
          ${history.map((row) => `
            <div class="row">
              <strong>${row.authoritySubtype} / ${row.controlType}</strong>
              <span>${vehiclePlate(state, row.vehicleId)} / ${row.place}</span>
              <mark class="${tone(row.result)}">${row.result}</mark>
            </div>
          `).join("") || `<p class="muted">Brak historii kontroli.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderFerry(state, engine, selected) {
  const bookings = state.ferryBookings || [];
  const activeBooking = bookings.find((booking) => booking.transportId === selected.id) || bookings[0] || null;
  const transport = activeBooking
    ? state.transports.find((item) => item.id === activeBooking.transportId) || selected
    : selected;
  const payments = (state.ferryPayments || []).filter((payment) => payment.transportId === transport.id);
  const docs = state.documents.filter((doc) => doc.transportId === transport.id && doc.type === "ferry_ticket");
  const driverTime = state.driverTime.find((item) => item.driverId === transport.driverId);

  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Silnik promowy / intermodalny</span>
            <h2>${transport.number} / ${transport.pickup.address} -> ${transport.delivery.address}</h2>
          </div>
          <mark class="${tone(transport.status)}">${transport.status}</mark>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.MARK_FERRY_REQUIRED, "Oznacz wymóg promu", { transportId: transport.id, transportMode: "INTERMODAL" })}
          ${actionButton(engine, ActionTypes.BOOK_FERRY, "Zarezerwuj DFDS", {
            transportId: transport.id,
            operatorCompanyId: "co-ferry-dfds",
            departurePort: "Calais",
            arrivalPort: "Dover",
            departureAt: "2026-05-28T08:30:00.000Z",
            arrivalAt: "2026-05-28T10:00:00.000Z",
            vehicleId: transport.vehicleId,
            driverId: transport.driverId,
            cost: 430,
            etaAfterFerry: "2026-05-28T14:30:00.000Z"
          })}
          ${actionButton(engine, ActionTypes.START_PORT_NAVIGATION, "Jedź do portu", { transportId: transport.id })}
          ${actionButton(engine, ActionTypes.CHECK_IN_FERRY, "Odprawa promowa", { transportId: transport.id })}
          ${actionButton(engine, ActionTypes.BOARD_FERRY, "Wejście na prom", { transportId: transport.id, restHours: 1.5, etaAfterFerry: "2026-05-28T14:30:00.000Z" })}
          ${actionButton(engine, ActionTypes.COMPLETE_FERRY, "Zakończ prom", { transportId: transport.id, etaAfterFerry: "2026-05-28T14:30:00.000Z" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Wyślij status promu", { transportId: transport.id, body: "Prom Calais-Dover aktywny. Kierowca odpoczywa, ETA zaktualizowane.", language: "pl" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Aktywna rezerwacja</span>
        <h2>${activeBooking?.ferry_booking_id || "brak rezerwacji"}</h2>
        <div class="detail-grid">
          <div><span>Tryb</span><strong>${transport.transportMode || "ROAD"}</strong></div>
          <div><span>Operator</span><strong>${companyName(state, activeBooking?.operatorCompanyId) || "DFDS Ferry"}</strong></div>
          <div><span>Port startowy</span><strong>${activeBooking?.departurePort || "Calais"}</strong></div>
          <div><span>Port docelowy</span><strong>${activeBooking?.arrivalPort || "Dover"}</strong></div>
          <div><span>Pojazd</span><strong>${vehiclePlate(state, activeBooking?.vehicleId || transport.vehicleId)}</strong></div>
          <div><span>Kierowca</span><strong>${userName(state, activeBooking?.driverId || transport.driverId)}</strong></div>
          <div><span>Wyjazd promu</span><strong>${formatTime(activeBooking?.departureAt)}</strong></div>
          <div><span>Przyjazd promu</span><strong>${formatTime(activeBooking?.arrivalAt)}</strong></div>
          <div><span>ETA po promie</span><strong>${formatTime(transport.eta || activeBooking?.etaAfterFerry)}</strong></div>
          <div><span>Czas kierowcy</span><strong>${driverTime ? `${driverTime.breakHours}h pauzy / ${driverTime.remainingLegalHours}h limitu` : "brak"}</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Rezerwacje promowe</span>
        <h2>ferry_booking_id jako osobna tożsamość</h2>
        <div class="list">
          ${bookings.map((booking) => `
            <div class="row">
              <strong>${booking.ferry_booking_id}</strong>
              <span>${transportNumber(state, booking.transportId)} / ${booking.departurePort}-${booking.arrivalPort}</span>
              <mark class="${tone(booking.status)}">${booking.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak rezerwacji promowych.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Dokumenty i płatność promowa</span>
        <h2>Powiązanie z Document Engine i Wallet Engine</h2>
        <div class="list">
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${doc.integrityHash}</small>
            </div>
          `).join("") || `<p class="muted">Brak biletu promowego dla wybranego transportu.</p>`}
          ${payments.map((payment) => `
            <div class="row">
              <strong>${payment.amount} ${payment.currency}</strong>
              <span>${companyName(state, payment.operatorCompanyId)}</span>
              <mark class="${tone(payment.status)}">${payment.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak widocznej płatności promowej.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderService(state, engine, selected) {
  const requests = state.serviceRequests || [];
  const request = requests.find((item) => item.transportId === selected.id) || requests[0] || null;
  const transport = request
    ? state.transports.find((item) => item.id === request.transportId) || selected
    : selected;
  const providers = state.serviceProviders || [];
  const payments = (state.servicePayments || []).filter((payment) => payment.transportId === transport.id);
  const serviceDocs = state.documents.filter((doc) => doc.transportId === transport.id && doc.type === "service_report");
  const provider = providers.find((item) => item.companyId === request?.providerCompanyId) || providers[0] || null;

  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">23.11 Serwis / Warsztat / Pomoc mobilna</span>
            <h2>Obsługa awarii pojazdu ${vehiclePlate(state, transport.vehicleId)}</h2>
          </div>
          <mark class="${tone(request?.status || "brak")}" >${request?.status || "brak zgłoszenia"}</mark>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.REPORT_BREAKDOWN, "Zgłoś awarię", {
            transportId: transport.id,
            faultType: "awaria opony",
            description: "spadek ciśnienia i konieczna pomoc na trasie",
            gps: { lat: 52.096, lng: 18.93 },
            etaAfter: "2026-05-27T13:40:00.000Z"
          })}
          ${actionButton(engine, ActionTypes.REQUEST_TECHNICAL_SERVICE, "Wybierz serwis mobilny", {
            transportId: transport.id,
            providerType: "mobile_service",
            providerCompanyId: "co-mobile-service-a",
            cost: 280
          })}
          ${actionButton(engine, ActionTypes.ACCEPT_SERVICE_JOB, "Serwis przyjmuje", { transportId: transport.id })}
          ${actionButton(engine, ActionTypes.COMPLETE_SERVICE_JOB, "Zakończ serwis", {
            transportId: transport.id,
            cost: 280,
            rating: 5,
            etaAfter: "2026-05-27T13:40:00.000Z"
          })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Kontakt przez GL", { transportId: transport.id, body: "Serwis techniczny jedzie do pojazdu. Kontakt przez GL.", language: "pl" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Zakres danych dla serwisu</span>
        <h2>Serwis nie widzi całego transportu ani finansów</h2>
        <div class="detail-grid">
          <div><span>Pojazd</span><strong>${vehiclePlate(state, request?.vehicleId || transport.vehicleId)}</strong></div>
          <div><span>Awaria</span><strong>${request?.faultType || "brak"}</strong></div>
          <div><span>Lokalizacja</span><strong>${gpsLabel(request?.gps || transport.pickup?.gps)}</strong></div>
          <div><span>Numer transportu</span><strong>${transport.number}</strong></div>
          <div><span>Dostawca</span><strong>${companyName(state, request?.providerCompanyId) || "nie wybrano"}</strong></div>
          <div><span>ETA</span><strong>${formatTime(request?.etaAfter || transport.eta)}</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Najbliższe usługi</span>
        <h2>Warsztat, serwis mobilny, pomoc drogowa</h2>
        <div class="card-grid">
          ${providers.map((item) => `
            <article class="mini-card" data-ui-type="info">
              <strong>${item.name}</strong>
              <span>${item.type} / ${item.responseMinutes} min</span>
              <mark class="good">${item.baseCost} ${item.currency}</mark>
            </article>
          `).join("") || `<p class="muted">Brak widocznych serwisów.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Zgłoszenia serwisowe</span>
        <h2>czas reakcji, koszt, dokument i ocena</h2>
        <div class="list">
          ${requests.map((item) => `
            <div class="row">
              <strong>${item.faultType}</strong>
              <span>${transportNumber(state, item.transportId)} / ${companyName(state, item.providerCompanyId)}</span>
              <mark class="${tone(item.status)}">${item.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak zgłoszeń serwisowych.</p>`}
          ${payments.map((payment) => `
            <div class="row">
              <strong>${payment.amount} ${payment.currency}</strong>
              <span>${companyName(state, payment.providerCompanyId)}</span>
              <mark class="${tone(payment.status)}">${payment.status}</mark>
            </div>
          `).join("")}
          ${serviceDocs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.integrityHash}</span>
              <small>${doc.type}</small>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderApi(state, engine) {
  if (!state.apiClients.length) {
    return renderAccessDenied("Silnik API GL", "Klienci API i audyt sa dostepne tylko dla rol kontrolnych platformy.");
  }
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Silnik API GL</span>
        <h2>External systems need api_client_id and scopes</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.SIMULATE_API_CALL, "ERP tworzy ladunek", { apiClientId: "api-erp-nord", apiAction: "CREATE_LOAD" })}
          ${actionButton(engine, ActionTypes.SIMULATE_API_CALL, "ERP: zablokowana akcja finansowa", { apiClientId: "api-erp-nord", apiAction: "RELEASE_PAYMENT" })}
          ${actionButton(engine, ActionTypes.SIMULATE_API_CALL, "Aktualizacja GPS", { apiClientId: "api-gps-baltic", apiAction: "GPS_UPDATE" })}
        </div>
      </article>
      <article class="panel">
        <h2>Klienci API</h2>
        <div class="list">
          ${state.apiClients.map((client) => `
            <div class="row">
              <strong>${client.name}</strong>
              <span>${client.scopes.join(", ")}</span>
              <mark class="${tone(client.status)}">${client.usedToday}/${client.dailyLimit}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <span class="eyebrow">Audyt API</span>
      <h2>Every integration call leaves a row</h2>
      <div class="list">
        ${state.apiAudit.slice(0, 10).map((row) => `
          <div class="row">
            <strong>${row.apiClientId}</strong>
            <span>${row.action}</span>
            <mark class="${tone(row.result)}">${row.result}</mark>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderIntegrations(state, engine) {
  if (!state.integrations.length) {
    return renderAccessDenied("Silnik integracji zewnetrznych", "Kontrola integracji jest ukryta dla tej roli.");
  }
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Silnik integracji zewnetrznych</span>
        <h2>ERP, GPS, insurance and payment bridges</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_INTEGRATION_SYNC, "Synchronizuj ERP", { integrationId: "int-erp-1" })}
          ${actionButton(engine, ActionTypes.RUN_INTEGRATION_SYNC, "Synchronizuj GPS", { integrationId: "int-gps-1" })}
          ${actionButton(engine, ActionTypes.RUN_INTEGRATION_SYNC, "Synchronizuj ubezpieczenia", { integrationId: "int-ins-1" })}
        </div>
      </article>
      <article class="panel">
        <h2>Region rules</h2>
        <div class="list">
          ${state.regionRules.map((rule) => `
            <div class="row">
              <strong>${rule.region.toUpperCase()}</strong>
              <span>${rule.languages.join(", ")}</span>
              <mark class="good">${rule.currency}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <h2>Status integracji</h2>
      <div class="card-grid">
        ${state.integrations.map((integration) => `
          <article class="mini-card" data-ui-type="info">
            <strong>${integration.name}</strong>
            <span>${integration.type} / ${companyName(state, integration.companyId)}</span>
            <mark class="${tone(integration.status)}">${integration.status}</mark>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCompliance(state, engine, selected) {
  const checks = state.complianceChecks.filter((check) => check.transportId === selected.id);
  const crewPlan = state.crewPlans.find((plan) => plan.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Tachograph / Crew Compliance</span>
        <h2>Driver time is checked before risky steps</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_COMPLIANCE_CHECK, "Uruchom kontrole zgodnosci", { transportId: selected.id })}
        </div>
        <div class="detail-grid">
          <div><span>Driver</span><strong>${userName(state, selected.driverId) || "not assigned"}</strong></div>
          <div><span>Double crew</span><strong>${crewPlan?.doubleCrew ? "yes" : "no"}</strong></div>
          <div><span>Ferry/Rail</span><strong>${crewPlan?.ferryRailAllowance ? "allowed" : "none"}</strong></div>
        </div>
      </article>
      <article class="panel">
        <h2>Tachograph imports</h2>
        <div class="list">
          ${state.tachographImports.slice(0, 8).map((row) => `
            <div class="row">
              <strong>${userName(state, row.driverId)}</strong>
              <span>${row.drivingHours}h drive / ${row.breakHours}h break</span>
              <mark class="${tone(row.status)}">${row.status}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <h2>Compliance checks</h2>
      <div class="list">
        ${checks.map((check) => `
          <div class="row">
            <strong>${check.id}</strong>
            <span>${check.violations.join("; ") || "no violations"}</span>
            <mark class="${tone(check.status)}">${check.status}</mark>
          </div>
        `).join("") || `<p class="muted">No compliance checks for selected transport.</p>`}
      </div>
    </section>
  `;
}

function renderResilience(state, engine) {
  if (!state.serviceHealth.length) {
    return renderAccessDenied("Scaling / Backup / Anti Failure", "Resilience controls are restricted to platform control roles.");
  }
  const checks = state.resilienceChecks || [];
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Anti Failure Engine</span>
        <h2>Stan uslug, kopie zapasowe i tryb awaryjny</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_RESILIENCE_CHECK, "Uruchom kontrole odpornosci", {})}
        </div>
        <div class="detail-grid">
          <div><span>Emergency</span><strong>${state.emergencyMode.enabled ? "enabled" : "ready"}</strong></div>
          <div><span>Critical</span><strong>${state.emergencyMode.criticalServices.join(", ")}</strong></div>
          <div><span>Backups</span><strong>${state.backupSnapshots.filter((backup) => backup.status === "ok").length}/${state.backupSnapshots.length}</strong></div>
        </div>
      </article>
      <article class="panel">
        <h2>Stan uslug</h2>
        <div class="list">
          ${state.serviceHealth.map((service) => `
            <div class="row">
              <strong>${service.name}</strong>
              <span>${service.id}</span>
              <mark class="${tone(service.status)}">${service.status}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <h2>Kontrole odpornosci</h2>
      <div class="list">
        ${checks.map((check) => `
          <div class="row">
            <strong>${check.id}</strong>
            <span>${check.degradedServiceIds.join(", ") || "all healthy"}</span>
            <mark class="${check.backupOk ? "good" : "danger"}">${check.backupOk ? "backup ok" : "backup risk"}</mark>
          </div>
        `).join("") || `<p class="muted">No resilience checks yet.</p>`}
      </div>
    </section>
  `;
}

function renderTrust(state) {
  return `
    <section class="panel">
      ${renderProfileAdminReputation(state)}
    </section>
  `;
}

function renderAi(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">AI Control Agent</span>
        <h2>Agent kontrolny, nie cichy decydent</h2>
        <p class="muted">AI moze tworzyc alerty, blokowac kolejny krok i przekazac sprawe adminowi. Nie usuwa danych i nie wyplaca pieniedzy.</p>
        ${actionButton(engine, ActionTypes.AI_RUN_CHECK, "Uruchom inspekcje AI", { transportId: selected.id })}
      </article>
      <article class="panel">
        <h2>AI alerts</h2>
        <div class="list">
          ${state.aiAlerts.map((alert) => `
            <div class="row">
              <strong>${transportNumber(state, alert.transportId)}</strong>
              <span>${alert.reason}</span>
              <mark class="${tone(alert.severity)}">${alert.severity}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderAudit(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Audit Log</span>
      <h2>Read only, event sourced</h2>
      <div class="audit-table">
        ${state.audit.map((row) => `
        <div class="audit-row">
          <span>${formatTime(row.at)}</span>
          <strong>${row.requestedAction || row.action}</strong>
          <span>${row.actorRole}</span>
          <span>${row.objectType}:${row.objectId}</span>
          <span>${row.result || "success"}</span>
          <span>${row.newState || "-"}</span>
          <small>${row.reason}</small>
        </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSystemTests(state, engine, selected) {
  const blockedWorkflow = selected
    ? !engine.explainAction(ActionTypes.RELEASE_PAYMENT, { transportId: selected.id }).ok
    : true;
  const tests = [
    ["localStorage dziala", storageAvailable()],
    ["reset demo dziala", engine.explainAction(ActionTypes.RESET_DEMO, {}).ok],
    ["sa dane startowe", state.demoDataVersion && state.users.length > 0 && state.companies.length > 0],
    ["permissions dzialaja", typeof engine.modules.permissions.canPerformAction === "function"],
    ["workflow blokuje zle akcje", blockedWorkflow],
    ["audit log zapisuje zdarzenia", state.audit.length > 0],
    ["brak transportow nie wysypuje UI", selectedTransport({ transports: [], session: {} }) === null],
    ["DEMO_MODE aktywny", DEMO_MODE === true]
  ];
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Testy systemu</span>
          <h2>Checklist stabilnosci demo</h2>
        </div>
      </div>
      <div class="test-list">
        ${tests.map(([label, ok]) => `
          <div class="test-row ${ok ? "pass" : "fail"}">
            <strong>${label}</strong>
            <mark class="${ok ? "good" : "danger"}">${ok ? "PASS" : "FAIL"}</mark>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderContextRail(state, engine, selected, roleConfig) {
  const aiAlerts = state.aiAlerts.filter((alert) => !selected || alert.transportId === selected.id).slice(0, 3);
  const developer = canViewDeveloperPanel(state);
  const activity = developer
    ? state.audit.filter((row) => !selected || row.transportId === selected.id || row.objectId === selected.id).slice(0, 5)
    : operationalActivity(state, selected).slice(0, 5);
  return `
    <aside class="context-rail">
      <section class="context-panel">
        <span class="eyebrow">${roleConfig.workspace}</span>
        <h2>Kontekst</h2>
        <div class="context-stack">
          <div><span>Status</span><strong>${selected?.status || "brak transportu"}</strong></div>
          <div><span>GPS</span><strong>${selected ? `${gpsLabel(selected.pickup.gps)} / ${gpsLabel(selected.delivery.gps)}` : "-"}</strong></div>
          <div><span>ETA</span><strong>${selected?.eta ? formatTime(selected.eta) : "brak"}</strong></div>
          <div><span>Platnosc</span><strong>${selected ? (state.access?.canViewFinancials ? selected.paymentStatus : "ograniczone") : "-"}</strong></div>
        </div>
      </section>
      <section class="context-panel">
        <span class="eyebrow">AI / powiadomienia</span>
        <h2>Alerty</h2>
        <div class="list compact-list">
          ${aiAlerts.map((alert) => `
            <div class="row">
              <strong>${alert.type}</strong>
              <span>${alert.status}</span>
              <small>${alert.reason}</small>
            </div>
          `).join("") || `<p class="muted">Brak aktywnych alertow.</p>`}
        </div>
      </section>
      <section class="context-panel">
        <span class="eyebrow">Aktywnosc</span>
        <h2>Ostatnie zdarzenia</h2>
        <div class="list compact-list">
          ${activity.map((row) => `
            <div class="row">
              <strong>${developer ? row.requestedAction || row.action : row.title}</strong>
              <span>${developer ? row.result || "success" : row.value}</span>
              <small>${developer ? row.reason : row.note}</small>
            </div>
          `).join("") || `<p class="muted">Brak aktywnosci.</p>`}
        </div>
      </section>
    </aside>
  `;
}

function operationalActivity(state, selected) {
  const messages = (state.messages || [])
    .filter((message) => !selected || message.transportId === selected.id)
    .map((message) => ({
      title: "Komunikat",
      value: message.authorRole ? valueLabel(message.authorRole) : "GL",
      note: message.body || "Nowa wiadomosc"
    }));
  const transportItems = selected ? [
    {
      title: "Transport",
      value: selected.number,
      note: valueLabel(selected.status)
    },
    {
      title: "ETA",
      value: selected.eta ? formatTime(selected.eta) : "brak",
      note: selected.delivery?.address || "punkt dostawy"
    }
  ] : [];
  const alerts = (state.aiAlerts || [])
    .filter((alert) => !selected || alert.transportId === selected.id)
    .map((alert) => ({
      title: "Alert",
      value: valueLabel(alert.severity || alert.status),
      note: valueLabel(alert.type)
    }));
  return [...transportItems, ...messages, ...alerts];
}

function renderProfile(state) {
  const subject = resolveProfileSubject(state);
  const rating = profileRating(state, subject);
  const stats = profileStats(state, subject);
  const reviews = profileReviews(state, subject);
  const canViewSensitive = canViewSensitiveProfileData(state, subject);
  const canReview = canReviewSubject(state, subject);
  const transports = profileTransports(state, subject).slice(0, 5);
  return `
    <section class="profile-shell business-profile">
      <article class="profile-hero clean-profile">
        <div class="profile-avatar large">${profileInitials(subject.name)}</div>
        <div class="profile-hero-main">
          <span class="eyebrow">${ui("profile.eyebrow")}</span>
          <h2>${subject.name}</h2>
          <div class="profile-meta-line">
            <span>${subject.roleLabel}</span>
            <mark class="${tone(subject.status)}">${profileVerificationLabel(subject.status)}</mark>
          </div>
          <div class="profile-rating">
            <div class="stars" aria-label="${ui("profile.rating")} ${rating.label}">${renderStars(rating.value)}</div>
            <strong>${rating.hasRating ? rating.label : ui("profile.no_reviews")}</strong>
            <span>${rating.hasRating ? ui("profile.reviews_count", { count: rating.reviewCount }) : ui("profile.no_reviews")}</span>
          </div>
        </div>
        <div class="profile-safe-data">
          <div><span>${ui("profile.country")}</span><strong>${subject.country}</strong></div>
          <div><span>${ui("profile.languages")}</span><strong>${subject.languages.join(", ")}</strong></div>
          <div><span>${ui("profile.joined")}</span><strong>${subject.joinedAt}</strong></div>
          <div><span>${ui("profile.phone")}</span><strong>${canViewSensitive && subject.phone ? subject.phone : ui("profile.phone_hidden")}</strong></div>
        </div>
      </article>

      <section class="profile-grid">
        <article class="panel business-panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">${ui("profile.stats")}</span>
              <h2>${ui("profile.reputation")}</h2>
            </div>
          </div>
          <div class="profile-stat-grid">
            ${stats.map((item) => `
              <div class="profile-stat">
                <span>${item.label}</span>
                <strong>${item.value}</strong>
                <small>${item.sub || ui("profile.public_scope")}</small>
              </div>
            `).join("")}
          </div>
        </article>

        <article class="panel business-panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">${ui("profile.review_title")}</span>
              <h2>${ui("profile.reviews")}</h2>
            </div>
          </div>
          <div class="review-list">
            ${reviews.map((review) => `
              <article class="review-card">
                <div class="stars">${renderStars(review.rating)}</div>
                <strong>${review.author}</strong>
                <p>${review.comment}</p>
                <small>${review.date} / ${ui("profile.transports")}: ${review.eventLabel}</small>
              </article>
            `).join("") || `<p class="muted">${ui("profile.no_public_reviews")}</p>`}
          </div>
          ${canReview ? renderReviewForm() : `<p class="muted review-locked">${ui("profile.review_available_after")}</p>`}
        </article>
      </section>

      <section class="grid two">
        <article class="panel business-panel">
          <span class="eyebrow">${ui("profile.cooperation_history")}</span>
          <h2>${ui("profile.transports")}</h2>
          <div class="business-list">
            ${transports.map((transport) => `
              <div class="business-row" data-ui-type="info">
                <strong>${transport.number}</strong>
                <span>${valueLabel(transport.status)}</span>
                <small>${transport.pickup.address} -> ${transport.delivery.address}</small>
              </div>
            `).join("") || `<p class="muted">Brak zakończonych współprac w profilu.</p>`}
          </div>
        </article>
        <article class="panel business-panel">
          <span class="eyebrow">${ui("profile.info")}</span>
          <h2>Dane publiczne</h2>
          <p class="muted">${canViewSensitive ? "Widzisz swoje dane kontaktowe i publiczny profil zaufania." : ui("profile.sensitive_hidden")}</p>
          <div class="detail-grid">
            <div><span>${ui("profile.role")}</span><strong>${subject.roleLabel}</strong></div>
            <div><span>${ui("profile.status")}</span><strong>${profileVerificationLabel(subject.status)}</strong></div>
            <div><span>${ui("profile.country")}</span><strong>${subject.country}</strong></div>
            <div><span>${ui("profile.rating")}</span><strong>${rating.hasRating ? rating.label : ui("profile.no_reviews")}</strong></div>
          </div>
        </article>
      </section>
      ${platformProfileAdmin(state) ? renderProfileAdminReputation(state) : ""}
    </section>
  `;
}

function renderReviewForm() {
  return `
    <form class="demo-form review-form" data-profile-review-form="true">
      <label>${ui("profile.rating")}<select name="rating">
        <option value="5">5 / 5</option>
        <option value="4">4 / 5</option>
        <option value="3">3 / 5</option>
        <option value="2">2 / 5</option>
        <option value="1">1 / 5</option>
      </select></label>
      <label>${ui("profile.review_comment")}<input name="comment" value="Wspolpraca zakonczona poprawnie" /></label>
      <div class="action-unavailable" data-ui-type="info"><strong>${ui("profile.add_review")}</strong><span>Opinia będzie zapisywana po podłączeniu procesu zatwierdzania.</span></div>
    </form>
  `;
}

function renderProfileAdminReputation(state) {
  if (!platformProfileAdmin(state)) return `
    <article class="panel profile-note">
      <span class="eyebrow">${ui("profile.info")}</span>
      <h2>${ui("profile.sensitive_hidden")}</h2>
      <p class="muted">${ui("profile.public_scope")}</p>
    </article>
  `;
  const records = state.trustRecords.slice().sort((a, b) => b.score - a.score).slice(0, 6);
  return `
    <article class="panel profile-admin-reputation">
      <span class="eyebrow">${ui("profile.admin_analysis")}</span>
      <h2>${ui("profile.reputation")}</h2>
      <p class="muted">${ui("profile.admin_analysis_note")}</p>
      <div class="profile-admin-list">
        ${records.map((record) => {
          const subject = profileParticipant(state, record.subjectId, record.subjectType === "company" ? "company" : "user");
          const rating = profileRating(state, subject || { id: record.subjectId, kind: record.subjectType });
          return `
            <button class="row profile-row detail-card" data-ui-type="details" data-profile-target="${record.subjectId}" data-profile-type="${subject?.kind || record.subjectType}">
              <strong>${subject?.name || subjectName(state, record.subjectId)}</strong>
              <span>${subject?.roleLabel || valueLabel(record.subjectType)}</span>
              <small>${renderStars(rating.value)} ${rating.label}</small>
            </button>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function resolveProfileSubject(state) {
  const targetId = state.session.profileTargetId;
  if (targetId) {
    const target = profileParticipant(state, targetId, state.session.profileTargetType);
    if (target) return target;
  }
  const user = state.users.find((item) => item.id === state.session.userId);
  return profileSubjectForUser(state, user);
}

function profileSubjectForUser(state, user) {
  if (!user) {
    return {
      id: "demo",
      kind: "user",
      name: "Uzytkownik demo",
      roleLabel: ui("ui.private_person"),
      role: state.session.role,
      status: AccountStatuses.DRAFT,
      country: "PL",
      languages: ["PL"],
      joinedAt: "27.05.2026",
      phone: ""
    };
  }
  return {
    id: user.id,
    kind: "user",
    name: user.name,
    roleLabel: RoleLabels[user.selectedRole || user.roles?.[0] || state.session.role] || valueLabel(user.selectedRole || state.session.role),
    role: user.selectedRole || user.roles?.[0] || state.session.role,
    status: user.accountStatus,
    country: user.countryOfResidence || user.country || "PL",
    languages: profileLanguages(user.selectedRole || user.roles?.[0] || state.session.role),
    joinedAt: "27.05.2026",
    phone: user.phone,
    companyId: user.companyId,
    source: user
  };
}

function profileParticipant(state, id, type = null) {
  if (!id) return null;
  const company = state.companies.find((item) => item.id === id);
  if (company && (!type || type === "company" || String(id).startsWith("co-"))) {
    return {
      id: company.id,
      kind: "company",
      name: company.name,
      roleLabel: companyTypeLabel(company.type),
      role: company.type,
      status: company.verificationStatus || company.status,
      country: company.country || "PL",
      languages: profileLanguages(company.type),
      joinedAt: "27.05.2026",
      phone: company.publicPhone || "",
      companyId: company.id,
      source: company
    };
  }
  const user = state.users.find((item) => item.id === id);
  if (user) return profileSubjectForUser(state, user);
  const parking = state.parking?.find((item) => item.id === id);
  if (parking) {
    return {
      id: parking.id,
      kind: "parking",
      name: parking.name,
      roleLabel: "Parking",
      role: "parking",
      status: "verified",
      country: "PL",
      languages: ["PL"],
      joinedAt: "27.05.2026",
      phone: "",
      source: parking
    };
  }
  return null;
}

function profileLink(state, id, type) {
  const subject = profileParticipant(state, id, type);
  if (!subject) return ui("ui.not_assigned");
  return `<span class="profile-link" role="button" tabindex="0" data-ui-type="details" data-profile-target="${subject.id}" data-profile-type="${subject.kind}">${subject.name}</span>`;
}

function profileRating(state, subject) {
  const record = state.trustRecords.find((item) => item.subjectId === subject?.id);
  if (!record) return { hasRating: false, value: 0, label: "", score: 0, reviewCount: 0 };
  const value = Math.max(0, Math.min(5, Math.round((Number(record.score || 0) / 20) * 100) / 100));
  const reviewCount = Math.max(1, record.history?.length || 0);
  return {
    hasRating: true,
    value,
    label: `${value.toFixed(2)} / 5.00`,
    score: record.score,
    reviewCount
  };
}

function renderStars(value = 0) {
  const rating = Number(value || 0);
  return [1, 2, 3, 4, 5].map((index) => {
    const className = rating >= index
      ? "full"
      : rating > index - 1
      ? "partial"
      : "empty";
    return `<span class="${className}">${className === "empty" ? "☆" : "★"}</span>`;
  }).join("");
}

function profileInitials(name = "GL") {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GL";
}

function profileVerificationLabel(status) {
  if ([AccountStatuses.APPROVED, AccountStatuses.VERIFIED, "verified", "approved"].includes(status)) return ui("profile.verified");
  if ([AccountStatuses.PENDING, AccountStatuses.IDENTITY_PENDING, AccountStatuses.ROLE_DOCUMENTS_PENDING, "pending"].includes(status)) return ui("profile.pending");
  return ui("profile.unverified");
}

function profileStats(state, subject) {
  if (subject.kind === "user" && subject.role === Roles.DRIVER) return driverProfileStats(state, subject);
  if (subject.kind === "user" && subject.role === Roles.WAREHOUSE_WORKER) return warehouseProfileStats(state, subject);
  if (subject.kind === "company" && subject.role === "carrier") return carrierProfileStats(state, subject);
  if (subject.kind === "company" && subject.role === "client") return clientProfileStats(state, subject);
  if (subject.kind === "company" && ["workshop", "mobile_service", "roadside_assistance"].includes(subject.role)) return serviceProfileStats(state, subject);
  if (subject.kind === "company" && ["insurance", "insurer"].includes(subject.role)) return insurerProfileStats(state, subject);
  return [
    profileStat("profile.transport_count", profileTransports(state, subject).length, ui("profile.public_scope")),
    profileStat("profile.punctuality", "96%", ui("profile.reputation")),
    profileStat("profile.complaints", profileDisputes(state, subject).length, ui("profile.reviews"))
  ];
}

function driverProfileStats(state, subject) {
  const transports = profileTransports(state, subject);
  const damages = transports.flatMap((transport) => state.photos.filter((photo) => photo.transportId === transport.id && photo.type === "damage"));
  return [
    profileStat("profile.transport_count", transports.length, ui("profile.transports")),
    profileStat("profile.punctuality", punctualityLabel(transports), ui("profile.reputation")),
    profileStat("profile.complaints", profileDisputes(state, subject).length, ui("profile.reviews")),
    profileStat("profile.damages", damages.length, ui("profile.documents")),
    profileStat("profile.cancelled_orders", transports.filter((item) => item.status === TransportStatuses.CANCELLED).length, ui("profile.transports")),
    profileStat("profile.last_activity", transports[0]?.status || ui("ui.missing"), ui("profile.last_activity")),
    profileStat("profile.documents_verified", subject.source?.documentsValid ? ui("profile.yes") : ui("profile.no"), ui("profile.documents"))
  ];
}

function carrierProfileStats(state, subject) {
  const transports = profileTransports(state, subject);
  const drivers = state.users.filter((user) => user.companyId === subject.id && user.roles?.includes(Roles.DRIVER));
  const driverRatings = drivers.map((driver) => profileRating(state, profileSubjectForUser(state, driver)).value).filter(Boolean);
  return [
    profileStat("profile.vehicle_count", state.vehicles.filter((vehicle) => vehicle.companyId === subject.id).length, ui("profile.public_scope")),
    profileStat("profile.transport_count", transports.length, ui("profile.transports")),
    profileStat("profile.fleet_punctuality", punctualityLabel(transports), ui("profile.reputation")),
    profileStat("profile.complaints", profileDisputes(state, subject).length, ui("profile.reviews")),
    profileStat("profile.documents_verified", profileVerificationLabel(subject.status), ui("profile.documents")),
    profileStat("profile.insurance_status", state.insurancePolicies.some((policy) => transports.some((transport) => transport.id === policy.transportId)) ? ui("profile.verified") : ui("profile.pending"), ui("profile.documents")),
    profileStat("profile.driver_average", driverRatings.length ? `${average(driverRatings).toFixed(2)} / 5.00` : ui("profile.no_reviews"), ui("profile.rating"))
  ];
}

function clientProfileStats(state, subject) {
  const transports = profileTransports(state, subject);
  return [
    profileStat("profile.load_count", transports.length, ui("profile.transports")),
    profileStat("profile.payment_punctuality", "98%", ui("profile.reputation")),
    profileStat("profile.disputes", profileDisputes(state, subject).length, ui("profile.reviews")),
    profileStat("profile.cancelled_orders", transports.filter((item) => item.status === TransportStatuses.CANCELLED).length, ui("profile.transports")),
    profileStat("profile.cooperation_rating", profileRating(state, subject).label || ui("profile.no_reviews"), ui("profile.rating"))
  ];
}

function warehouseProfileStats(state, subject) {
  const transports = profileTransports(state, subject);
  return [
    profileStat("profile.handled_transports", transports.length, ui("profile.transports")),
    profileStat("profile.average_load_time", "42 min", ui("profile.reputation")),
    profileStat("profile.driver_rating", profileRating(state, subject).label || ui("profile.no_reviews"), ui("profile.rating")),
    profileStat("profile.complaints", profileDisputes(state, subject).length, ui("profile.reviews")),
    profileStat("profile.communication_quality", "97%", ui("profile.reputation"))
  ];
}

function serviceProfileStats(state, subject) {
  const requests = (state.serviceRequests || []).filter((item) => item.providerCompanyId === subject.id);
  return [
    profileStat("profile.service_count", requests.length, ui("profile.transports")),
    profileStat("profile.punctuality", requests.length ? `${Math.max(70, 100 - average(requests.map((item) => item.responseMinutes || 30)))}%` : "95%", ui("profile.reputation")),
    profileStat("profile.complaints", 0, ui("profile.reviews")),
    profileStat("profile.rating", profileRating(state, subject).label || ui("profile.no_reviews"), ui("profile.rating")),
    profileStat("profile.service_scope", companyTypeLabel(subject.role), ui("profile.info"))
  ];
}

function insurerProfileStats(state, subject) {
  return [
    profileStat("profile.policy_count", state.insurancePolicies.length, ui("profile.documents")),
    profileStat("profile.claims_status", state.claims?.length ? ui("profile.pending") : ui("profile.verified"), ui("profile.reputation")),
    profileStat("profile.decision_time", "2 dni", ui("profile.reputation")),
    profileStat("profile.cooperation_rating", profileRating(state, subject).label || ui("profile.no_reviews"), ui("profile.rating")),
    profileStat("profile.case_count", state.disputes.length, ui("profile.cooperation_history"))
  ];
}

function profileStat(labelKey, value, sub) {
  return { label: ui(labelKey), value, sub };
}

function profileTransports(state, subject) {
  if (subject.kind === "company") {
    if (subject.role === "client") return state.transports.filter((item) => item.clientCompanyId === subject.id);
    if (subject.role === "carrier") return state.transports.filter((item) => item.carrierCompanyId === subject.id);
    return state.transports.filter((item) => item.clientCompanyId === subject.id || item.carrierCompanyId === subject.id);
  }
  if (subject.role === Roles.DRIVER) return state.transports.filter((item) => item.driverId === subject.id);
  if (subject.role === Roles.WAREHOUSE_WORKER) return state.transports.filter((item) => item.warehouseWorkerId === subject.id);
  return state.transports.filter((item) => item.driverId === subject.id || item.warehouseWorkerId === subject.id);
}

function profileDisputes(state, subject) {
  const transportIds = new Set(profileTransports(state, subject).map((item) => item.id));
  return state.disputes.filter((item) => transportIds.has(item.transportId));
}

function profileReviews(state, subject) {
  const record = state.trustRecords.find((item) => item.subjectId === subject.id);
  const reviews = (record?.history || []).slice(0, 3).map((item) => ({
    rating: profileRating(state, subject).value,
    author: "GL Enterprise",
    comment: valueLabel(item.reason || ui("profile.reputation")),
    date: formatTime(item.at),
    eventLabel: ui("profile.cooperation_history")
  }));
  (state.serviceRequests || [])
    .filter((item) => item.providerCompanyId === subject.id && item.status === "completed")
    .forEach((request) => reviews.unshift({
      rating: 5,
      author: companyName(state, request.carrierCompanyId) || "Przewoznik",
      comment: "Usluga zakonczona poprawnie, szybka reakcja serwisu.",
      date: formatTime(request.etaAfter),
      eventLabel: request.id
    }));
  return reviews;
}

function canReviewSubject(state, subject) {
  if (subject.kind === "company" && ["workshop", "mobile_service", "roadside_assistance"].includes(subject.role)) {
    return (state.serviceRequests || []).some((item) => item.providerCompanyId === subject.id && item.status === "completed");
  }
  return profileTransports(state, subject).some((item) => [TransportStatuses.COMPLETED, TransportStatuses.PAID].includes(item.status));
}

function canViewSensitiveProfileData(state, subject) {
  if (platformProfileAdmin(state)) return true;
  if (subject.kind === "user" && subject.id === state.session.userId) return true;
  if (subject.kind === "company" && subject.id === state.session.companyId) return true;
  return false;
}

function platformProfileAdmin(state) {
  return canViewDeveloperPanel(state);
}

function canViewDeveloperPanel(state) {
  return canViewDeveloperRole(state.session.role);
}

function canViewDeveloperRole(role) {
  return [
    Roles.PLATFORM_OWNER,
    Roles.GL_OPERATOR,
    Roles.ADMIN_FINANCE,
    Roles.SUPER_ADMIN,
    Roles.ADMIN
  ].includes(role);
}

function companyTypeLabel(type) {
  const labels = {
    client: "Klient",
    carrier: "Przewoznik",
    warehouse: "Magazyn",
    workshop: "Warsztat",
    mobile_service: "Serwis mobilny",
    roadside_assistance: "Pomoc drogowa",
    insurance: "Ubezpieczyciel",
    insurer: "Ubezpieczyciel",
    payment: "Operator platnosci",
    security: "Ochrona",
    customs_agent: "Agencja celna",
    authority: "Organ kontrolny",
    ferry_operator: "Operator promowy",
    rail_operator: "Operator kolejowy"
  };
  return labels[type] || valueLabel(type);
}

function profileLanguages(roleOrType) {
  if ([Roles.DRIVER, "carrier", "workshop", "mobile_service", "roadside_assistance"].includes(roleOrType)) return ["PL", "EN", "DE"];
  if (["customs_agent", Roles.CUSTOMS_AGENT, "ferry_operator", Roles.FERRY_OPERATOR].includes(roleOrType)) return ["PL", "EN"];
  return ["PL"];
}

function punctualityLabel(transports) {
  if (!transports.length) return "brak danych";
  const risky = transports.filter((item) => item.status === TransportStatuses.BLOCKED || item.riskFlagged || item.activeDisputeId).length;
  return `${Math.max(70, 100 - risky * 9)}%`;
}

function average(values) {
  const clean = values.map(Number).filter(Number.isFinite);
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function renderCompanies(state, engine) {
  if (isCarrierActor(state)) return renderCarrierCompanyWorkspace(state, engine);
  return `
    <section class="panel">
      <span class="eyebrow">Firmy</span>
      <h2>Firmy</h2>
      <div class="card-grid">
        ${state.companies.map((company) => `
          <button class="mini-card detail-card" data-ui-type="details" data-profile-target="${company.id}" data-profile-type="company">
            <strong>${company.name}</strong>
            <span>${company.type}</span>
            <mark class="${tone(company.status || "active")}">${company.status || "active"}</mark>
            <small class="detail-hint">Zobacz profil firmy</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCarrierCompanyWorkspace(state, engine) {
  const companyId = activeCompanyId(state);
  const company = state.companies.find((item) => item.id === companyId);
  const documents = (state.companyDocuments || []).filter((item) => item.companyId === companyId);
  const selectedVehicle = state.vehicles.find((item) => item.id === state.session.selectedVehicleId && item.companyId === companyId)
    || carrierVehicles(state)[0];
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Moja firma</span>
            <h2>${company?.name || state.access?.activeContextLabel || "Firma przewoznika"}</h2>
          </div>
          <mark class="${tone(company?.verificationStatus || company?.status)}">${valueLabel(company?.verificationStatus || company?.status || "brak")}</mark>
        </div>
        <div class="detail-grid">
          <div><span>NIP / VAT EU</span><strong>${company?.vatEu || company?.vat || ui("ui.missing")}</strong></div>
          <div><span>Kraj</span><strong>${company?.country || "PL"}</strong></div>
          <div><span>Adres</span><strong>${company?.address || ui("ui.missing")}</strong></div>
          <div><span>Reputacja</span><strong>${renderStars(profileRating(state, profileParticipant(state, companyId, "company")).value)}</strong></div>
        </div>
      </article>
      ${renderVehicleDetailCard(selectedVehicle)}
    </section>
    <section class="grid two">
      ${renderCarrierDriversPanel(state, engine)}
      ${renderCarrierVehiclesPanel(state, engine)}
    </section>
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Dokumenty firmy</span>
          <h2>Licencje, OCP i dokumenty przewoznika</h2>
        </div>
        <mark class="info">${documents.length}</mark>
      </div>
      <div class="transport-table compact-table">
        <div class="table-row table-head"><span>Dokument</span><span>Typ</span><span>Status</span><span>Dodano</span></div>
        ${documents.map((document) => `
          <button class="table-row detail-card" data-ui-type="details" data-detail-route="/documents">
            <span>${document.label}</span>
            <span>${document.type}</span>
            <span>${valueLabel(document.status)}</span>
            <span>${document.uploadedAt ? formatTime(document.uploadedAt) : ui("ui.missing")}</span>
            <small class="detail-hint">Zobacz dokumenty</small>
          </button>
        `).join("") || `<p class="muted">Brak dokumentow firmy w tym kontekście.</p>`}
      </div>
    </section>
  `;
}

function renderVehicleDetailCard(vehicle) {
  if (!vehicle) {
    return `
      <article class="panel">
        <span class="eyebrow">Karta pojazdu</span>
        <h2>Brak pojazdu</h2>
        <p class="muted">Dodaj pojazd, aby zobaczyc jego status i dokumenty.</p>
      </article>
    `;
  }
  return `
    <article class="panel vehicle-detail-card">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Karta pojazdu</span>
          <h2>${vehicle.plate}</h2>
        </div>
        <mark class="${tone(vehicle.status || (vehicle.available ? "active" : "inactive"))}">${vehicleStatusLabel(vehicle)}</mark>
      </div>
      <div class="detail-grid">
        <div><span>Typ</span><strong>${vehicle.vehicleType || vehicle.type}</strong></div>
        <div><span>Marka i model</span><strong>${vehicle.brand || ""} ${vehicle.model || ""}</strong></div>
        <div><span>Kraj rejestracji</span><strong>${vehicle.registrationCountry || "PL"}</strong></div>
        <div><span>DMC</span><strong>${vehicle.grossWeightKg || 0} kg</strong></div>
        <div><span>Ladownosc</span><strong>${vehicle.payloadKg || 0} kg</strong></div>
        <div><span>Palety</span><strong>${vehicle.palletCapacity || 0}</strong></div>
        <div><span>Wyposazenie</span><strong>${vehicleFeatureLabel(vehicle)}</strong></div>
        <div><span>Dokumenty</span><strong>${vehicle.documentsValid ? "Wazne" : "Do uzupelnienia"}</strong></div>
        <div><span>Ubezpieczenie</span><strong>${vehicle.insuranceValid ? "Wazne" : "Do uzupelnienia"}</strong></div>
        <div><span>Przeglad</span><strong>${vehicle.technicalInspectionValid ? "Wazny" : "Do uzupelnienia"}</strong></div>
      </div>
    </article>
  `;
}

function renderUsers(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Użytkownicy</span>
      <h2>Uzytkownicy</h2>
      <div class="transport-table compact-table">
        ${state.users.map((user) => `
          <div class="table-row" data-ui-type="info">
            <span>${user.id}</span>
            <span>${user.name}</span>
            <span>${user.roles?.[0] || "role"}</span>
            <span>${companyName(state, user.companyId) || "platforma"}</span>
            <span>${user.phone}</span>
            <span>${user.accountStatus}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStatistics(state) {
  if (canViewDeveloperPanel(state)) {
    return `
      ${renderDeveloperPanel(state)}
      <section class="metrics">
        ${metric(ui("dashboard.metric.active_transports"), state.transports.length, ui("dashboard.metric.all_companies"))}
        ${metric(ui("dashboard.metric.payments"), state.payments.length, ui("dashboard.metric.payment_status"))}
        ${metric(ui("dashboard.metric.documents"), state.documents.length, ui("dashboard.metric.transport_files"))}
        ${metric(ui("dashboard.metric.risk"), state.aiAlerts.length, ui("dashboard.metric.to_review"))}
        ${metric(ui("dashboard.metric.notifications"), (state.messages || []).length, ui("dashboard.metric.messages"))}
      </section>
    `;
  }
  const metrics = dashboardOperationalMetrics(state, selectedTransport(state));
  return `
    <section class="metrics">
      ${metrics.map((item) => metric(item.label, item.value, item.sub)).join("")}
    </section>
    <section class="panel">
      <span class="eyebrow">${ui("dashboard.metric.active_scope")}</span>
      <h2>${ui("dashboard.title")}</h2>
      <div class="module-grid">
        ${menuForRole(state.session.role, state.access?.actor || { role: state.session.role }).slice(0, 8).map((module) => `<div class="module-pill">${valueLabel(module.label)}</div>`).join("")}
      </div>
    </section>
  `;
}

function renderSystem(state, engine) {
  return `
    ${renderDeveloperPanel(state)}
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">System</span>
        <h2>Operacje demo</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_RESILIENCE_CHECK, "Uruchom kontrole odpornosci", {})}
          ${actionButton(engine, ActionTypes.RESET_DEMO, "Przywroc dane demo", {})}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">${ui("developer.mode")}</span>
        <h2>${ui("developer.title")}</h2>
        <p class="muted">${ui("developer.description")}</p>
      </article>
    </section>
  `;
}

function renderDeveloperPanel(state) {
  if (!canViewDeveloperPanel(state)) return "";
  const routeCount = menuForRole(state.session.role, state.access?.actor || { role: state.session.role }).length;
  return `
    <section class="panel developer-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">${ui("developer.mode")}</span>
          <h2>${ui("developer.title")}</h2>
        </div>
      </div>
      <p class="muted">${ui("developer.description")}</p>
      <div class="metrics">
        ${metric(ui("developer.modules"), routeCount, ui("developer.routes"))}
        ${metric(ui("developer.event_bus"), state.events.length, ui("developer.events"))}
        ${metric(ui("developer.audit_log"), state.audit.length, ui("developer.read_only"))}
        ${metric(ui("developer.permission_engine"), state.access?.actor?.permissions?.length || 0, ui("developer.permissions"))}
        ${metric(ui("developer.database"), state.demoDataVersion, ui("developer.demo_snapshot"))}
      </div>
    </section>
  `;
}

function renderSecurityActions(engine, selected, state) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.SCAN_LICENSE_PLATE, "Skanuj tablice", { licensePlate: vehiclePlate(state, selected.vehicleId), reason: "gate arrival check" })}
      ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Zatwierdz brame", { transportId: selected.id, checkpoint: "pickup", status: "cleared", reason: "Gate cleared" })}
    </div>
  `;
}

function renderCustomsActions(engine, selected) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.START_CUSTOMS, "Rozpocznij odprawe", { transportId: selected.id })}
      ${actionButton(engine, ActionTypes.CLEAR_CUSTOMS, "Zwolnij celnie", { transportId: selected.id })}
    </div>
  `;
}

function renderAuthorityActions(engine, selected) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.START_AUTHORITY_CONTROL, "Rozpocznij kontrole", { transportId: selected.id })}
      ${actionButton(engine, ActionTypes.PASS_AUTHORITY_CONTROL, "Kontrola pozytywna", { transportId: selected.id })}
    </div>
  `;
}

function renderFerryActions(engine, selected) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.BOOK_FERRY, "Zarezerwuj prom", { transportId: selected.id, operatorCompanyId: "co-ferry-dfds" })}
      ${actionButton(engine, ActionTypes.COMPLETE_FERRY, "Zakoncz prom", { transportId: selected.id })}
    </div>
  `;
}

function renderServiceActions(engine, selected, state) {
  const provider = state.serviceProviders?.[0];
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.ACCEPT_SERVICE_JOB, "Przyjmij serwis", { transportId: selected.id, providerCompanyId: provider?.companyId })}
      ${actionButton(engine, ActionTypes.COMPLETE_SERVICE_JOB, "Zakoncz serwis", { transportId: selected.id, cost: 320, rating: 5 })}
    </div>
  `;
}

function renderAdmin(state, engine, selected) {
  const targetUser = state.users.find((user) => user.accountStatus !== "blocked" && user.id !== state.session.userId) || state.users[0];
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Admin Panel</span>
        <h2>Manual controls still go through Core Engine</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.ADMIN_BLOCK_TRANSPORT, "Zablokuj transport", { transportId: selected.id, reason: "reczna blokada demo" })}
          ${actionButton(engine, ActionTypes.ADMIN_RESOLVE_DISPUTE, "Rozwiaz spor", { transportId: selected.id, reason: "decyzja administratora na podstawie dowodow" })}
          ${actionButton(engine, ActionTypes.ADMIN_BLOCK_ACCOUNT, "Zablokuj konto", { userId: targetUser.id, reason: "ryzyko konta demo" })}
          ${actionButton(engine, ActionTypes.RESET_DEMO, "Przywroc demo", {})}
        </div>
      </article>
      ${renderAuditSlice(state, selected)}
    </section>
  `;
}

function renderTransportCard(state, transport) {
  const progress = StatusProgress[transport.status] ?? 10;
  return `
    <article class="panel transport-card">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Transport</span>
          <h2>${transport.number} / ${transport.cargo.description}</h2>
        </div>
        <mark class="${tone(transport.status)}">${valueLabel(transport.status)}</mark>
      </div>
      <div class="detail-grid">
        <div><span>Klient</span><strong>${profileLink(state, transport.clientCompanyId, "company")}</strong></div>
        <div><span>Przewoznik</span><strong>${transport.carrierCompanyId ? profileLink(state, transport.carrierCompanyId, "company") : ui("ui.not_assigned")}</strong></div>
        <div><span>Kierowca</span><strong>${transport.driverId ? profileLink(state, transport.driverId, "user") : ui("ui.not_assigned")}</strong></div>
        <div><span>Tryb</span><strong>${valueLabel(transport.transportMode || "ROAD")}</strong></div>
        <div><span>Załadunek</span><strong>${transport.pickup.address}</strong></div>
        <div><span>Dostawa</span><strong>${transport.delivery.address}</strong></div>
        <div><span>ETA</span><strong>${transport.eta ? formatTime(transport.eta) : "brak"}</strong></div>
        <div><span>Platnosc</span><strong>${state.access?.canViewFinancials ? valueLabel(transport.paymentStatus) : ui("ui.restricted")}</strong></div>
      </div>
      <div class="progress">
        <span style="width:${progress}%"></span>
      </div>
      <p class="muted">${transport.pickup.address} -> ${transport.delivery.address}</p>
    </article>
  `;
}

function renderTimeline(state, transport) {
  return `
    <article class="panel">
      <span class="eyebrow">Przebieg transportu</span>
      <h2>Historia statusów</h2>
      <div class="timeline">
        ${transport.statusHistory.slice().reverse().map((item) => `
          <div class="timeline-row">
            <span>${formatTime(item.at)}</span>
            <strong>${item.from ? valueLabel(item.from) : "start"} -> ${valueLabel(item.to)}</strong>
            <p>${item.reason}</p>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderAuditSlice(state, transport) {
  const rows = state.audit.filter((item) => item.objectId === transport.id || item.transportId === transport.id).slice(0, 8);
  return `
    <article class="panel">
      <span class="eyebrow">Dziennik administracyjny</span>
      <h2>${transport.number}</h2>
      <div class="list">
        ${rows.map((row) => `
          <div class="row">
            <strong>${row.action}</strong>
            <span>${row.actorRole}</span>
            <small>${row.reason}</small>
          </div>
        `).join("") || `<p class="muted">Brak wpisów administracyjnych.</p>`}
      </div>
    </article>
  `;
}

function renderPhotoList(state, transport) {
  const photos = state.photos.filter((photo) => photo.transportId === transport.id);
  return `
    <article class="panel">
      <h2>Photos in documentation</h2>
      <div class="list">
        ${photos.map((photo) => `
          <div class="row">
            <strong>${photo.label}</strong>
            <span>${photo.type}</span>
            <mark class="${tone(photo.state)}">${photo.state}</mark>
          </div>
        `).join("") || `<p class="muted">No photos yet.</p>`}
      </div>
    </article>
  `;
}

function isCarrierActor(state) {
  const actor = state.access?.actor || {};
  return [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(actor.role || state.session.role)
    || actor.companyType === "carrier";
}

function activeCompanyId(state) {
  return state.access?.actor?.companyId || state.session.companyId || null;
}

function activeUserId(state) {
  return state.access?.actor?.userId || state.session.userId || null;
}

function carrierDrivers(state) {
  const companyId = activeCompanyId(state);
  const memberships = new Set((state.userCompanyRoles || [])
    .filter((membership) => membership.companyId === companyId && membership.status === "active")
    .map((membership) => membership.userId));
  return (state.users || []).filter((user) => (
    user.roles?.includes(Roles.DRIVER)
    && (user.companyId === companyId || memberships.has(user.id))
  ));
}

function carrierAssignableDrivers(state) {
  return carrierDrivers(state).filter((driver) => (
    driver.documentsValid
    && [AccountStatuses.APPROVED, AccountStatuses.VERIFIED].includes(driver.accountStatus)
    && (state.driverTime.find((item) => item.driverId === driver.id)?.legalToComplete !== false)
  ));
}

function carrierVehicles(state) {
  const companyId = activeCompanyId(state);
  return (state.vehicles || []).filter((vehicle) => vehicle.companyId === companyId);
}

function carrierAssignableVehicles(state, transport) {
  return carrierVehicles(state).filter((vehicle) => (
    vehicleCompatibleWithLoad(vehicle, transport)
    && vehicle.documentsValid !== false
    && vehicle.insuranceValid !== false
    && vehicle.technicalInspectionValid !== false
    && vehicle.status !== "inactive"
    && vehicle.status !== "service"
    && vehicle.available !== false
  ));
}

function carrierTransports(state) {
  const companyId = activeCompanyId(state);
  const userId = activeUserId(state);
  return (state.transports || []).filter((transport) => (
    transport.carrierCompanyId === companyId || transport.driverId === userId
  ));
}

function availableCarrierLoads(state) {
  const companyId = activeCompanyId(state);
  return (state.transports || []).filter((transport) => (
    [TransportStatuses.PUBLISHED, TransportStatuses.CARRIER_OFFER_RECEIVED, TransportStatuses.CARRIER_ACCEPTED].includes(transport.status)
    && (!transport.carrierCompanyId || transport.carrierCompanyId === companyId)
  ));
}

function vehicleCompatibleWithLoad(vehicle, transport) {
  if (!transport) return true;
  const text = `${transport.cargo?.description || ""} ${transport.cargo?.dimensions || ""} ${transport.requirements || ""}`.toLowerCase();
  if ((text.includes("adr") || text.includes("hazmat")) && !vehicle.adr) return false;
  if ((text.includes("chlod") || text.includes("cold") || text.includes("refriger")) && !vehicle.refrigerated && !String(vehicle.type || "").includes("chlod")) return false;
  if (Number(vehicle.payloadKg || 0) && Number(transport.cargo?.weightKg || 0) > Number(vehicle.payloadKg || 0)) return false;
  if (Number(vehicle.palletCapacity || 0) && palletsForLoad(transport) > Number(vehicle.palletCapacity || 0)) return false;
  return true;
}

function loadRequirementsLabel(transport) {
  const requirements = [];
  const text = `${transport.cargo?.description || ""} ${transport.cargo?.dimensions || ""}`.toLowerCase();
  if (text.includes("adr")) requirements.push("ADR");
  if (text.includes("chlod") || text.includes("cold")) requirements.push("chlodnia");
  requirements.push(`${palletsForLoad(transport)} palet`);
  requirements.push(`${transport.cargo?.weightKg || 0} kg`);
  return requirements.join(" / ");
}

function palletsForLoad(transport) {
  const dimensions = String(transport?.cargo?.dimensions || "");
  const match = dimensions.match(/(\d+)\s*(palet|pallet|plt)/i);
  return match ? Number(match[1]) : Number(transport?.cargo?.pallets || 0);
}

function escrowStatusLabel(state, transport) {
  const escrow = (state.escrows || []).find((item) => item.transportId === transport.id);
  if (escrow) return `Escrow: ${valueLabel(escrow.status)}`;
  return valueLabel(transport.paymentStatus || "payment_pending");
}

function vehicleFeatureLabel(vehicle) {
  return [
    vehicle.adr ? "ADR" : null,
    vehicle.refrigerated ? "chlodnia" : null,
    vehicle.lift ? "winda" : null
  ].filter(Boolean).join(" / ") || "standard";
}

function vehicleStatusLabel(vehicle) {
  if (!vehicle) return ui("ui.missing");
  if (vehicle.status === "service") return "w serwisie";
  if (vehicle.status === "inactive" || vehicle.available === false) return "nieaktywny";
  return "aktywny";
}

function blockerList(engine, transport) {
  if (!transport) return `<div class="blocker blocked"><strong>Transport</strong><span>Brak transportow</span></div>`;
  const checks = [
    [ActionTypes.PUBLISH_LOAD, "Opublikuj ladunek"],
    [ActionTypes.ACCEPT_CARRIER, "Akceptuj przewoznika"],
    [ActionTypes.ASSIGN_DRIVER, "Przypisz kierowce"],
    [ActionTypes.START_TRANSIT, "Rozpocznij trase"],
    [ActionTypes.RELEASE_PAYMENT, "Zwolnij platnosc"]
  ];
  return checks.map(([action, label]) => {
    const payload = defaultPayloadFor(action, transport);
    const result = engine.explainAction(action, payload);
    return `
      <div class="blocker ${result.ok ? "ok" : "blocked"}">
        <strong>${label}</strong>
        <span>${result.ok ? readinessMessage(action) : result.reasons.join("; ")}</span>
      </div>
    `;
  }).join("");
}

function defaultPayloadFor(action, transport) {
  if (!transport) return {};
  if (action === ActionTypes.ACCEPT_CARRIER) return { transportId: transport.id, carrierCompanyId: "co-carrier-a" };
  if (action === ActionTypes.ASSIGN_DRIVER) return { transportId: transport.id, driverId: "u-driver-1", vehicleId: "vh-1" };
  return { transportId: transport.id };
}

function actionButton(engine, action, label, payload = {}) {
  if (!engine?.explainAction) return disabledAction(label, "Akcja niedostepna w tym widoku");
  const result = engine.explainAction(action, payload);
  if (!result.ok) return disabledAction(label, valueLabel(result.reasons[0]));
  return `
    <button class="action ready" data-ui-type="action" data-action="${action}" data-payload="${encodePayload(payload)}">
      <strong>${valueLabel(label)}</strong>
      <span>${readinessMessage(action)}</span>
    </button>
  `;
}

function disabledAction(label, reason) {
  return `
    <div class="action-unavailable" data-ui-type="info">
      <strong>${valueLabel(label)}</strong>
      <span>${valueLabel(reason)}</span>
    </div>
  `;
}

function readinessMessage(action) {
  const messages = {
    [ActionTypes.PUBLISH_LOAD]: "action.ready.publish_load",
    [ActionTypes.ADD_LOAD_PHOTO]: "action.ready.add_load_photo",
    [ActionTypes.CONFIRM_GPS]: "action.ready.confirm_gps",
    [ActionTypes.ASSIGN_DRIVER]: "action.ready.assign_driver",
    [ActionTypes.UPLOAD_DOCUMENT]: "action.ready.upload_document",
    [ActionTypes.PARKING_REPORT]: "action.ready.parking_report",
    [ActionTypes.RELEASE_PAYMENT]: "action.ready.release_payment"
  };
  return ui(messages[action] || "action.ready.generic");
}

function renderNoTransport() {
  return `
    <section class="panel empty-state">
      <span class="eyebrow">Transporty</span>
      <h2>Brak transportow</h2>
      <p class="muted">Nie ma teraz transportu przypisanego do tego widoku.</p>
      <div class="actions">
        ${disabledAction("Akcja transportowa", "Brak transportow")}
      </div>
    </section>
  `;
}

function renderNoTransportTable() {
  return `
    <section class="panel empty-state">
      <span class="eyebrow">Transporty</span>
      <h2>Brak transportow</h2>
      <p class="muted">Nie ma transportow do wyswietlenia. Mozesz utworzyc nowy transport w widoku Utworz ladunek.</p>
    </section>
  `;
}

function transportScopedView(view) {
  return new Set([
    "details",
    "warehouse",
    "carrier",
    "driver_assignment",
    "live_map",
    "gps",
    "photos",
    "parking",
    "documents",
    "payments",
    "insurance",
    "communication",
    "security",
    "customs",
    "authority",
    "ferry",
    "service_orders",
    "service",
    "compliance",
    "ai",
    "admin"
  ]).has(view);
}

function renderCreateTransportForm(state) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.CREATE_LOAD}">
      <label>Opis ladunku<input name="description" value="Transport paletowy" /></label>
      <label>Odbior<input name="pickupAddress" value="Gdansk terminal" /></label>
      <label>Dostawa<input name="deliveryAddress" value="Berlin magazyn" /></label>
      <label>GPS odbioru lat<input name="pickupGps.lat" value="54.3520" inputmode="decimal" /></label>
      <label>GPS odbioru lng<input name="pickupGps.lng" value="18.6466" inputmode="decimal" /></label>
      <label>GPS dostawy lat<input name="deliveryGps.lat" value="52.5200" inputmode="decimal" /></label>
      <label>GPS dostawy lng<input name="deliveryGps.lng" value="13.4050" inputmode="decimal" /></label>
      <label>Waga kg<input name="weightKg" value="1200" inputmode="numeric" /></label>
      <label>Cena<input name="price" value="1500" inputmode="numeric" /></label>
      <input type="hidden" name="clientCompanyId" value="${state.session.companyId || "co-client-a"}" />
      <button class="action ready" data-ui-type="action" type="submit"><strong>Utworz transport</strong><span>Transport pojawi sie na liscie zlecen</span></button>
    </form>
  `;
}

function renderPhotoForm(selected) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.ADD_LOAD_PHOTO}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Typ zdjecia<input name="type" value="loading" /></label>
      <label>Opis zdjecia<input name="label" value="Zdjecie ladunku" /></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>Dodaj zdjecie z formularza</strong><span>Mozesz dodac zdjecie ladunku</span></button>
    </form>
  `;
}

function renderGpsForm(selected) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.CONFIRM_GPS}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Pickup lat<input name="pickupGps.lat" value="${selected.pickup.gps?.lat ?? 54.3520}" inputmode="decimal" /></label>
      <label>Pickup lng<input name="pickupGps.lng" value="${selected.pickup.gps?.lng ?? 18.6466}" inputmode="decimal" /></label>
      <label>Delivery lat<input name="deliveryGps.lat" value="${selected.delivery.gps?.lat ?? 52.5200}" inputmode="decimal" /></label>
      <label>Delivery lng<input name="deliveryGps.lng" value="${selected.delivery.gps?.lng ?? 13.4050}" inputmode="decimal" /></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>Zapisz GPS z formularza</strong><span>Mozesz zapisac GPS</span></button>
    </form>
  `;
}

function renderDriverAssignmentForm(state, selected) {
  const drivers = carrierAssignableDrivers(state);
  const vehicles = carrierAssignableVehicles(state, selected);
  return `
    <form class="demo-form" data-form-action="${ActionTypes.ASSIGN_DRIVER}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Kierowca<select name="driverId">${drivers.map((driver) => `<option value="${driver.id}">${driver.name}</option>`).join("")}</select></label>
      <label>Pojazd<select name="vehicleId">${vehicles.map((vehicle) => `<option value="${vehicle.id}">${vehicle.plate}</option>`).join("")}</select></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>Przypisz kierowce z formularza</strong><span>Mozesz przypisac kierowce</span></button>
    </form>
  `;
}

function renderDocumentForm(selected) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.UPLOAD_DOCUMENT}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Typ dokumentu<select name="type">
        <option value="cmr">CMR</option>
        <option value="pickup_confirmation">Potwierdzenie zaladunku</option>
        <option value="delivery_confirmation">Potwierdzenie rozladunku</option>
        <option value="mrn">MRN</option>
      </select></label>
      <label>Nazwa dokumentu<input name="label" value="Dokument CMR" /></label>
      <button class="action ready" data-ui-type="action" type="submit"><strong>Dodaj dokument z formularza</strong><span>Mozesz dodac dokument</span></button>
    </form>
  `;
}

function renderParkingReportForm(state) {
  const parking = state.parking[0];
  return `
    <form class="demo-form" data-form-action="${ActionTypes.PARKING_REPORT}">
      <label>Parking<select name="parkingId">${state.parking.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></label>
      <label>Wolne miejsca<input name="freePlaces" value="${parking?.freePlaces ?? 4}" inputmode="numeric" /></label>
      <input type="hidden" name="credible" value="true" />
      <button class="action ready" data-ui-type="action" type="submit"><strong>Zglos parking z formularza</strong><span>Mozesz zglosic parking</span></button>
    </form>
  `;
}

function metric(label, value, sub) {
  return `
    <article class="metric" data-ui-type="info">
      <span>${valueLabel(label)}</span>
      <strong>${value}</strong>
      <small>${valueLabel(sub)}</small>
    </article>
  `;
}

function renderAccessDenied(title, message) {
  return `
    <section class="panel access-panel">
      <span class="eyebrow">${ui("access.engine")}</span>
      <h2>${valueLabel(title)}</h2>
      <p class="muted">${valueLabel(message)}</p>
    </section>
  `;
}

export function selectedTransport(state) {
  if (!state?.transports?.length) return null;
  return state.transports.find((transport) => transport.id === state.session?.selectedTransportId) || state.transports[0] || null;
}

function financialTotals(state) {
  const wallets = state.wallets || [];
  const payments = state.payments || [];
  const escrows = state.escrows || [];
  const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0);
  const pendingPayments = payments.filter((payment) => String(payment.status).includes("pending"));
  const reservedPayments = payments.filter((payment) => String(payment.status).includes("reserved"));
  const blockedPayments = payments.filter((payment) => String(payment.status).includes("blocked"));

  return {
    available: sum(wallets, (wallet) => wallet.balance),
    blocked: sum(wallets, (wallet) => (wallet.heldBalance || 0) + (wallet.blockedBalance || 0)) + sum(blockedPayments, (payment) => payment.amount),
    pending: sum(wallets, (wallet) => wallet.pendingBalance) + sum(pendingPayments, (payment) => payment.amount),
    escrow: sum(escrows.filter((escrow) => escrow.status !== "released"), (escrow) => escrow.amount),
    inTransit: sum(wallets, (wallet) => wallet.paymentsInTransit) + sum(reservedPayments, (payment) => payment.amount),
    disputes: (state.disputes || []).length,
    totalSystem: sum(wallets, (wallet) => wallet.balance + (wallet.heldBalance || 0) + (wallet.pendingBalance || 0))
  };
}

function calculateGlFee(transport) {
  const gross = Number(transport?.price || 0);
  const currency = "EUR";
  const feeGross = Math.round(gross * 0.03 * 100) / 100;
  const tax = Math.round(feeGross * 0.23 * 100) / 100;
  const feeNet = Math.max(0, Math.round((feeGross - tax) * 100) / 100);
  return {
    gross,
    currency,
    feeGross,
    feeNet,
    tax,
    carrierAmount: Math.max(0, Math.round((gross - feeGross) * 100) / 100)
  };
}

function financeMetric(label, amount, currency, toneName) {
  return `
    <article class="finance-metric ${toneName}">
      <span>${valueLabel(label)}</span>
      <strong>${formatMoney(amount, currency)}</strong>
      <small>${ui("finance.demo_ledger")}</small>
    </article>
  `;
}

function formatMoney(amount, currency = "EUR") {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function formatWalletDate(value) {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  };
}

function entityName(state, id) {
  if (!id) return "-";
  if (String(id).startsWith("escrow:")) return `Escrow ${String(id).replace("escrow:", "")}`;
  return companyName(state, id) || userName(state, id) || id;
}

function walletOwnerName(state, wallet) {
  return userName(state, wallet.ownerUserId)
    || companyName(state, wallet.ownerCompanyId)
    || (wallet.ownerCompanyId === "platform" ? "GL Enterprise" : wallet.ownerCompanyId);
}

function financeTone(value) {
  const text = String(value || "").toLowerCase();
  if (["critical", "high"].includes(text) || text.includes("blocked") || text.includes("rejected") || text.includes("cancelled") || text.includes("disputed")) return "danger";
  if (["info", "low"].includes(text) || text.includes("released") || text.includes("completed")) return "good";
  if (text.includes("pending") || text.includes("reserved") || text.includes("escrow") || text.includes("medium") || text.includes("refunded")) return "warning";
  return "info";
}

function companyName(state, companyId) {
  return state.companies.find((company) => company.id === companyId)?.name || "";
}

function userName(state, userId) {
  return state.users.find((user) => user.id === userId)?.name || "";
}

function vehiclePlate(state, vehicleId) {
  return state.vehicles.find((vehicle) => vehicle.id === vehicleId)?.plate || "GDA 5K92";
}

function transportNumber(state, transportId) {
  return state.transports.find((transport) => transport.id === transportId)?.number || transportId;
}

function subjectName(state, subjectId) {
  return companyName(state, subjectId)
    || userName(state, subjectId)
    || state.parking.find((parking) => parking.id === subjectId)?.name
    || subjectId;
}

function gpsLabel(gps) {
  if (!gps) return "missing";
  return `${Number(gps.lat).toFixed(3)}, ${Number(gps.lng).toFixed(3)}`;
}

function driverTimeLabel(state, driverId) {
  const record = state.driverTime.find((item) => item.driverId === driverId);
  if (!record) return "driver time missing";
  return `${record.remainingLegalHours}h legal left / ${record.legalToComplete ? "legal" : "blocked"}`;
}

function tone(value) {
  const text = String(value || "");
  if (text.includes("blocked") || text.includes("risk") || text.includes("dispute") || text.includes("high") || text.includes("suspended") || text.includes("violation") || text.includes("denied")) return "danger";
  if (text.includes("pending") || text.includes("open") || text.includes("medium") || text.includes("review") || text.includes("degraded")) return "warning";
  return "good";
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function sanitizeStateForUi(value, key = "") {
  const textKeys = new Set([
    "address",
    "body",
    "comment",
    "description",
    "dimensions",
    "label",
    "name",
    "phone",
    "reason"
  ]);
  if (Array.isArray(value)) return value.map((item) => sanitizeStateForUi(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizeStateForUi(entryValue, entryKey)])
    );
  }
  if (typeof value === "string" && textKeys.has(key)) return escapeHtml(value);
  return value;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function storageAvailable() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return true;
    const key = "__gl_storage_test__";
    window.localStorage.setItem(key, "1");
    const ok = window.localStorage.getItem(key) === "1";
    window.localStorage.removeItem(key);
    return ok;
  } catch (error) {
    return false;
  }
}

function encodePayload(payload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function viewTitle(role, view, actor = { role }) {
  return menuForRole(role, actor).find((item) => item.id === view)?.label || "Panel";
}

function roleOptionsForTopbar(state) {
  const actor = state.access?.actor || {};
  const currentUser = (state.users || []).find((user) => user.id === state.session.userId);
  return [...new Set([
    ...(actor.roleOptions || []),
    ...(currentUser?.roles || []),
    ...((state.access?.contextOptions || []).flatMap((context) => context.compatibleRoles || [])),
    state.session.role
  ].filter(Boolean))];
}

function contextOptionsForTopbar(state) {
  const contexts = state.access?.contextOptions || [];
  const companyContexts = contexts.filter((context) => context.contextType === "company");
  const platformContexts = contexts.filter((context) => context.contextType === "platform");
  if (companyContexts.length <= 1 && platformContexts.length === 0) return [];
  if (companyContexts.length === 0 && platformContexts.length <= 1) return [];
  const visibleContexts = contexts.filter((context) => context.contextType !== "private" || companyContexts.length === 0);
  return visibleContexts.length > 1 ? visibleContexts : [];
}

function contextSelected(state, context) {
  return (state.session.contextType || "private") === context.contextType
    && (state.session.companyId || "") === (context.companyId || "")
    && (!context.userCompanyRoleId || (state.session.companyRoleId || "") === (context.userCompanyRoleId || ""));
}
