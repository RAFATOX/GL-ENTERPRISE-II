import test from "node:test";
import assert from "node:assert/strict";

import { ActionTypes, DEMO_DATA_VERSION, Roles } from "../src/core/constants.js";
import { GLCoreEngine } from "../src/core/gl-core-engine.js";
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

test("roleConfig drives role menus and hides unrelated modules", () => {
  const driverMenu = menuForRole(Roles.DRIVER).map((item) => item.id);
  const adminMenu = menuForRole(Roles.ADMIN).map((item) => item.id);

  assert.ok(driverMenu.includes("gps"));
  assert.ok(driverMenu.includes("documents"));
  assert.equal(driverMenu.includes("payments"), false);
  assert.equal(driverMenu.includes("audit"), false);
  assert.ok(adminMenu.includes("payments"));
  assert.ok(adminMenu.includes("audit"));
  assert.equal(viewAllowedForRole(Roles.DRIVER, "payments"), false);
});

test("driver workspace renders as ERP panel without phone mockup", () => {
  const engine = new GLCoreEngine({ store: memoryStore() });
  engine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.DRIVER }, { demoOnly: true });
  engine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "driver_mobile" });

  const html = renderApp(engine.state, engine);
  assert.ok(html.includes("data-role-select"));
  assert.ok(html.includes("driver-workspace"));
  assert.equal(html.includes('class="phone"'), false);
  assert.equal(html.includes('data-view="payments"'), false);
});

test("wallet demo renders fintech shell only for finance roles", () => {
  const financeEngine = new GLCoreEngine({ store: memoryStore() });
  financeEngine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.PAYMENT_OPERATOR }, { demoOnly: true });
  financeEngine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "payments" });
  const financeHtml = renderApp(financeEngine.getSnapshot(), financeEngine);

  assert.ok(financeHtml.includes("finance-shell"));
  assert.ok(financeHtml.includes("DEMO MODE"));
  assert.ok(financeHtml.includes("GLW-"));

  const authorityEngine = new GLCoreEngine({ store: memoryStore() });
  authorityEngine.dispatchAction(ActionTypes.SELECT_ROLE, { role: Roles.AUTHORITY_USER }, { demoOnly: true });
  authorityEngine.dispatchAction(ActionTypes.SELECT_VIEW, { view: "payments" });
  const authorityHtml = renderApp(authorityEngine.getSnapshot(), authorityEngine);

  assert.equal(authorityHtml.includes("finance-shell"), false);
});
