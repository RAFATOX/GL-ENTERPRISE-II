export const WORKFLOW_ENGINE_ID = "workflow";

export const engineArchitectureLayers = Object.freeze({
  identity: { label: "Tożsamość i wejście", color: "#4dd4ff" },
  company: { label: "Firma i role", color: "#8fd36b" },
  access: { label: "Uprawnienia i dostęp", color: "#79a7ff" },
  workflow: { label: "Workflow transportu", color: "#f6c44d" },
  transport: { label: "Transport", color: "#58c7ff" },
  finance: { label: "Finanse i dowody", color: "#41d28a" },
  trust: { label: "Zaufanie i profile", color: "#f59bd8" },
  knowledge: { label: "Wiedza i AI", color: "#b794ff" },
  communication: { label: "Komunikacja", color: "#66d9c7" },
  ui: { label: "Prezentacja", color: "#ff8f70" },
  admin: { label: "Administracja", color: "#d8dde4" },
  future: { label: "Moduły przyszłe", color: "#b7e36b" }
});

export const engineArchitecture = Object.freeze([
  engine({
    id: "user",
    name: "Użytkownik",
    layer: "identity",
    type: "actor",
    description: "Osoba fizyczna wchodząca do GL jako jedna trwała tożsamość, niezależnie od liczby ról i firm.",
    dependsOn: [],
    providesTo: ["identity"],
    workflowRole: "źródło tożsamości",
    mapPosition: [-14, 1.6, -0.8]
  }),
  engine({
    id: "identity",
    name: "Silnik Tożsamości",
    layer: "identity",
    type: "engine",
    description: "Obsługuje logowanie, sesje, jednorazowe kody, reset hasła i główną tożsamość użytkownika.",
    dependsOn: ["user", "audit-log"],
    providesTo: ["registration-onboarding", "company", "permission", "translation", "profile", "workflow"],
    workflowRole: "brama identyfikacji",
    mapPosition: [-11.2, 1.6, -0.4]
  }),
  engine({
    id: "registration-onboarding",
    name: "Rejestracja i Wdrożenie",
    layer: "identity",
    type: "engine",
    description: "Prowadzi użytkownika przez język, kraj, telefon, kod potwierdzający, konto, role, dokumenty i status weryfikacji.",
    dependsOn: ["identity", "translation", "audit-log"],
    providesTo: ["company", "permission", "workflow", "ui"],
    workflowRole: "weryfikacja wejścia do systemu",
    mapPosition: [-8.4, 1.5, 0]
  }),
  engine({
    id: "company",
    name: "Silnik Firm",
    layer: "company",
    type: "engine",
    description: "Zarządza firmami, danymi podmiotów, dokumentami, statusem weryfikacji, zaproszeniami i rolami firmowymi.",
    dependsOn: ["identity", "audit-log"],
    providesTo: ["user-company-role", "permission", "workflow", "wallet", "driver", "vehicle", "profile", "gl-jobs", "gl-fleet-market"],
    workflowRole: "kontekst firmy",
    mapPosition: [-5.4, 0.9, 0.2]
  }),
  engine({
    id: "user-company-role",
    name: "Rola Użytkownika w Firmie",
    layer: "company",
    type: "model",
    description: "Łączy użytkownika z firmą, rolą firmową i zakresem uprawnień w danym podmiocie.",
    dependsOn: ["identity", "company", "audit-log"],
    providesTo: ["permission", "routing-access", "workflow"],
    workflowRole: "członkostwo i zakres pracy",
    mapPosition: [-5.4, -0.8, 1.2]
  }),
  engine({
    id: "permission",
    name: "Silnik Uprawnień",
    layer: "access",
    type: "engine",
    description: "Centralnie decyduje o prawach do akcji, tras, modułów, danych i zakresów finansowych.",
    dependsOn: ["identity", "company", "user-company-role", "audit-log"],
    providesTo: ["routing-access", "ui", "workflow", "wallet", "escrow", "knowledge", "admin-views", "driver", "vehicle", "profile", "notification", "gl-jobs", "gl-fleet-market"],
    workflowRole: "kontrola dostępu",
    mapPosition: [-2.8, 0.9, 0]
  }),
  engine({
    id: "routing-access",
    name: "Routing i Dostęp",
    layer: "access",
    type: "gateway",
    description: "Pilnuje tras, widoku braku dostępu, aktywnej roli, aktywnej firmy, aktywnej przestrzeni i przebudowy pulpitu.",
    dependsOn: ["permission", "identity", "company", "workflow"],
    providesTo: ["ui", "audit-log"],
    workflowRole: "brama tras i widoków",
    mapPosition: [-2.3, 5, -0.5]
  }),
  engine({
    id: "ui",
    name: "Interfejs Użytkownika",
    layer: "ui",
    type: "presentation",
    description: "Warstwa prezentacji renderowana z aktywnej przestrzeni, uprawnień i kluczy tłumaczeń.",
    dependsOn: ["routing-access", "translation", "permission", "workflow"],
    providesTo: ["workflow", "audit-log"],
    workflowRole: "obsługa interakcji użytkownika",
    mapPosition: [4.8, 5.2, -0.8]
  }),
  engine({
    id: "translation",
    name: "Silnik Tłumaczeń",
    layer: "ui",
    type: "engine",
    description: "Dostarcza klucze tłumaczeń dla interfejsu, walidacji, błędów, rejestracji, profili i procesów.",
    dependsOn: ["identity", "registration-onboarding"],
    providesTo: ["ui", "registration-onboarding", "profile", "workflow"],
    workflowRole: "język interfejsu",
    mapPosition: [1.2, 6.4, -1.1]
  }),
  engine({
    id: "workflow",
    name: "Silnik Workflow",
    layer: "workflow",
    type: "engine",
    description: "Centralnie koordynuje proces transportowy od ładunku po rozliczenie, zabezpieczenie płatności, reputację i audyt.",
    dependsOn: ["identity", "company", "permission", "driver", "vehicle", "wallet", "escrow", "document", "gps", "knowledge", "audit-log", "notification", "transport-load"],
    providesTo: ["transport-load", "driver", "vehicle", "document", "wallet", "escrow", "gps", "audit-log", "reputation", "notification", "ai-control", "knowledge", "profile", "admin-views", "gl-jobs", "ui"],
    workflowRole: "centralny koordynator procesu",
    mapPosition: [0, 0, 0]
  }),
  engine({
    id: "transport-load",
    name: "Silnik Transportów i Ładunków",
    layer: "workflow",
    type: "engine",
    description: "Obsługuje model ładunku i transportu, publikację, przyjęcie, status oraz kolejne etapy procesu.",
    dependsOn: ["workflow", "company", "permission", "driver", "vehicle", "document", "gps", "audit-log"],
    providesTo: ["workflow", "wallet", "escrow", "notification", "reputation"],
    workflowRole: "stan ładunku i transportu",
    mapPosition: [0.8, -2, 0.6]
  }),
  engine({
    id: "driver",
    name: "Silnik Kierowcy",
    layer: "transport",
    type: "engine",
    description: "Przechowuje dane kierowcy, status weryfikacji, dokumenty, aktualny pojazd, dostępność i gotowość do transportu.",
    dependsOn: ["identity", "company", "permission", "document", "audit-log"],
    providesTo: ["workflow", "gps", "vehicle", "gl-jobs"],
    workflowRole: "wykonanie transportu przez kierowcę",
    mapPosition: [-3.3, -3.1, 1.5]
  }),
  engine({
    id: "vehicle",
    name: "Silnik Pojazdów",
    layer: "transport",
    type: "engine",
    description: "Obsługuje pojazdy firmy, dane techniczne, status, dokumenty, zgodność z ładunkiem i przypisanie do kierowcy.",
    dependsOn: ["company", "permission", "audit-log"],
    providesTo: ["workflow", "driver", "gps", "gl-fleet-market"],
    workflowRole: "flota wykonująca transport",
    mapPosition: [-1, -4.4, 1.8]
  }),
  engine({
    id: "document",
    name: "Silnik Dokumentów",
    layer: "transport",
    type: "engine",
    description: "Obsługuje listy przewozowe, dokumenty transportowe, dokumenty firmowe, dowody zdjęciowe i weryfikację wymagań procesu.",
    dependsOn: ["identity", "company", "permission", "audit-log"],
    providesTo: ["workflow", "driver", "vehicle", "profile", "admin-views"],
    workflowRole: "dowody i weryfikacja",
    mapPosition: [3.6, -2.4, 1.4]
  }),
  engine({
    id: "gps",
    name: "Silnik GPS",
    layer: "transport",
    type: "engine",
    description: "Dostarcza pozycję kierowcy, przewidywany czas dojazdu, potwierdzenie lokalizacji i historię trasy.",
    dependsOn: ["workflow", "driver", "vehicle", "audit-log"],
    providesTo: ["workflow", "notification", "ai-control"],
    workflowRole: "dowód lokalizacji",
    mapPosition: [2.1, -3.8, 1.4]
  }),
  engine({
    id: "wallet",
    name: "Silnik Portfeli",
    layer: "finance",
    type: "engine",
    description: "Obsługuje portfele użytkowników, firm i platformy, salda, transakcje, wypłaty oraz rozliczenia.",
    dependsOn: ["identity", "company", "permission", "financial-audit", "audit-log"],
    providesTo: ["workflow", "escrow", "audit-log", "admin-views", "notification"],
    workflowRole: "wykonanie operacji finansowych",
    mapPosition: [6.2, -1.2, 1.3]
  }),
  engine({
    id: "financial-audit",
    name: "Finansowy Serwis Audytu",
    layer: "finance",
    type: "service",
    description: "Wymusza realny wpis audytu dla operacji portfela, escrow, płatności, rozliczeń i decyzji sporów.",
    dependsOn: ["audit-log"],
    providesTo: ["wallet", "escrow", "admin-views"],
    workflowRole: "audyt operacji finansowych",
    mapPosition: [7.8, 0.8, 1.4]
  }),
  engine({
    id: "escrow",
    name: "Silnik Escrow",
    layer: "finance",
    type: "engine",
    description: "Zabezpiecza środki, pokazuje status płatności, zwalnia środki po odbiorze i zamraża je przy sporze.",
    dependsOn: ["wallet", "workflow", "financial-audit", "audit-log", "permission"],
    providesTo: ["workflow", "audit-log", "notification", "dispute", "admin-views"],
    workflowRole: "zabezpieczenie płatności",
    mapPosition: [8.8, -1.8, 0.2]
  }),
  engine({
    id: "audit-log",
    name: "Silnik Audytu",
    layer: "finance",
    type: "engine",
    description: "Niezmienny dziennik rejestracji, zmian roli, zmian przestrzeni, transportu, finansów, escrow i decyzji administracyjnych.",
    dependsOn: ["identity"],
    providesTo: ["registration-onboarding", "company", "permission", "workflow", "wallet", "escrow", "knowledge", "dispute", "admin-views", "ai-control", "notification", "reputation", "gps"],
    workflowRole: "ślad audytowy",
    mapPosition: [10.8, 0.6, 0]
  }),
  engine({
    id: "knowledge",
    name: "Silnik Wiedzy",
    layer: "knowledge",
    type: "engine",
    description: "Udostępnia źródła wiedzy dla procesu, agenta AI, Akademii GL, zgodności i komunikatów informacyjnych.",
    dependsOn: ["audit-log", "permission"],
    providesTo: ["workflow", "ai-control", "gl-academy", "admin-views", "notification"],
    workflowRole: "kontekst wiedzy",
    mapPosition: [-5.2, -2.2, -3.6]
  }),
  engine({
    id: "ai-control",
    name: "Agent AI",
    layer: "knowledge",
    type: "agent",
    description: "Analizuje ryzyka transportu, nietypowe zdarzenia, potencjalne oszustwa, spory i niezgodności procesu.",
    dependsOn: ["workflow", "knowledge", "audit-log", "notification"],
    providesTo: ["workflow", "admin-views", "notification"],
    workflowRole: "kontrola ryzyka",
    mapPosition: [-8.1, -1.6, -4.2]
  }),
  engine({
    id: "notification",
    name: "Silnik Powiadomień",
    layer: "communication",
    type: "engine",
    description: "Wysyła powiadomienia do kierowcy, przewoźnika, klienta, magazynu, zespołu zgodności i obszaru płatności.",
    dependsOn: ["workflow", "audit-log", "permission"],
    providesTo: ["ui", "driver", "company", "ai-control", "workflow"],
    workflowRole: "informowanie uczestników",
    mapPosition: [4.8, 1.5, 4.2]
  }),
  engine({
    id: "reputation",
    name: "Silnik Reputacji",
    layer: "trust",
    type: "engine",
    description: "Aktualizuje reputację po transporcie, odbiorze, ocenie, sporze, anulowaniu, opóźnieniu i naruszeniu zasad.",
    dependsOn: ["workflow", "audit-log"],
    providesTo: ["profile", "workflow", "gl-academy"],
    workflowRole: "ocena zaufania",
    mapPosition: [4.7, -4.4, -2.6]
  }),
  engine({
    id: "profile",
    name: "Silnik Profilu",
    layer: "trust",
    type: "engine",
    description: "Buduje profil użytkownika i firmy, reputację, opinie oraz widok publiczny i prywatny zgodnie z uprawnieniami.",
    dependsOn: ["identity", "company", "reputation", "permission", "translation"],
    providesTo: ["ui", "reputation", "gl-academy", "gl-jobs"],
    workflowRole: "prezentacja zaufania",
    mapPosition: [7.1, -4.1, -2.4]
  }),
  engine({
    id: "dispute",
    name: "Silnik Sporów",
    layer: "admin",
    type: "engine",
    description: "Obsługuje spory, pakiet dowodów, decyzje administracyjne oraz zamrożenie albo podział płatności.",
    dependsOn: ["workflow", "escrow", "audit-log", "permission"],
    providesTo: ["admin-views", "reputation", "workflow"],
    workflowRole: "obsługa wyjątków",
    mapPosition: [10.2, -3.3, -1.2]
  }),
  engine({
    id: "admin-views",
    name: "Widoki Administracyjne",
    layer: "admin",
    type: "view",
    description: "Widoki administracyjne i developerskie dostępne tylko dla operatorów GL i uprawnionych administratorów.",
    dependsOn: ["permission", "audit-log", "workflow", "wallet", "escrow", "knowledge", "dispute"],
    providesTo: ["ui", "audit-log"],
    workflowRole: "administracja i obserwowalność",
    mapPosition: [9.5, 3.8, -2.5]
  }),
  engine({
    id: "gl-academy",
    name: "Akademia GL",
    layer: "future",
    type: "future_module",
    description: "Szkolenia, materiały, testy i certyfikacje powiązane z wiedzą, profilami i reputacją.",
    dependsOn: ["knowledge", "profile", "reputation", "permission"],
    providesTo: ["profile", "knowledge"],
    workflowRole: "przyszły moduł wiedzy",
    mapPosition: [-8, -4.9, -3.5]
  }),
  engine({
    id: "gl-jobs",
    name: "Giełda Pracy GL",
    layer: "future",
    type: "future_module",
    description: "Przyszły rynek pracy i zadań powiązany z profilem, firmą oraz uprawnieniami.",
    dependsOn: ["profile", "company", "permission", "workflow"],
    providesTo: ["workflow", "profile"],
    workflowRole: "przyszły moduł pracy",
    mapPosition: [-2.5, -6.2, -2.1]
  }),
  engine({
    id: "gl-fleet-market",
    name: "Giełda Pojazdów GL",
    layer: "future",
    type: "future_module",
    description: "Przyszły rynek floty powiązany z pojazdami, firmami i uprawnieniami.",
    dependsOn: ["vehicle", "company", "permission"],
    providesTo: ["vehicle", "company"],
    workflowRole: "przyszły moduł floty",
    mapPosition: [2.2, -6.1, -2.3]
  })
]);

export const engineArchitectureFlow = Object.freeze([
  ["user", "identity", "tożsamość użytkownika"],
  ["identity", "registration-onboarding", "weryfikacja tożsamości"],
  ["registration-onboarding", "company", "kontekst firmy"],
  ["company", "permission", "zakres uprawnień"],
  ["permission", "routing-access", "ochrona tras"],
  ["routing-access", "ui", "widoczny interfejs"],
  ["translation", "ui", "klucze tłumaczeń"],
  ["permission", "workflow", "dozwolona akcja"],
  ["knowledge", "workflow", "kontekst wiedzy"],
  ["workflow", "driver", "przypisanie kierowcy"],
  ["driver", "vehicle", "aktywny pojazd"],
  ["workflow", "vehicle", "gotowość pojazdu"],
  ["workflow", "document", "dokumenty i dowody"],
  ["workflow", "gps", "lokalizacja i czas dojazdu"],
  ["workflow", "transport-load", "cykl życia ładunku"],
  ["transport-load", "wallet", "zabezpieczona płatność"],
  ["workflow", "wallet", "status płatności"],
  ["wallet", "escrow", "blokada środków"],
  ["escrow", "audit-log", "dowód finansowy"],
  ["workflow", "audit-log", "audyt procesu"],
  ["workflow", "notification", "aktualizacje statusu"],
  ["workflow", "reputation", "zdarzenie reputacji"],
  ["reputation", "profile", "profil zaufania"],
  ["profile", "ui", "widok profilu"],
  ["knowledge", "ai-control", "kontekst ryzyka"],
  ["ai-control", "notification", "alert ryzyka"],
  ["knowledge", "gl-academy", "treści szkoleniowe"],
  ["profile", "gl-jobs", "tożsamość zawodowa"],
  ["company", "gl-jobs", "kontekst firmy"],
  ["vehicle", "gl-fleet-market", "zasób floty"],
  ["company", "gl-fleet-market", "właściciel firmy"]
]);

export function validateEngineArchitecture(engines = engineArchitecture) {
  const errors = [];
  const ids = new Set(engines.map((item) => item.id));
  const workflow = engines.find((item) => item.id === WORKFLOW_ENGINE_ID);

  if (!workflow) errors.push("Brakuje centralnego Silnika Workflow");

  engines.forEach((item) => {
    ["id", "name", "layer", "type", "description", "dependsOn", "providesTo", "workflowRole"].forEach((field) => {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        errors.push(`${item.id || "unknown"} nie ma pola ${field}`);
      }
    });

    [...item.dependsOn, ...item.providesTo].forEach((targetId) => {
      if (!ids.has(targetId)) errors.push(`${item.id} wskazuje brakujący silnik ${targetId}`);
    });

    const canBeDetachedByType = item.id === "user" || item.layer === "future";
    if (!canBeDetachedByType && !item.dependsOn.length && !item.providesTo.length) {
      errors.push(`${item.id} jest odizolowany`);
    }
  });

  if (workflow) {
    engines
      .filter((item) => item.id !== "user")
      .forEach((item) => {
        const fromWorkflow = hasPath(engines, WORKFLOW_ENGINE_ID, item.id);
        const toWorkflow = hasPath(engines, item.id, WORKFLOW_ENGINE_ID);
        if (!fromWorkflow && !toWorkflow) {
          errors.push(`${item.id} nie jest połączony z Silnikiem Workflow`);
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
