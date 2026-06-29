export const WORKFLOW_ENGINE_ID = "workflow";

export const engineArchitectureLayers = Object.freeze({
  identity: { label: "Tozsamosc", color: "#4dd4ff" },
  company: { label: "Firma i role", color: "#8fd36b" },
  access: { label: "Dostep", color: "#79a7ff" },
  workflow: { label: "Workflow", color: "#f6c44d" },
  transport: { label: "Transport", color: "#58c7ff" },
  finance: { label: "Finanse", color: "#41d28a" },
  trust: { label: "Zaufanie", color: "#f59bd8" },
  knowledge: { label: "Wiedza i AI", color: "#b794ff" },
  communication: { label: "Komunikacja", color: "#66d9c7" },
  ui: { label: "UI", color: "#ff8f70" },
  admin: { label: "Admin", color: "#d8dde4" },
  future: { label: "Moduly przyszle", color: "#b7e36b" }
});

export const engineArchitecture = Object.freeze([
  engine({
    id: "user",
    name: "User",
    layer: "identity",
    type: "actor",
    description: "Czlowiek wchodzacy do GL jako jedno user_id, niezaleznie od liczby rol i firm.",
    dependsOn: [],
    providesTo: ["identity"],
    workflowRole: "input identity",
    mapPosition: [-14, 1.6, -0.8]
  }),
  engine({
    id: "identity",
    name: "Identity Engine",
    layer: "identity",
    type: "engine",
    description: "Logowanie, sesje, OTP, reset hasla i glowna tozsamosc user_id.",
    dependsOn: ["user", "audit-log"],
    providesTo: ["registration-onboarding", "company", "permission", "translation", "profile", "workflow"],
    workflowRole: "input identity engine",
    mapPosition: [-11.2, 1.6, -0.4]
  }),
  engine({
    id: "registration-onboarding",
    name: "Registration / Onboarding Engine",
    layer: "identity",
    type: "engine",
    description: "Jezyk, kraj, telefon, OTP, konto, role, dokumenty i status weryfikacji.",
    dependsOn: ["identity", "translation", "audit-log"],
    providesTo: ["company", "permission", "workflow", "ui"],
    workflowRole: "entry verification engine",
    mapPosition: [-8.4, 1.5, 0]
  }),
  engine({
    id: "company",
    name: "Company Engine",
    layer: "company",
    type: "engine",
    description: "Company_id, dane firmy, dokumenty, status weryfikacji, osoby zaproszone i role firmowe.",
    dependsOn: ["identity", "audit-log"],
    providesTo: ["user-company-role", "permission", "workflow", "wallet", "driver", "vehicle", "profile", "gl-jobs", "gl-fleet-market"],
    workflowRole: "company context engine",
    mapPosition: [-5.4, 0.9, 0.2]
  }),
  engine({
    id: "user-company-role",
    name: "UserCompanyRole",
    layer: "company",
    type: "model",
    description: "Powiazanie czlowieka z firma, rola firmowa i zakresem uprawnien.",
    dependsOn: ["identity", "company", "audit-log"],
    providesTo: ["permission", "routing-access", "workflow"],
    workflowRole: "membership context model",
    mapPosition: [-5.4, -0.8, 1.2]
  }),
  engine({
    id: "permission",
    name: "Permission Engine",
    layer: "access",
    type: "engine",
    description: "Centralny silnik permissions dla akcji, tras, widocznosci modulow i zakresow finansowych.",
    dependsOn: ["identity", "company", "user-company-role", "audit-log"],
    providesTo: ["routing-access", "ui", "workflow", "wallet", "escrow", "knowledge", "admin-views", "driver", "vehicle", "profile", "notification", "gl-jobs", "gl-fleet-market"],
    workflowRole: "access control engine",
    mapPosition: [-2.8, 0.9, 0]
  }),
  engine({
    id: "routing-access",
    name: "Routing / Access",
    layer: "access",
    type: "gateway",
    description: "Trasy, AccessDenied, activeRole, activeCompanyId, activeContext i przebudowa dashboardu.",
    dependsOn: ["permission", "identity", "company", "workflow"],
    providesTo: ["ui", "audit-log"],
    workflowRole: "route guard",
    mapPosition: [-2.3, 5, -0.5]
  }),
  engine({
    id: "ui",
    name: "UI",
    layer: "ui",
    type: "presentation",
    description: "Warstwa prezentacji renderowana z aktywnego kontekstu, permissions i kluczy tlumaczen.",
    dependsOn: ["routing-access", "translation", "permission", "workflow"],
    providesTo: ["workflow", "audit-log"],
    workflowRole: "user interaction layer",
    mapPosition: [4.8, 5.2, -0.8]
  }),
  engine({
    id: "translation",
    name: "Translation Engine",
    layer: "ui",
    type: "engine",
    description: "Translation_key dla UI, walidacji, bledow, onboardingu, profili i workflow.",
    dependsOn: ["identity", "registration-onboarding"],
    providesTo: ["ui", "registration-onboarding", "profile", "workflow"],
    workflowRole: "language information engine",
    mapPosition: [1.2, 6.4, -1.1]
  }),
  engine({
    id: "workflow",
    name: "Workflow Engine",
    layer: "workflow",
    type: "engine",
    description: "Centralny koordynator procesu transportowego od ladunku po rozliczenie, escrow, reputacje i audit log.",
    dependsOn: ["identity", "company", "permission", "driver", "vehicle", "wallet", "escrow", "document", "gps", "knowledge", "audit-log", "notification", "transport-load"],
    providesTo: ["transport-load", "driver", "vehicle", "document", "wallet", "escrow", "gps", "audit-log", "reputation", "notification", "ai-control", "knowledge", "profile", "admin-views", "gl-jobs", "ui"],
    workflowRole: "central process coordinator",
    mapPosition: [0, 0, 0]
  }),
  engine({
    id: "transport-load",
    name: "Transport Workflow / Load Engine",
    layer: "workflow",
    type: "engine",
    description: "Model ladunku i transportu, publikacja, przyjecie, status transportu oraz etapowe przejscia workflow.",
    dependsOn: ["workflow", "company", "permission", "driver", "vehicle", "document", "gps", "audit-log"],
    providesTo: ["workflow", "wallet", "escrow", "notification", "reputation"],
    workflowRole: "load and transport state engine",
    mapPosition: [0.8, -2, 0.6]
  }),
  engine({
    id: "driver",
    name: "Driver Engine",
    layer: "transport",
    type: "engine",
    description: "Dane kierowcy, status weryfikacji, dokumenty, active_vehicle_id, dostepnosc i gotowosc do transportu.",
    dependsOn: ["identity", "company", "permission", "document", "audit-log"],
    providesTo: ["workflow", "gps", "vehicle", "gl-jobs"],
    workflowRole: "transport execution engine",
    mapPosition: [-3.3, -3.1, 1.5]
  }),
  engine({
    id: "vehicle",
    name: "Vehicle Engine",
    layer: "transport",
    type: "engine",
    description: "Pojazdy firmy, dane techniczne, status, dokumenty, zgodnosc z ladunkiem i przypisanie do kierowcy.",
    dependsOn: ["company", "permission", "audit-log"],
    providesTo: ["workflow", "driver", "gps", "gl-fleet-market"],
    workflowRole: "fleet execution engine",
    mapPosition: [-1, -4.4, 1.8]
  }),
  engine({
    id: "document",
    name: "Document Engine",
    layer: "transport",
    type: "engine",
    description: "CMR, dokumenty transportowe, dokumenty firmy, dowody zdjeciowe i weryfikacja wymagan workflow.",
    dependsOn: ["identity", "company", "permission", "audit-log"],
    providesTo: ["workflow", "driver", "vehicle", "profile", "admin-views"],
    workflowRole: "proof and verification engine",
    mapPosition: [3.6, -2.4, 1.4]
  }),
  engine({
    id: "gps",
    name: "GPS Engine",
    layer: "transport",
    type: "engine",
    description: "Pozycja kierowcy, ETA, dojazd na zaladunek i rozladunek, potwierdzenie lokalizacji i historia trasy.",
    dependsOn: ["workflow", "driver", "vehicle", "audit-log"],
    providesTo: ["workflow", "notification", "ai-control"],
    workflowRole: "location proof engine",
    mapPosition: [2.1, -3.8, 1.4]
  }),
  engine({
    id: "wallet",
    name: "Wallet Engine",
    layer: "finance",
    type: "engine",
    description: "UserWallet, CompanyWallet, PlatformWallet, salda, transakcje, wyplaty i rozliczenia.",
    dependsOn: ["identity", "company", "permission", "financial-audit", "audit-log"],
    providesTo: ["workflow", "escrow", "audit-log", "admin-views", "notification"],
    workflowRole: "financial execution engine",
    mapPosition: [6.2, -1.2, 1.3]
  }),
  engine({
    id: "financial-audit",
    name: "Financial Audit Service",
    layer: "finance",
    type: "service",
    description: "Obowiazkowy audit_log_id dla operacji wallet, escrow, payments, settlements i dispute decisions.",
    dependsOn: ["audit-log"],
    providesTo: ["wallet", "escrow", "admin-views"],
    workflowRole: "financial audit service",
    mapPosition: [7.8, 0.8, 1.4]
  }),
  engine({
    id: "escrow",
    name: "Escrow Engine",
    layer: "finance",
    type: "engine",
    description: "Blokada srodkow, status zabezpieczenia platnosci, zwolnienie po odbiorze i zamrozenie przy sporze.",
    dependsOn: ["wallet", "workflow", "financial-audit", "audit-log", "permission"],
    providesTo: ["workflow", "audit-log", "notification", "dispute", "admin-views"],
    workflowRole: "payment security engine",
    mapPosition: [8.8, -1.8, 0.2]
  }),
  engine({
    id: "audit-log",
    name: "Audit Log Engine",
    layer: "finance",
    type: "engine",
    description: "Niezmienny dziennik rejestracji, zmian roli, kontekstu, transportu, finansow, escrow i decyzji admin.",
    dependsOn: ["identity"],
    providesTo: ["registration-onboarding", "company", "permission", "workflow", "wallet", "escrow", "knowledge", "dispute", "admin-views", "ai-control", "notification", "reputation", "gps"],
    workflowRole: "audit engine",
    mapPosition: [10.8, 0.6, 0]
  }),
  engine({
    id: "knowledge",
    name: "Knowledge Engine",
    layer: "knowledge",
    type: "engine",
    description: "Zrodla wiedzy dla workflow, AI, Akademii GL, compliance i komunikatow informacyjnych.",
    dependsOn: ["audit-log", "permission"],
    providesTo: ["workflow", "ai-control", "gl-academy", "admin-views", "notification"],
    workflowRole: "knowledge information engine",
    mapPosition: [-5.2, -2.2, -3.6]
  }),
  engine({
    id: "ai-control",
    name: "AI Control Agent",
    layer: "knowledge",
    type: "agent",
    description: "Analizuje ryzyka transportu, nietypowe zdarzenia, potencjalne oszustwa, spory i niezgodnosci workflow.",
    dependsOn: ["workflow", "knowledge", "audit-log", "notification"],
    providesTo: ["workflow", "admin-views", "notification"],
    workflowRole: "control and risk agent",
    mapPosition: [-8.1, -1.6, -4.2]
  }),
  engine({
    id: "notification",
    name: "Notification Engine",
    layer: "communication",
    type: "engine",
    description: "Powiadomienia dla kierowcy, przewoznika, klienta, magazynu, compliance i statusow platnosci.",
    dependsOn: ["workflow", "audit-log", "permission"],
    providesTo: ["ui", "driver", "company", "ai-control", "workflow"],
    workflowRole: "notification engine",
    mapPosition: [4.8, 1.5, 4.2]
  }),
  engine({
    id: "reputation",
    name: "Reputation Engine",
    layer: "trust",
    type: "engine",
    description: "Aktualizuje reputacje po transporcie, odbiorze, ocenie, sporze, anulowaniu, opoznieniu i naruszeniu.",
    dependsOn: ["workflow", "audit-log"],
    providesTo: ["profile", "workflow", "gl-academy"],
    workflowRole: "trust score engine",
    mapPosition: [4.7, -4.4, -2.6]
  }),
  engine({
    id: "profile",
    name: "Profile Engine",
    layer: "trust",
    type: "engine",
    description: "Profil uzytkownika i firmy, reputacja, opinie, widok publiczny i prywatny zgodnie z permissions.",
    dependsOn: ["identity", "company", "reputation", "permission", "translation"],
    providesTo: ["ui", "reputation", "gl-academy", "gl-jobs"],
    workflowRole: "trust presentation engine",
    mapPosition: [7.1, -4.1, -2.4]
  }),
  engine({
    id: "dispute",
    name: "Dispute Engine",
    layer: "admin",
    type: "engine",
    description: "Spory, evidence pack, decyzje administracyjne i zamrozenie albo rozdzielenie platnosci.",
    dependsOn: ["workflow", "escrow", "audit-log", "permission"],
    providesTo: ["admin-views", "reputation", "workflow"],
    workflowRole: "exception handling engine",
    mapPosition: [10.2, -3.3, -1.2]
  }),
  engine({
    id: "admin-views",
    name: "Admin Views",
    layer: "admin",
    type: "view",
    description: "Widoki administracyjne i developerskie dostepne tylko dla operatorow GL i uprawnionych adminow.",
    dependsOn: ["permission", "audit-log", "workflow", "wallet", "escrow", "knowledge", "dispute"],
    providesTo: ["ui", "audit-log"],
    workflowRole: "administration and observability view",
    mapPosition: [9.5, 3.8, -2.5]
  }),
  engine({
    id: "gl-academy",
    name: "GL Academy",
    layer: "future",
    type: "future_module",
    description: "Szkolenia, materialy, testy i certyfikacje powiazane z wiedza, profilami i reputacja.",
    dependsOn: ["knowledge", "profile", "reputation", "permission"],
    providesTo: ["profile", "knowledge"],
    workflowRole: "future knowledge module",
    mapPosition: [-8, -4.9, -3.5]
  }),
  engine({
    id: "gl-jobs",
    name: "GL Jobs",
    layer: "future",
    type: "future_module",
    description: "Przyszly rynek i zadania pracy powiazane z profilem, firma i permissions.",
    dependsOn: ["profile", "company", "permission", "workflow"],
    providesTo: ["workflow", "profile"],
    workflowRole: "future work module",
    mapPosition: [-2.5, -6.2, -2.1]
  }),
  engine({
    id: "gl-fleet-market",
    name: "GL Fleet Market",
    layer: "future",
    type: "future_module",
    description: "Przyszly rynek floty powiazany z Vehicle Engine, Company Engine i Permission Engine.",
    dependsOn: ["vehicle", "company", "permission"],
    providesTo: ["vehicle", "company"],
    workflowRole: "future fleet market module",
    mapPosition: [2.2, -6.1, -2.3]
  })
]);

export const engineArchitectureFlow = Object.freeze([
  ["user", "identity", "user_id"],
  ["identity", "registration-onboarding", "identity verification"],
  ["registration-onboarding", "company", "company context"],
  ["company", "permission", "permissions"],
  ["permission", "routing-access", "route guard"],
  ["routing-access", "ui", "visible UI"],
  ["translation", "ui", "translation_key"],
  ["permission", "workflow", "authorized action"],
  ["knowledge", "workflow", "knowledge context"],
  ["workflow", "driver", "driver assignment"],
  ["driver", "vehicle", "active_vehicle_id"],
  ["workflow", "vehicle", "vehicle readiness"],
  ["workflow", "document", "CMR and proofs"],
  ["workflow", "gps", "location and ETA"],
  ["workflow", "transport-load", "load lifecycle"],
  ["transport-load", "wallet", "secured payment"],
  ["workflow", "wallet", "payment status"],
  ["wallet", "escrow", "reserve funds"],
  ["escrow", "audit-log", "financial proof"],
  ["workflow", "audit-log", "process audit"],
  ["workflow", "notification", "status updates"],
  ["workflow", "reputation", "trust event"],
  ["reputation", "profile", "trust profile"],
  ["profile", "ui", "profile view"],
  ["knowledge", "ai-control", "risk context"],
  ["ai-control", "notification", "risk alert"],
  ["knowledge", "gl-academy", "learning content"],
  ["profile", "gl-jobs", "work identity"],
  ["company", "gl-jobs", "company context"],
  ["vehicle", "gl-fleet-market", "fleet asset"],
  ["company", "gl-fleet-market", "company owner"]
]);

export function validateEngineArchitecture(engines = engineArchitecture) {
  const errors = [];
  const ids = new Set(engines.map((item) => item.id));
  const workflow = engines.find((item) => item.id === WORKFLOW_ENGINE_ID);

  if (!workflow) errors.push("Workflow Engine is missing");

  engines.forEach((item) => {
    ["id", "name", "layer", "type", "description", "dependsOn", "providesTo", "workflowRole"].forEach((field) => {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        errors.push(`${item.id || "unknown"} missing ${field}`);
      }
    });

    [...item.dependsOn, ...item.providesTo].forEach((targetId) => {
      if (!ids.has(targetId)) errors.push(`${item.id} references missing engine ${targetId}`);
    });

    const canBeDetachedByType = item.id === "user" || item.layer === "future";
    if (!canBeDetachedByType && !item.dependsOn.length && !item.providesTo.length) {
      errors.push(`${item.id} is isolated`);
    }
  });

  if (workflow) {
    engines
      .filter((item) => item.id !== "user")
      .forEach((item) => {
        const fromWorkflow = hasPath(engines, WORKFLOW_ENGINE_ID, item.id);
        const toWorkflow = hasPath(engines, item.id, WORKFLOW_ENGINE_ID);
        if (!fromWorkflow && !toWorkflow) {
          errors.push(`${item.id} is not connected to Workflow Engine`);
        }
      });
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function engineArchitectureById(engines = engineArchitecture) {
  return new Map(engines.map((item) => [item.id, item]));
}

export function engineArchitectureLinks(engines = engineArchitecture) {
  const names = engineArchitectureById(engines);
  const seen = new Set();
  const links = [];
  engines.forEach((item) => {
    item.dependsOn.forEach((targetId) => addLink(targetId, item.id, "dependsOn"));
    item.providesTo.forEach((targetId) => addLink(item.id, targetId, "providesTo"));
  });
  return links;

  function addLink(from, to, relation) {
    const key = `${from}->${to}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({
      from,
      to,
      relation,
      fromName: names.get(from)?.name || from,
      toName: names.get(to)?.name || to
    });
  }
}

export function engineArchitectureFlowLinks(flow = engineArchitectureFlow, engines = engineArchitecture) {
  const names = engineArchitectureById(engines);
  return flow.map(([from, to, reason]) => ({
    from,
    to,
    relation: "flow",
    reason,
    fromName: names.get(from)?.name || from,
    toName: names.get(to)?.name || to
  }));
}

function hasPath(engines, fromId, toId) {
  if (fromId === toId) return true;
  const byId = engineArchitectureById(engines);
  const visited = new Set();
  const queue = [fromId];
  while (queue.length) {
    const current = queue.shift();
    if (current === toId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const item = byId.get(current);
    if (!item) continue;
    [...item.dependsOn, ...item.providesTo].forEach((nextId) => {
      if (!visited.has(nextId)) queue.push(nextId);
    });
  }
  return false;
}

function engine(input) {
  return Object.freeze({
    ...input,
    dependsOn: Object.freeze(input.dependsOn || []),
    providesTo: Object.freeze(input.providesTo || []),
    mapPosition: Object.freeze(input.mapPosition || [0, 0, 0])
  });
}
