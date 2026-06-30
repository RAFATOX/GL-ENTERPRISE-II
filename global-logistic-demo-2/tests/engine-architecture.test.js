import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  WORKFLOW_ENGINE_ID,
  engineArchitecture,
  engineArchitectureById,
  engineArchitectureFlowLinks,
  engineArchitectureLinks,
  validateEngineArchitecture
} from "../src/core/engine-architecture.js";

test("engine architecture has no isolated engines and keeps Silnik Workflow central", () => {
  const result = validateEngineArchitecture(engineArchitecture);
  const byId = engineArchitectureById(engineArchitecture);

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(byId.has(WORKFLOW_ENGINE_ID));
  assert.equal(byId.get(WORKFLOW_ENGINE_ID).name, "Silnik Workflow");
});

test("engine architecture keeps required access, UI, finance, knowledge and transport links", () => {
  const links = engineArchitectureLinks(engineArchitecture);
  const flowLinks = engineArchitectureFlowLinks();
  const byId = engineArchitectureById(engineArchitecture);

  [
    ["company", "Silnik Firm"],
    ["registration-onboarding", "Rejestracja i Wdrożenie"],
    ["document", "Silnik Dokumentów"],
    ["gps", "Silnik GPS"],
    ["notification", "Silnik Powiadomień"],
    ["reputation", "Silnik Reputacji"],
    ["transport-load", "Silnik Transportów i Ładunków"]
  ].forEach(([id, name]) => assert.equal(byId.get(id)?.name, name));

  assert.ok(isConnected(links, "permission", "routing-access"), "Permission Engine must connect to Routing / Access");
  assert.ok(isConnected(links, "translation", "ui"), "Translation Engine must connect to UI");
  assert.ok(isConnected(links, "wallet", "escrow"), "Wallet Engine must connect to Escrow Engine");
  assert.ok(isConnected(links, "wallet", "audit-log"), "Wallet Engine must connect to Audit Log Engine");
  assert.ok(isConnected(links, "knowledge", "workflow"), "Knowledge Engine must connect to Workflow Engine");
  assert.ok(isConnected(links, "knowledge", "ai-control"), "Knowledge Engine must connect to AI Control Agent");
  assert.ok(isConnected(links, "driver", "workflow"), "Driver Engine must connect to Workflow Engine");
  assert.ok(isConnected(links, "vehicle", "workflow"), "Vehicle Engine must connect to Workflow Engine");
  assert.ok(isConnected(links, "profile", "reputation"), "Profile Engine must connect to Reputation Engine");

  ["driver", "vehicle", "wallet", "escrow", "document", "gps", "audit-log", "notification"].forEach((targetId) => {
    assert.ok(hasDirectedLink(links, WORKFLOW_ENGINE_ID, targetId), `Workflow Engine must provide to ${targetId}`);
  });

  [
    ["user", "identity"],
    ["identity", "registration-onboarding"],
    ["registration-onboarding", "company"],
    ["company", "permission"],
    ["permission", "workflow"],
    ["workflow", "transport-load"],
    ["workflow", "driver"],
    ["driver", "vehicle"],
    ["wallet", "escrow"],
    ["escrow", "audit-log"],
    ["reputation", "profile"],
    ["profile", "ui"],
    ["knowledge", "ai-control"],
    ["ai-control", "notification"]
  ].forEach(([from, to]) => {
    assert.ok(hasDirectedLink(flowLinks, from, to), `Flow View must include ${from} -> ${to}`);
  });

  assert.equal(byId.get("gl-academy").layer, "future");
  assert.equal(byId.get("gl-jobs").layer, "future");
  assert.equal(byId.get("gl-fleet-market").layer, "future");
});

test("3D engine map exposes Polish engine names and details, without English visible engine labels", () => {
  const html = readFileSync(new URL("../docs/gl-engine-map-3d.html", import.meta.url), "utf8");
  const byId = engineArchitectureById(engineArchitecture);

  [
    ["user", "Użytkownik"],
    ["identity", "Silnik Tożsamości"],
    ["registration-onboarding", "Rejestracja i Wdrożenie"],
    ["company", "Silnik Firm"],
    ["permission", "Silnik Uprawnień"],
    ["routing-access", "Routing i Dostęp"],
    ["workflow", "Silnik Workflow"],
    ["profile", "Silnik Profilu"],
    ["reputation", "Silnik Reputacji"],
    ["wallet", "Silnik Portfeli"],
    ["escrow", "Silnik Escrow"],
    ["audit-log", "Silnik Audytu"],
    ["knowledge", "Silnik Wiedzy"],
    ["ai-control", "Agent AI"],
    ["driver", "Silnik Kierowcy"],
    ["vehicle", "Silnik Pojazdów"],
    ["gps", "Silnik GPS"],
    ["document", "Silnik Dokumentów"],
    ["translation", "Silnik Tłumaczeń"],
    ["notification", "Silnik Powiadomień"],
    ["gl-academy", "Akademia GL"],
    ["gl-jobs", "Giełda Pracy GL"],
    ["gl-fleet-market", "Giełda Pojazdów GL"]
  ].forEach(([id, name]) => assert.equal(byId.get(id)?.name, name));

  [
    "Odpowiedzialność",
    "Wejścia",
    "Wyjścia",
    "Moduły korzystające z silnika",
    "Widok architektury",
    "Widok przepływu"
  ].forEach((text) => assert.ok(html.includes(text), `map should show ${text}`));

  [
    "User",
    "Identity Engine",
    "Registration / Onboarding",
    "Company Engine",
    "Permission Engine",
    "Routing / Access",
    "Workflow Engine",
    "Profile Engine",
    "Reputation Engine",
    "Wallet Engine",
    "Escrow Engine",
    "Audit Log Engine",
    "Knowledge Engine",
    "AI Control Agent",
    "Driver Engine",
    "Vehicle Engine",
    "GPS Engine",
    "Document Engine",
    "Translation Engine",
    "Notification Engine",
    "GL Academy",
    "GL Jobs",
    "GL Fleet Market",
    "Architecture View",
    "Flow View"
  ].forEach((text) => assert.equal(html.includes(text), false, `map still contains English label: ${text}`));
});

function isConnected(links, left, right) {
  return links.some((link) => (
    (link.from === left && link.to === right)
    || (link.from === right && link.to === left)
  ));
}

function hasDirectedLink(links, from, to) {
  return links.some((link) => link.from === from && link.to === to);
}
