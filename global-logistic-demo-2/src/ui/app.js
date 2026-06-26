import { ActionTypes } from "../core/constants.js";
import { GLCoreEngine } from "../core/gl-core-engine.js";
import { moduleForRoute, normalizeRoute } from "../core/modules-config.js";
import { renderApp } from "./renderers.js";
import { parsePayload, payloadFromForm } from "./action-handler.js";
import { firstRouteForRole, firstViewForRole, routeForRoleView } from "./role-config.js";

const engine = new GLCoreEngine();
const root = document.querySelector("#app");
let internalRouteChange = false;

function render(snapshot = engine.getSnapshot()) {
  root.innerHTML = renderApp(snapshot, engine);
}

engine.subscribe(render);
render();
syncRouteFromHash();

root.addEventListener("click", (event) => {
  const resetButton = event.target.closest("[data-reset-demo]");
  if (resetButton) {
    engine.dispatchAction(ActionTypes.RESET_DEMO, {}, { demoOnly: true });
    return;
  }

  const roleButton = event.target.closest("[data-role]");
  if (roleButton) {
    engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: roleButton.dataset.role }, { demoOnly: true });
    return;
  }

  const moduleButton = event.target.closest("[data-module-route]");
  if (moduleButton) {
    navigateToRoute(moduleButton.dataset.moduleRoute);
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    navigateToView(viewButton.dataset.view);
    return;
  }

  const transportButton = event.target.closest("[data-transport]");
  if (transportButton) {
    engine.dispatchAction(ActionTypes.SELECT_TRANSPORT, { transportId: transportButton.dataset.transport });
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const parsed = parsePayload(actionButton.dataset.payload);
    if (!parsed.ok) {
      engine.dispatchAction(actionButton.dataset.action, {}, { payloadError: parsed.error });
      return;
    }
    engine.dispatchAction(actionButton.dataset.action, parsed.payload);
  }
});

root.addEventListener("change", (event) => {
  const roleSelect = event.target.closest("[data-role-select]");
  if (!roleSelect) return;
  const role = roleSelect.value;
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role }, { demoOnly: true });
  const route = firstRouteForRole(role);
  const view = firstViewForRole(role);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route });
  if (result.ok) setRouteHash(route);
});

root.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form-action]");
  if (!form) return;
  event.preventDefault();
  const parsed = payloadFromForm(form);
  if (!parsed.ok) {
    engine.dispatchAction(form.dataset.formAction, {}, { payloadError: parsed.error });
    return;
  }
  engine.dispatchAction(parsed.action, parsed.payload, { source: "demo-form" });
});

window.addEventListener("hashchange", () => {
  if (internalRouteChange) return;
  syncRouteFromHash();
});

function navigateToRoute(route) {
  const module = moduleForRoute(route);
  const view = module?.view || normalizeRoute(route).slice(1);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route: normalizeRoute(route) });
  if (result.ok) setRouteHash(module.route);
}

function navigateToView(view) {
  const route = routeForRoleView(engine.getSnapshot().session.role, view);
  const result = engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route });
  if (result.ok) setRouteHash(route);
}

function syncRouteFromHash() {
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

function setRouteHash(route) {
  const nextHash = `#${normalizeRoute(route)}`;
  if (window.location.hash === nextHash) return;
  internalRouteChange = true;
  window.location.hash = nextHash;
  setTimeout(() => {
    internalRouteChange = false;
  }, 0);
}
