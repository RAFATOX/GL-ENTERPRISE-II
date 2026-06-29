import test from "node:test";
import assert from "node:assert/strict";

import {
  WORKFLOW_ENGINE_ID,
  engineArchitecture,
  engineArchitectureById,
  engineArchitectureLinks,
  validateEngineArchitecture
} from "../src/core/engine-architecture.js";

test("engine architecture has no isolated engines and keeps Workflow Engine central", () => {
  const result = validateEngineArchitecture(engineArchitecture);
  const byId = engineArchitectureById(engineArchitecture);

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(byId.has(WORKFLOW_ENGINE_ID));
  assert.equal(byId.get(WORKFLOW_ENGINE_ID).name, "Workflow Engine");
});

test("engine architecture keeps required access, UI, finance, knowledge and transport links", () => {
  const links = engineArchitectureLinks(engineArchitecture);
  const byId = engineArchitectureById(engineArchitecture);

  assert.ok(isConnected(links, "permission", "routing-access"), "Permission Engine must connect to Routing / Access");
  assert.ok(isConnected(links, "translation", "ui"), "Translation Engine must connect to UI");
  assert.ok(isConnected(links, "wallet", "escrow"), "Wallet Engine must connect to Escrow Engine");
  assert.ok(isConnected(links, "wallet", "audit-log"), "Wallet Engine must connect to Audit Log Engine");
  assert.ok(isConnected(links, "knowledge", "workflow"), "Knowledge Engine must connect to Workflow Engine");
  assert.ok(isConnected(links, "knowledge", "ai-control"), "Knowledge Engine must connect to AI Control Agent");
  assert.ok(isConnected(links, "driver", "workflow"), "Driver Engine must connect to Workflow Engine");
  assert.ok(isConnected(links, "vehicle", "workflow"), "Vehicle Engine must connect to Workflow Engine");

  assert.equal(byId.get("gl-academy").layer, "future");
  assert.equal(byId.get("gl-jobs").layer, "future");
  assert.equal(byId.get("gl-fleet-market").layer, "future");
});

function isConnected(links, left, right) {
  return links.some((link) => (
    (link.from === left && link.to === right)
    || (link.from === right && link.to === left)
  ));
}
