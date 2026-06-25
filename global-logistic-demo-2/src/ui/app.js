import { ActionTypes } from "../core/constants.js";
import { GLCoreEngine } from "../core/gl-core-engine.js";
import { renderApp } from "./renderers.js";

const engine = new GLCoreEngine();
const root = document.querySelector("#app");

function render(snapshot = engine.getSnapshot()) {
  root.innerHTML = renderApp(snapshot, engine);
}

engine.subscribe(render);
render();

root.addEventListener("click", (event) => {
  const roleButton = event.target.closest("[data-role]");
  if (roleButton) {
    engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: roleButton.dataset.role });
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
    engine.dispatchAction(actionButton.dataset.action, parsePayload(actionButton.dataset.payload));
  }
});

function parsePayload(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch (error) {
    return {};
  }
}
