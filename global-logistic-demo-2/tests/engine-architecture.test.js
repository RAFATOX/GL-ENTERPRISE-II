import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  WORKFLOW_ENGINE_ID,
  engineArchitecture,
  engineArchitectureById,
  engineArchitectureFlowLinks,
  engineArchitectureLinks,
  engineArchitectureRelationTypes,
  engineArchitectureRelations,
  validateEngineArchitecture
} from "../src/core/engine-architecture.js";

const requiredEngines = new Map([
  ["user", "Użytkownik"],
  ["identity", "Silnik Tożsamości"],
  ["registration-onboarding", "Rejestracja i Wdrożenie"],
  ["company", "Silnik Firm"],
  ["permission", "Silnik Uprawnień"],
  ["routing-access", "Routing i Dostęp"],
  ["ui", "Interfejs Użytkownika"],
  ["translation", "Silnik Tłumaczeń"],
  ["workflow", "Silnik Workflow"],
  ["transport-load", "Silnik Transportu i Ładunków"],
  ["driver", "Silnik Kierowcy"],
  ["vehicle", "Silnik Pojazdów"],
  ["document", "Silnik Dokumentów"],
  ["gps", "Silnik GPS"],
  ["wallet", "Silnik Portfeli"],
  ["financial-audit", "Finansowy Silnik Audytu"],
  ["escrow", "Silnik Escrow"],
  ["audit-log", "Silnik Audytu"],
  ["knowledge", "Silnik Wiedzy"],
  ["ai-control", "Agent AI"],
  ["notification", "Silnik Powiadomień"],
  ["reputation", "Silnik Reputacji"],
  ["profile", "Silnik Profilu"],
  ["dispute", "Silnik Sporów"],
  ["gl-academy", "Akademia GL"],
  ["gl-jobs", "Giełda Pracy GL"],
  ["gl-fleet-market", "Giełda Pojazdów GL"]
]);

test("źródło prawdy architektury ma wymagane silniki i Silnik Workflow w centrum", () => {
  const result = validateEngineArchitecture(engineArchitecture);
  const byId = engineArchitectureById(engineArchitecture);

  assert.equal(result.ok, true, result.errors.join("\n"));
  requiredEngines.forEach((name, id) => assert.equal(byId.get(id)?.name, name));
  assert.deepEqual(byId.get(WORKFLOW_ENGINE_ID).mapPosition, [0, 0, 0]);
});

test("mapa zachowuje polskie nazwy silników i nie wraca do widocznych angielskich etykiet", () => {
  const byId = engineArchitectureById(engineArchitecture);
  const forbiddenVisibleLabels = [
    "User",
    "Identity Engine",
    "Registration / Onboarding",
    "Company Engine",
    "Permission Engine",
    "Routing / Access",
    "Profile Engine",
    "Reputation Engine",
    "Wallet Engine",
    "Audit Log Engine",
    "Knowledge Engine",
    "Driver Engine",
    "Vehicle Engine",
    "Document Engine",
    "Translation Engine",
    "Notification Engine",
    "GL Academy",
    "GL Jobs",
    "GL Fleet Market"
  ];

  for (const engine of engineArchitecture) {
    forbiddenVisibleLabels.forEach((label) => {
      assert.equal(engine.name.includes(label), false, `${engine.id} ma angielską nazwę widoczną: ${label}`);
    });
    assert.ok(engine.status, `${engine.id} nie ma statusu`);
    assert.ok(Array.isArray(engine.files), `${engine.id} nie ma listy plików`);
    assert.ok(Array.isArray(engine.tests), `${engine.id} nie ma listy testów`);
  }

  requiredEngines.forEach((name, id) => assert.equal(byId.get(id)?.name, name));
});

test("warstwy są logicznie rozmieszczone i czytelnie rozdzielone", () => {
  const byId = engineArchitectureById(engineArchitecture);
  const identity = byId.get("identity");
  const onboarding = byId.get("registration-onboarding");
  const company = byId.get("company");
  const permission = byId.get("permission");
  const workflow = byId.get("workflow");
  const profile = byId.get("profile");
  const reputation = byId.get("reputation");
  const wallet = byId.get("wallet");
  const ui = byId.get("ui");
  const translation = byId.get("translation");

  assert.ok(identity.mapPosition[0] < onboarding.mapPosition[0], "Rejestracja musi być po Tożsamości");
  assert.ok(onboarding.mapPosition[0] < company.mapPosition[0], "Silnik Firm musi być po Rejestracji");
  assert.ok(company.mapPosition[0] < permission.mapPosition[0], "Silnik Uprawnień musi być po Silniku Firm");
  assert.ok(permission.mapPosition[0] < workflow.mapPosition[0], "Silnik Workflow musi być po Silniku Uprawnień");
  assert.equal(reputation.layer, "trust");
  assert.equal(profile.layer, "trust");
  assert.ok(distance(profile.mapPosition, wallet.mapPosition) > 6, "Silnik Profilu nie może nachodzić na Silnik Portfeli");
  assert.ok(distance(ui.mapPosition, translation.mapPosition) > 4, "Interfejs Użytkownika nie może nachodzić na Silnik Tłumaczeń");
});

test("relacje pokazują proces główny, dostęp, finanse, audyt i moduły przyszłe", () => {
  const links = engineArchitectureLinks(engineArchitecture);
  const flowLinks = engineArchitectureFlowLinks();

  ["required", "info", "audit", "future"].forEach((type) => {
    assert.ok(engineArchitectureRelationTypes[type], `Brakuje typu relacji: ${type}`);
  });

  [
    ["user", "identity"],
    ["identity", "registration-onboarding"],
    ["registration-onboarding", "company"],
    ["company", "permission"],
    ["permission", "workflow"],
    ["workflow", "driver"],
    ["workflow", "vehicle"],
    ["workflow", "document"],
    ["workflow", "gps"],
    ["workflow", "escrow"],
    ["workflow", "wallet"],
    ["escrow", "audit-log"],
    ["wallet", "audit-log"],
    ["audit-log", "reputation"],
    ["reputation", "profile"],
    ["profile", "notification"],
    ["notification", "ui"]
  ].forEach(([from, to]) => {
    assert.ok(hasDirectedLink(flowLinks, from, to), `Widok przepływu musi zawierać ${from} -> ${to}`);
  });

  ["driver", "vehicle", "wallet", "escrow", "document", "gps", "audit-log", "notification"].forEach((targetId) => {
    assert.ok(hasDirectedLink(links, WORKFLOW_ENGINE_ID, targetId), `Silnik Workflow musi być połączony z ${targetId}`);
  });

  assert.ok(hasDirectedLink(links, "permission", "routing-access"), "Silnik Uprawnień musi łączyć się z Routingiem i Dostępem");
  assert.ok(hasDirectedLink(links, "translation", "ui"), "Silnik Tłumaczeń musi zasilać Interfejs Użytkownika");
  assert.ok(hasDirectedLink(links, "wallet", "escrow"), "Silnik Portfeli musi łączyć się z Escrow");
  assert.ok(hasDirectedLink(links, "knowledge", "workflow"), "Silnik Wiedzy musi zasilać Workflow");
  assert.ok(hasDirectedLink(links, "knowledge", "ai-control"), "Silnik Wiedzy musi zasilać Agenta AI");
  assert.ok(isConnected(links, "profile", "reputation"), "Silnik Profilu i Silnik Reputacji muszą być połączone, ale osobne");
});

test("Silnik Audytu jest centralnym rejestrem dowodowym dla głównych silników", () => {
  const auditWriters = [
    "identity",
    "registration-onboarding",
    "company",
    "permission",
    "workflow",
    "wallet",
    "escrow",
    "document",
    "gps",
    "reputation",
    "dispute",
    "ai-control",
    "knowledge",
    "financial-audit"
  ];

  auditWriters.forEach((from) => {
    assert.ok(
      engineArchitectureRelations.some((link) => link.from === from && link.to === "audit-log" && link.type === "audit"),
      `${from} musi zapisywać do Silnika Audytu linią audytową`
    );
  });
});

test("mapa HTML pokazuje szczegóły techniczne po kliknięciu i polską legendę połączeń", () => {
  const html = readFileSync(new URL("../docs/gl-engine-map-3d.html", import.meta.url), "utf8");

  [
    "Odpowiedzialność",
    "Wejścia",
    "Wyjścia",
    "Moduły korzystające z silnika",
    "Status",
    "Pliki powiązane",
    "Testy powiązane",
    "proces główny",
    "dostęp i uprawnienia",
    "finanse",
    "audyt",
    "wiedza i AI",
    "moduły przyszłe",
    "Widok architektury",
    "Widok przepływu"
  ].forEach((text) => assert.ok(html.includes(text), `mapa powinna pokazywać: ${text}`));

  [
    "Identity Engine",
    "Registration / Onboarding",
    "Company Engine",
    "Permission Engine",
    "Routing / Access",
    "Profile Engine",
    "Reputation Engine",
    "Wallet Engine",
    "Audit Log Engine",
    "Knowledge Engine",
    "Driver Engine",
    "Vehicle Engine",
    "Document Engine",
    "Translation Engine",
    "Notification Engine",
    "Architecture View",
    "Flow View"
  ].forEach((text) => assert.equal(html.includes(text), false, `mapa nadal zawiera angielską etykietę: ${text}`));
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

function distance(left, right) {
  return Math.hypot(
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2]
  );
}
