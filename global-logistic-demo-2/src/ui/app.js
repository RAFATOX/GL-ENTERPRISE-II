import { ActionTypes } from "../core/constants.js";
import { GLCoreEngine } from "../core/gl-core-engine.js";
import { renderApp } from "./renderers.js";
import { parsePayload, payloadFromForm } from "./action-handler.js";
import { firstViewForRole } from "./role-config.js";

const engine = new GLCoreEngine();
const root = document.querySelector("#app");

function render(snapshot = engine.getSnapshot()) {
  root.innerHTML = renderApp(snapshot, engine);
}

engine.subscribe(render);
render();

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

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: viewButton.dataset.view });
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
  engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: firstViewForRole(role) });
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
