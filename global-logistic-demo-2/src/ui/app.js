import { ActionTypes } from "../core/constants.js";
import { GLCoreEngine } from "../core/gl-core-engine.js";
import { moduleForRoute, normalizeRoute } from "../core/modules-config.js";
import { t } from "../translation/ui-translation-engine.js";
import { renderApp } from "./renderers.js";
import { parsePayload, payloadFromForm } from "./action-handler.js";
import { firstRouteForRole, routeForRoleView } from "./role-config.js";

const engine = new GLCoreEngine();
const root = document.querySelector("#app");
let internalRouteChange = false;

window.__glSubmitForm = (button) => {
  const form = button?.closest?.("[data-form-action]");
  if (form) submitDemoForm(form);
  return false;
};

function render(snapshot = engine.getSnapshot()) {
  root.innerHTML = renderApp(snapshot, engine);
  bindRenderedForms();
}

engine.subscribe(render);
render();
syncRouteFromHash();

root.addEventListener("click", (event) => {
  const target = eventTargetElement(event);
  if (!target) return;

  const brandToggle = target.closest("[data-brand-menu-toggle]");
  if (brandToggle) {
    toggleBrandMenu(brandToggle);
    return;
  }

  const brandCancel = target.closest("[data-brand-menu-cancel]");
  if (brandCancel) {
    closeBrandMenu(brandCancel.closest("[data-brand-menu]"));
    return;
  }

  const brandConfirmReset = target.closest("[data-brand-confirm-reset]");
  if (brandConfirmReset) {
    closeBrandMenu(brandConfirmReset.closest("[data-brand-menu]"));
    engine.dispatchAction(ActionTypes.RESET_DEMO, {}, { demoOnly: true });
    setRouteHash("/onboarding");
    return;
  }

  const brandMenuAction = target.closest("[data-brand-menu-action]");
  if (brandMenuAction) {
    handleBrandMenuAction(brandMenuAction);
    return;
  }

  const resetButton = target.closest("[data-reset-demo]");
  if (resetButton) {
    if (!confirmDemoReset()) return;
    engine.dispatchAction(ActionTypes.RESET_DEMO, {}, { demoOnly: true });
    setRouteHash("/onboarding");
    return;
  }

  const languageOption = target.closest("[data-language-option]");
  if (languageOption) {
    engine.dispatchAction(ActionTypes.SELECT_LANGUAGE, {
      language: languageOption.dataset.language,
      country: languageOption.dataset.country,
      detectedLanguage: languageOption.dataset.detectedLanguage || null
    });
    return;
  }

  const roleButton = target.closest("[data-role]");
  if (roleButton) {
    engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: roleButton.dataset.role }, { demoOnly: true });
    return;
  }

  const moduleButton = target.closest("[data-module-route]");
  if (moduleButton) {
    navigateToRoute(moduleButton.dataset.moduleRoute);
    return;
  }

  const profileTab = target.closest("[data-profile-tab]");
  if (profileTab) {
    event.preventDefault();
    activateProfileTab(profileTab);
    return;
  }

  const profileTarget = target.closest("[data-profile-target]");
  if (profileTarget) {
    navigateToProfile(profileTarget.dataset.profileTarget, profileTarget.dataset.profileType);
    return;
  }

  const detailTarget = target.closest("[data-detail-route]");
  if (detailTarget) {
    if (detailTarget.dataset.transport) {
      engine.dispatchAction(ActionTypes.SELECT_TRANSPORT, { transportId: detailTarget.dataset.transport });
    }
    navigateToRoute(detailTarget.dataset.detailRoute, {
      selectedVehicleId: detailTarget.dataset.vehicle || null
    });
    return;
  }

  const submitButton = target.closest('button[type="submit"]');
  const submitForm = submitButton?.closest("[data-form-action]");
  if (submitForm) {
    event.preventDefault();
    submitDemoForm(submitForm);
    return;
  }

  const viewButton = target.closest("[data-view]");
  if (viewButton) {
    navigateToView(viewButton.dataset.view);
    return;
  }

  const transportButton = target.closest("[data-transport]");
  if (transportButton) {
    engine.dispatchAction(ActionTypes.SELECT_TRANSPORT, { transportId: transportButton.dataset.transport });
    navigateToRoute("/transports");
    return;
  }

  const actionButton = target.closest("[data-action]");
  if (actionButton) {
    if (actionButton.dataset.action === ActionTypes.RESET_DEMO && !confirmDemoReset()) return;
    const parsed = parsePayload(actionButton.dataset.payload);
    if (!parsed.ok) {
      engine.dispatchAction(actionButton.dataset.action, {}, { payloadError: parsed.error });
      return;
    }
    engine.dispatchAction(actionButton.dataset.action, parsed.payload);
  }
});

root.addEventListener("change", (event) => {
  const contextSelect = event.target.closest("[data-context-select]");
  if (contextSelect) {
    const [contextType, companyId, userCompanyRoleId] = contextSelect.value.split("|");
    engine.dispatchAction(ActionTypes.SELECT_CONTEXT, {
      contextType,
      companyId: companyId || null,
      userCompanyRoleId: userCompanyRoleId || null
    });
    navigateToRoute("/dashboard");
    return;
  }

  const roleSelect = event.target.closest("[data-role-select]");
  if (!roleSelect) return;
  const role = roleSelect.value;
  const selectedOption = roleSelect.selectedOptions?.[0];
  const result = engine.dispatchAction(ActionTypes.SELECT_ROLE, {
    role,
    contextType: selectedOption?.dataset.contextType || null,
    companyId: selectedOption?.dataset.companyId || null,
    userCompanyRoleId: selectedOption?.dataset.companyRoleId || null
  });
  if (result.ok) {
    const viewResult = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "dashboard", route: "/dashboard" });
    if (viewResult.ok) setRouteHash("/dashboard");
  }
});

root.addEventListener("input", (event) => {
  const search = event.target.closest("[data-language-search]");
  if (!search) return;
  filterLanguageTiles(search);
});

root.addEventListener("submit", (event) => {
  const target = eventTargetElement(event);
  const form = target?.closest("[data-form-action]");
  if (!form) return;
  event.preventDefault();
  submitDemoForm(form);
}, true);

window.addEventListener("hashchange", () => {
  if (internalRouteChange) return;
  syncRouteFromHash();
});

function submitDemoForm(form) {
  const parsed = payloadFromForm(form);
  if (!parsed.ok) {
    engine.dispatchAction(form.dataset.formAction, {}, { payloadError: parsed.error });
    return;
  }
  const result = engine.dispatchAction(parsed.action, parsed.payload, { source: "demo-form" });
  if (result.ok && parsed.action === ActionTypes.ONBOARDING_APPROVE) {
    setRouteHash("#/dashboard");
  }
}

function handleBrandMenuAction(button) {
  const action = button.dataset.brandMenuAction;
  const menu = button.closest("[data-brand-menu]");
  if (action === "reset") {
    const actions = menu?.querySelector("[data-brand-menu-actions]");
    const confirm = menu?.querySelector("[data-brand-reset-confirm]");
    if (actions) actions.hidden = true;
    if (confirm) confirm.hidden = false;
    return;
  }
  closeBrandMenu(menu);
  if (action === "language") {
    engine.dispatchAction(ActionTypes.OPEN_LANGUAGE_SELECTION, {});
    return;
  }
  if (action === "start") {
    engine.dispatchAction(ActionTypes.RETURN_TO_START, {});
    setRouteHash("/onboarding");
  }
}

function bindRenderedForms() {
  root.querySelectorAll("[data-form-action]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitDemoForm(form);
    });
    form.querySelectorAll('button[type="submit"]').forEach((button) => {
      button.setAttribute("onclick", "return window.__glSubmitForm(this)");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        submitDemoForm(form);
      });
    });
  });
}

function eventTargetElement(event) {
  const target = event.target;
  if (!target) return null;
  if (typeof target.closest === "function") return target;
  return target.parentElement || null;
}

function navigateToRoute(route, extraPayload = {}) {
  const module = moduleForRoute(route);
  const view = module?.view || normalizeRoute(route).slice(1);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route: normalizeRoute(route), ...extraPayload });
  if (result.ok) setRouteHash(module?.route || normalizeRoute(route));
}

function navigateToView(view) {
  const route = routeForRoleView(engine.getSnapshot().session.role, view);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route });
  if (result.ok) setRouteHash(route);
}

function navigateToProfile(profileTargetId, profileTargetType) {
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, {
    view: "profile",
    route: "/profile",
    profileTargetId,
    profileTargetType
  });
  if (result.ok) setRouteHash("/profile");
}

function activateProfileTab(button) {
  const shell = button.closest("[data-profile-view]");
  if (!shell) return;
  const tabId = button.dataset.profileTab;
  shell.querySelectorAll("[data-profile-tab]").forEach((item) => {
    item.setAttribute("aria-selected", item === button ? "true" : "false");
  });
  shell.querySelectorAll("[data-profile-panel]").forEach((panel) => {
    const active = panel.dataset.profilePanel === tabId;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
}

function toggleBrandMenu(button) {
  const control = button.closest(".brand-control");
  const menu = control?.querySelector("[data-brand-menu]");
  if (!menu) return;
  const nextOpen = menu.hidden;
  root.querySelectorAll("[data-brand-menu]").forEach((item) => {
    if (item !== menu) closeBrandMenu(item);
  });
  menu.hidden = !nextOpen;
  button.setAttribute("aria-expanded", String(nextOpen));
  resetBrandMenuConfirm(menu);
}

function closeBrandMenu(menu) {
  if (!menu) return;
  menu.hidden = true;
  resetBrandMenuConfirm(menu);
  const toggle = menu.closest(".brand-control")?.querySelector("[data-brand-menu-toggle]");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function resetBrandMenuConfirm(menu) {
  const actions = menu?.querySelector("[data-brand-menu-actions]");
  const confirm = menu?.querySelector("[data-brand-reset-confirm]");
  if (actions) actions.hidden = false;
  if (confirm) confirm.hidden = true;
}

function confirmDemoReset() {
  const language = engine.getSnapshot().session.language || "pl";
  return window.confirm(t("brand.confirm_reset", {}, language));
}

function filterLanguageTiles(search) {
  const shell = search.closest("[data-language-selection]");
  if (!shell) return;
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  shell.querySelectorAll("[data-language-option]").forEach((tile) => {
    const matches = !query || String(tile.dataset.search || "").includes(query);
    tile.hidden = !matches;
    if (matches) visible += 1;
  });
  const empty = shell.querySelector("[data-language-empty]");
  if (empty) empty.hidden = visible > 0;
}

function syncRouteFromHash() {
  if (onboardingIsActive()) return;
  const route = normalizeRoute(window.location.hash);
  const module = moduleForRoute(route);
  if (!module && !window.location.hash) {
    const firstRoute = firstRouteForRole(engine.getSnapshot().session.role);
    setRouteHash(firstRoute);
    return;
  }
  const view = module?.view || route.slice(1);
  engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route });
}

function onboardingIsActive() {
  const snapshot = engine.getSnapshot();
  return Boolean(snapshot.session.onboardingRequired || snapshot.session.onboardingUserId);
}

function setRouteHash(route) {
  const nextHash = `#${normalizeRoute(route)}`;
  if (window.location.hash === nextHash) return;
  internalRouteChange = true;
  window.location.hash = nextHash;
  setTimeout(() => {
    internalRouteChange = false;
  }, 0);
}
