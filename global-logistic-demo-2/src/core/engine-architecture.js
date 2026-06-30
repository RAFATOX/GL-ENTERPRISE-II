export const WORKFLOW_ENGINE_ID = "workflow";

export const EngineStatuses = Object.freeze({
  READY: "gotowy",
  IN_PROGRESS: "w budowie",
  PLANNED: "planowany"
});

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

export const engineArchitectureRelationTypes = Object.freeze({
  required: { label: "linia obowiązkowa", legend: "proces główny", color: "#f6c44d", dash: [] },
  info: { label: "linia informacyjna", legend: "dostęp i uprawnienia / wiedza i AI", color: "#79a7ff", dash: [7, 6] },
  audit: { label: "linia audytowa", legend: "audyt", color: "#ff6b6b", dash: [2, 6] },
  future: { label: "linia przyszłościowa", legend: "moduły przyszłe", color: "#b7e36b", dash: [12, 8] }
});

const engineDocumentation = Object.freeze({
  user: docs(EngineStatuses.READY, ["src/core/demo-data.js", "src/users/user-engine.js"], ["tests/core-stability.test.js"]),
  identity: docs(EngineStatuses.READY, ["src/auth/auth-engine.js", "src/users/user-engine.js"], ["tests/core-stability.test.js"]),
  "registration-onboarding": docs(EngineStatuses.READY, ["src/onboarding/registration-onboarding-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  company: docs(EngineStatuses.READY, ["src/companies/company-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  "user-company-role": docs(EngineStatuses.READY, ["src/companies/company-engine.js", "src/core/demo-data.js"], ["tests/core-stability.test.js"]),
  permission: docs(EngineStatuses.READY, ["src/permissions/permissions-engine.js", "src/core/modules-config.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  "routing-access": docs(EngineStatuses.READY, ["src/ui/app.js", "src/ui/role-config.js", "src/core/modules-config.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  ui: docs(EngineStatuses.READY, ["src/ui/renderers.js", "src/ui/app.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  translation: docs(EngineStatuses.READY, ["src/translation/ui-translation-engine.js", "src/translation/translation-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  workflow: docs(EngineStatuses.READY, ["src/workflow/workflow-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  "transport-load": docs(EngineStatuses.READY, ["src/transports/transport-engine.js", "src/shipments/shipment-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  driver: docs(EngineStatuses.READY, ["src/users/user-engine.js", "src/driver-time/driver-time-engine.js", "src/workflow/workflow-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  vehicle: docs(EngineStatuses.READY, ["src/workflow/workflow-engine.js", "src/core/demo-data.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  document: docs(EngineStatuses.READY, ["src/documents/document-engine.js", "src/cmr/digital-cmr-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  gps: docs(EngineStatuses.READY, ["src/gps/gps-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  wallet: docs(EngineStatuses.READY, ["src/wallets/wallet-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  "financial-audit": docs(EngineStatuses.READY, ["src/audit/financial-audit-service.js"], ["tests/core-stability.test.js"]),
  escrow: docs(EngineStatuses.READY, ["src/escrow/escrow-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  "audit-log": docs(EngineStatuses.READY, ["src/audit/audit-engine.js", "src/events/event-bus.js"], ["tests/core-stability.test.js", "tests/engine-architecture.test.js"]),
  knowledge: docs(EngineStatuses.READY, ["src/knowledge/knowledge-engine.js"], ["tests/core-stability.test.js", "tests/engine-architecture.test.js"]),
  "ai-control": docs(EngineStatuses.READY, ["src/ai-control/ai-control-agent.js"], ["tests/core-stability.test.js", "tests/engine-architecture.test.js"]),
  notification: docs(EngineStatuses.READY, ["src/notifications/notification-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  reputation: docs(EngineStatuses.READY, ["src/trust/trust-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  profile: docs(EngineStatuses.READY, ["src/ui/renderers.js", "src/trust/trust-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  dispute: docs(EngineStatuses.READY, ["src/disputes/dispute-engine.js"], ["tests/core-stability.test.js"]),
  "admin-views": docs(EngineStatuses.READY, ["src/ui/renderers.js", "src/permissions/permissions-engine.js"], ["tests/core-stability.test.js"]),
  "gl-academy": docs(EngineStatuses.IN_PROGRESS, ["src/jobs/jobs-engine.js", "src/knowledge/knowledge-engine.js"], ["tests/core-stability.test.js", "tests/e2e/gl-enterprise.e2e.test.js"]),
  "gl-jobs": docs(EngineStatuses.PLANNED, ["src/jobs/jobs-engine.js"], ["tests/core-stability.test.js"]),
  "gl-fleet-market": docs(EngineStatuses.PLANNED, ["src/core/engine-architecture.js"], ["tests/engine-architecture.test.js"])
});

export const engineArchitecture = Object.freeze([
  engine({
    id: "user",
    name: "Użytkownik",
    layer: "identity",
    type: "aktor",
    description: "Osoba fizyczna wchodząca do GL jako jedna trwała tożsamość, niezależnie od liczby ról i firm.",
    responsibility: "Dostarcza punkt wejścia i trwałe user_id dla całego ekosystemu GL.",
    dependsOn: [],
    providesTo: ["identity"],
    inputs: ["numer telefonu", "język", "kraj", "zgody"],
    outputs: ["user_id", "aktywny użytkownik"],
    workflowRole: "źródło tożsamości",
    mapPosition: [-19, 2, 0]
  }),
  engine({
    id: "identity",
    name: "Silnik Tożsamości",
    layer: "identity",
    type: "silnik",
    description: "Obsługuje logowanie, sesje, jednorazowe kody, reset hasła i główną tożsamość użytkownika.",
    responsibility: "Potwierdza, kim jest użytkownik i chroni jedną główną tożsamość.",
    dependsOn: ["user", "audit-log"],
    providesTo: ["registration-onboarding", "company", "permission", "translation", "profile", "workflow"],
    inputs: ["user"],
    outputs: ["registration-onboarding", "company", "permission", "profile", "workflow"],
    workflowRole: "brama identyfikacji",
    mapPosition: [-15, 2, 0]
  }),
  engine({
    id: "registration-onboarding",
    name: "Rejestracja i Wdrożenie",
    layer: "identity",
    type: "silnik",
    description: "Prowadzi użytkownika przez język, kraj, telefon, kod potwierdzający, konto, role, dokumenty i status weryfikacji.",
    responsibility: "Nie dopuszcza użytkownika do pracy bez wymaganych etapów weryfikacji.",
    dependsOn: ["identity", "translation", "audit-log"],
    providesTo: ["company", "permission", "workflow", "ui"],
    inputs: ["identity", "translation"],
    outputs: ["company", "permission", "workflow", "ui"],
    workflowRole: "weryfikacja wejścia do systemu",
    mapPosition: [-11.2, 2, 0]
  }),
  engine({
    id: "company",
    name: "Silnik Firm",
    layer: "company",
    type: "silnik",
    description: "Zarządza firmami, danymi podmiotów, dokumentami, statusem weryfikacji, zaproszeniami i rolami firmowymi.",
    responsibility: "Tworzy company_id i kontekst pracy użytkownika w firmie.",
    dependsOn: ["identity", "registration-onboarding", "audit-log"],
    providesTo: ["user-company-role", "permission", "workflow", "wallet", "driver", "vehicle", "profile", "gl-jobs", "gl-fleet-market"],
    inputs: ["identity", "registration-onboarding"],
    outputs: ["user-company-role", "permission", "workflow", "wallet", "driver", "vehicle", "profile"],
    workflowRole: "kontekst firmy",
    mapPosition: [-7.3, 1.2, 0]
  }),
  engine({
    id: "user-company-role",
    name: "Rola Użytkownika w Firmie",
    layer: "company",
    type: "model",
    description: "Łączy użytkownika z firmą, rolą firmową i zakresem uprawnień w danym podmiocie.",
    responsibility: "Przechowuje członkostwo użytkownika w firmie bez mieszania go z tożsamością prywatną.",
    dependsOn: ["identity", "company", "audit-log"],
    providesTo: ["permission", "routing-access", "workflow"],
    inputs: ["identity", "company"],
    outputs: ["permission", "routing-access", "workflow"],
    workflowRole: "członkostwo i zakres pracy",
    mapPosition: [-7.3, -1.6, 1.5]
  }),
  engine({
    id: "permission",
    name: "Silnik Uprawnień",
    layer: "access",
    type: "silnik",
    description: "Centralnie decyduje o prawach do akcji, tras, modułów, danych i zakresów finansowych.",
    responsibility: "Jest jedyną bramą dostępu dla UI, routingu, workflow i zakresów finansowych.",
    dependsOn: ["identity", "company", "user-company-role", "audit-log"],
    providesTo: ["routing-access", "ui", "workflow", "wallet", "escrow", "knowledge", "admin-views", "driver", "vehicle", "profile", "notification", "gl-jobs", "gl-fleet-market"],
    inputs: ["identity", "company", "user-company-role"],
    outputs: ["routing-access", "ui", "workflow", "wallet", "escrow", "profile"],
    workflowRole: "kontrola dostępu",
    mapPosition: [-3.6, 1.1, 0]
  }),
  engine({
    id: "routing-access",
    name: "Routing i Dostęp",
    layer: "access",
    type: "brama",
    description: "Pilnuje tras, widoku braku dostępu, aktywnej roli, aktywnej firmy, aktywnej przestrzeni i przebudowy pulpitu.",
    responsibility: "Pilnuje, aby ręczne wejście przez adres URL nie omijało uprawnień.",
    dependsOn: ["permission", "identity", "company", "workflow"],
    providesTo: ["ui", "audit-log"],
    inputs: ["permission", "identity", "company"],
    outputs: ["ui", "audit-log"],
    workflowRole: "brama tras i widoków",
    mapPosition: [-3.8, 6.1, 1.6]
  }),
  engine({
    id: "ui",
    name: "Interfejs Użytkownika",
    layer: "ui",
    type: "prezentacja",
    description: "Warstwa prezentacji renderowana z aktywnej przestrzeni, uprawnień i kluczy tłumaczeń.",
    responsibility: "Pokazuje użytkownikowi tylko funkcje i dane wynikające z aktywnego kontekstu.",
    dependsOn: ["routing-access", "translation", "permission", "workflow"],
    providesTo: ["workflow", "audit-log"],
    inputs: ["routing-access", "translation", "permission", "workflow"],
    outputs: ["workflow", "audit-log"],
    workflowRole: "obsługa interakcji użytkownika",
    mapPosition: [5.2, 7.3, 1.8]
  }),
  engine({
    id: "translation",
    name: "Silnik Tłumaczeń",
    layer: "ui",
    type: "silnik",
    description: "Dostarcza klucze tłumaczeń dla interfejsu, walidacji, błędów, rejestracji, profili i procesów.",
    responsibility: "Utrzymuje spójny język interfejsu i komunikatów.",
    dependsOn: ["identity", "registration-onboarding"],
    providesTo: ["ui", "registration-onboarding", "profile", "workflow"],
    inputs: ["identity", "registration-onboarding"],
    outputs: ["ui", "profile", "workflow"],
    workflowRole: "język interfejsu",
    mapPosition: [0.6, 8.2, 1.9]
  }),
  engine({
    id: "workflow",
    name: "Silnik Workflow",
    layer: "workflow",
    type: "silnik",
    description: "Centralnie koordynuje proces transportowy od ładunku po rozliczenie, zabezpieczenie płatności, reputację i audyt.",
    responsibility: "Jest centrum operacyjnym GL i spina transport, dokumenty, GPS, płatności, reputację oraz audyt.",
    dependsOn: ["identity", "company", "permission", "driver", "vehicle", "wallet", "escrow", "document", "gps", "knowledge", "audit-log", "notification", "transport-load"],
    providesTo: ["transport-load", "driver", "vehicle", "document", "wallet", "escrow", "gps", "audit-log", "reputation", "notification", "ai-control", "knowledge", "profile", "admin-views", "gl-jobs", "ui"],
    inputs: ["permission", "company", "transport-load", "driver", "vehicle", "document", "gps"],
    outputs: ["wallet", "escrow", "audit-log", "reputation", "notification", "profile"],
    workflowRole: "centralny koordynator procesu",
    mapPosition: [0, 0, 0]
  }),
  engine({
    id: "transport-load",
    name: "Silnik Transportu i Ładunków",
    layer: "workflow",
    type: "silnik",
    description: "Obsługuje model ładunku i transportu, publikację, przyjęcie, status oraz kolejne etapy procesu.",
    responsibility: "Pilnuje cyklu życia ładunku i transportu bez pomijania etapów.",
    dependsOn: ["workflow", "company", "permission", "driver", "vehicle", "document", "gps", "audit-log"],
    providesTo: ["workflow", "wallet", "escrow", "notification", "reputation"],
    inputs: ["company", "permission", "driver", "vehicle", "document", "gps"],
    outputs: ["workflow", "wallet", "escrow", "notification", "reputation"],
    workflowRole: "stan ładunku i transportu",
    mapPosition: [0.6, -2.8, 0.9]
  }),
  engine({
    id: "driver",
    name: "Silnik Kierowcy",
    layer: "transport",
    type: "silnik",
    description: "Przechowuje dane kierowcy, status weryfikacji, dokumenty, aktualny pojazd, dostępność i gotowość do transportu.",
    responsibility: "Sprawdza, czy kierowca może wykonać pracę w aktywnym kontekście firmy.",
    dependsOn: ["identity", "company", "permission", "document", "audit-log"],
    providesTo: ["workflow", "gps", "vehicle", "gl-jobs"],
    inputs: ["identity", "company", "permission", "document"],
    outputs: ["workflow", "gps", "vehicle", "gl-jobs"],
    workflowRole: "wykonanie transportu przez kierowcę",
    mapPosition: [-4.7, -4.3, 2.2]
  }),
  engine({
    id: "vehicle",
    name: "Silnik Pojazdów",
    layer: "transport",
    type: "silnik",
    description: "Obsługuje pojazdy firmy, dane techniczne, status, dokumenty, zgodność z ładunkiem i przypisanie do kierowcy.",
    responsibility: "Dostarcza gotowość floty i zgodność pojazdu z wymaganiami transportu.",
    dependsOn: ["company", "permission", "audit-log"],
    providesTo: ["workflow", "driver", "gps", "gl-fleet-market"],
    inputs: ["company", "permission", "document"],
    outputs: ["workflow", "driver", "gps", "gl-fleet-market"],
    workflowRole: "flota wykonująca transport",
    mapPosition: [-1.7, -6.4, 2.5]
  }),
  engine({
    id: "document",
    name: "Silnik Dokumentów",
    layer: "transport",
    type: "silnik",
    description: "Obsługuje listy przewozowe, dokumenty transportowe, dokumenty firmowe, dowody zdjęciowe i weryfikację wymagań procesu.",
    responsibility: "Zapewnia dowody transportowe i weryfikuje kompletność dokumentów.",
    dependsOn: ["identity", "company", "permission", "audit-log"],
    providesTo: ["workflow", "driver", "vehicle", "profile", "admin-views"],
    inputs: ["identity", "company", "permission"],
    outputs: ["workflow", "driver", "vehicle", "profile", "admin-views"],
    workflowRole: "dowody i weryfikacja",
    mapPosition: [5, -3.7, 1.8]
  }),
  engine({
    id: "gps",
    name: "Silnik GPS",
    layer: "transport",
    type: "silnik",
    description: "Dostarcza pozycję kierowcy, przewidywany czas dojazdu, potwierdzenie lokalizacji i historię trasy.",
    responsibility: "Daje dowód lokalizacji, czas dojazdu i sygnały opóźnień dla procesu transportowego.",
    dependsOn: ["workflow", "driver", "vehicle", "audit-log"],
    providesTo: ["workflow", "notification", "ai-control"],
    inputs: ["workflow", "driver", "vehicle"],
    outputs: ["workflow", "notification", "ai-control", "audit-log"],
    workflowRole: "dowód lokalizacji",
    mapPosition: [2.4, -5.5, 2.3]
  }),
  engine({
    id: "wallet",
    name: "Silnik Portfeli",
    layer: "finance",
    type: "silnik",
    description: "Obsługuje portfele użytkowników, firm i platformy, salda, transakcje, wypłaty oraz rozliczenia.",
    responsibility: "Zarządza zakresem finansowym bez ujawniania salda platformy nieuprawnionym rolom.",
    dependsOn: ["identity", "company", "permission", "financial-audit", "audit-log"],
    providesTo: ["workflow", "escrow", "audit-log", "admin-views", "notification"],
    inputs: ["identity", "company", "permission", "financial-audit"],
    outputs: ["escrow", "workflow", "audit-log", "admin-views", "notification"],
    workflowRole: "wykonanie operacji finansowych",
    mapPosition: [8.3, -1.7, 2.6]
  }),
  engine({
    id: "financial-audit",
    name: "Finansowy Silnik Audytu",
    layer: "finance",
    type: "silnik",
    description: "Wymusza realny wpis audytu dla operacji portfela, escrow, płatności, rozliczeń i decyzji sporów.",
    responsibility: "Blokuje operację finansową, jeśli nie można utworzyć powiązanego wpisu audytu.",
    dependsOn: ["audit-log"],
    providesTo: ["wallet", "escrow", "audit-log", "admin-views"],
    inputs: ["audit-log"],
    outputs: ["wallet", "escrow", "audit-log", "admin-views"],
    workflowRole: "audyt operacji finansowych",
    mapPosition: [9.4, 1.7, 2.2]
  }),
  engine({
    id: "escrow",
    name: "Silnik Escrow",
    layer: "finance",
    type: "silnik",
    description: "Zabezpiecza środki, pokazuje status płatności, zwalnia środki po odbiorze i zamraża je przy sporze.",
    responsibility: "Chroni płatność transportową od przyjęcia ładunku do rozliczenia albo sporu.",
    dependsOn: ["wallet", "workflow", "financial-audit", "audit-log", "permission"],
    providesTo: ["workflow", "audit-log", "notification", "dispute", "admin-views"],
    inputs: ["wallet", "workflow", "financial-audit", "permission"],
    outputs: ["workflow", "audit-log", "notification", "dispute", "admin-views"],
    workflowRole: "zabezpieczenie płatności",
    mapPosition: [11.5, -1.4, 1]
  }),
  engine({
    id: "audit-log",
    name: "Silnik Audytu",
    layer: "finance",
    type: "rejestr dowodowy",
    description: "Centralny, niezmienny dziennik rejestracji, zmian roli, kontekstu, transportu, finansów, escrow, dokumentów, GPS, reputacji, wiedzy i decyzji administracyjnych.",
    responsibility: "Nie jest modułem końcowym; działa jako centralny rejestr dowodowy, do którego zapisują kluczowe silniki GL.",
    dependsOn: ["identity"],
    providesTo: ["registration-onboarding", "company", "permission", "workflow", "wallet", "escrow", "knowledge", "dispute", "admin-views", "ai-control", "notification", "reputation", "gps", "document", "profile"],
    inputs: ["identity", "registration-onboarding", "company", "permission", "workflow", "wallet", "escrow", "document", "gps", "reputation", "dispute", "ai-control", "knowledge"],
    outputs: ["financial-audit", "admin-views", "knowledge", "ai-control", "compliance"],
    usedBy: ["identity", "registration-onboarding", "company", "permission", "workflow", "wallet", "escrow", "document", "gps", "reputation", "dispute", "ai-control", "knowledge"],
    workflowRole: "centralny rejestr dowodowy",
    mapPosition: [5.8, 2.4, -2.4]
  }),
  engine({
    id: "knowledge",
    name: "Silnik Wiedzy",
    layer: "knowledge",
    type: "silnik",
    description: "Udostępnia źródła wiedzy dla procesu, agenta AI, Akademii GL, zgodności i komunikatów informacyjnych.",
    responsibility: "Łączy źródła regulacyjne i operacyjne z workflow, AI i szkoleniami.",
    dependsOn: ["audit-log", "permission"],
    providesTo: ["workflow", "ai-control", "gl-academy", "admin-views", "notification"],
    inputs: ["audit-log", "permission"],
    outputs: ["workflow", "ai-control", "gl-academy", "admin-views", "notification"],
    workflowRole: "kontekst wiedzy",
    mapPosition: [-7.6, -3.2, -4.3]
  }),
  engine({
    id: "ai-control",
    name: "Agent AI",
    layer: "knowledge",
    type: "agent",
    description: "Analizuje ryzyka transportu, nietypowe zdarzenia, potencjalne oszustwa, spory i niezgodności procesu.",
    responsibility: "Wykrywa ryzyka i generuje sygnały kontrolne bez omijania audit log.",
    dependsOn: ["workflow", "knowledge", "audit-log", "notification"],
    providesTo: ["workflow", "admin-views", "notification", "audit-log"],
    inputs: ["workflow", "knowledge", "audit-log"],
    outputs: ["workflow", "admin-views", "notification", "audit-log"],
    workflowRole: "kontrola ryzyka",
    mapPosition: [-11, -2.1, -4.4]
  }),
  engine({
    id: "notification",
    name: "Silnik Powiadomień",
    layer: "communication",
    type: "silnik",
    description: "Wysyła powiadomienia do kierowcy, przewoźnika, klienta, magazynu, zespołu zgodności i obszaru płatności.",
    responsibility: "Informuje uczestników procesu o zmianach statusu, ryzykach i wymaganych działaniach.",
    dependsOn: ["workflow", "audit-log", "permission"],
    providesTo: ["ui", "driver", "company", "ai-control", "workflow"],
    inputs: ["workflow", "audit-log", "permission", "ai-control"],
    outputs: ["ui", "driver", "company", "workflow"],
    workflowRole: "informowanie uczestników",
    mapPosition: [5.7, 1.2, 4.6]
  }),
  engine({
    id: "reputation",
    name: "Silnik Reputacji",
    layer: "trust",
    type: "silnik",
    description: "Aktualizuje reputację po transporcie, odbiorze, ocenie, sporze, anulowaniu, opóźnieniu i naruszeniu zasad.",
    responsibility: "Zamienia zdarzenia procesu i audytu w profil zaufania użytkownika lub firmy.",
    dependsOn: ["workflow", "audit-log"],
    providesTo: ["profile", "workflow", "gl-academy"],
    inputs: ["workflow", "audit-log"],
    outputs: ["profile", "workflow", "gl-academy"],
    workflowRole: "ocena zaufania",
    mapPosition: [5.5, -6.8, -2.3]
  }),
  engine({
    id: "profile",
    name: "Silnik Profilu",
    layer: "trust",
    type: "silnik",
    description: "Buduje profil użytkownika i firmy, reputację, opinie oraz widok publiczny i prywatny zgodnie z uprawnieniami.",
    responsibility: "Pokazuje zaufanie, dokumenty i aktywność bez ujawniania cudzych danych.",
    dependsOn: ["identity", "company", "reputation", "permission", "translation"],
    providesTo: ["ui", "reputation", "gl-academy", "gl-jobs"],
    inputs: ["identity", "company", "reputation", "permission", "translation"],
    outputs: ["ui", "gl-academy", "gl-jobs"],
    workflowRole: "prezentacja zaufania",
    mapPosition: [9.2, -6.4, -2.4]
  }),
  engine({
    id: "dispute",
    name: "Silnik Sporów",
    layer: "admin",
    type: "silnik",
    description: "Obsługuje spory, pakiet dowodów, decyzje administracyjne oraz zamrożenie albo podział płatności.",
    responsibility: "Łączy escrow, dowody i decyzję administratora w audytowalną ścieżkę sporu.",
    dependsOn: ["workflow", "escrow", "audit-log", "permission"],
    providesTo: ["admin-views", "reputation", "workflow", "audit-log"],
    inputs: ["workflow", "escrow", "audit-log", "permission"],
    outputs: ["admin-views", "reputation", "workflow", "audit-log"],
    workflowRole: "obsługa wyjątków",
    mapPosition: [13.2, -4, -0.8]
  }),
  engine({
    id: "admin-views",
    name: "Widoki Administracyjne",
    layer: "admin",
    type: "widok",
    description: "Widoki administracyjne i developerskie dostępne tylko dla operatorów GL i uprawnionych administratorów.",
    responsibility: "Daje operatorom GL podgląd techniczny i kontrolny bez mieszania go z UI zwykłego użytkownika.",
    dependsOn: ["permission", "audit-log", "workflow", "wallet", "escrow", "knowledge", "dispute"],
    providesTo: ["ui", "audit-log"],
    inputs: ["permission", "audit-log", "workflow", "wallet", "escrow", "knowledge", "dispute"],
    outputs: ["ui", "audit-log"],
    workflowRole: "administracja i obserwowalność",
    mapPosition: [12.4, 6, -2.4]
  }),
  engine({
    id: "gl-academy",
    name: "Akademia GL",
    layer: "future",
    type: "moduł przyszły",
    description: "Szkolenia, materiały, testy i certyfikacje powiązane z wiedzą, profilami i reputacją.",
    responsibility: "Rozwija wiedzę i certyfikacje na podstawie Silnika Wiedzy oraz profilu zaufania.",
    dependsOn: ["knowledge", "profile", "reputation", "permission"],
    providesTo: ["profile", "knowledge"],
    inputs: ["knowledge", "profile", "reputation", "permission"],
    outputs: ["profile", "knowledge"],
    workflowRole: "przyszły moduł wiedzy",
    mapPosition: [-9.6, -6.4, -4.2]
  }),
  engine({
    id: "gl-jobs",
    name: "Giełda Pracy GL",
    layer: "future",
    type: "moduł przyszły",
    description: "Przyszły rynek pracy i zadań powiązany z profilem, firmą oraz uprawnieniami.",
    responsibility: "Łączy profile zawodowe z firmami i zapotrzebowaniem operacyjnym.",
    dependsOn: ["profile", "company", "permission", "workflow"],
    providesTo: ["workflow", "profile"],
    inputs: ["profile", "company", "permission", "workflow"],
    outputs: ["workflow", "profile"],
    workflowRole: "przyszły moduł pracy",
    mapPosition: [-2.8, -8.8, -3.1]
  }),
  engine({
    id: "gl-fleet-market",
    name: "Giełda Pojazdów GL",
    layer: "future",
    type: "moduł przyszły",
    description: "Przyszły rynek floty powiązany z pojazdami, firmami i uprawnieniami.",
    responsibility: "Łączy zasoby floty z firmami i kontrolą uprawnień.",
    dependsOn: ["vehicle", "company", "permission"],
    providesTo: ["vehicle", "company"],
    inputs: ["vehicle", "company", "permission"],
    outputs: ["vehicle", "company"],
    workflowRole: "przyszły moduł floty",
    mapPosition: [2.4, -8.8, -3.2]
  })
]);

export const engineArchitectureRelations = Object.freeze([
  rel("user", "identity", "tożsamość użytkownika", "required"),
  rel("identity", "registration-onboarding", "weryfikacja tożsamości", "required"),
  rel("registration-onboarding", "company", "kontekst firmy", "required"),
  rel("company", "permission", "zakres uprawnień", "required"),
  rel("permission", "workflow", "dozwolona akcja", "required"),
  rel("workflow", "transport-load", "cykl życia ładunku", "required"),
  rel("workflow", "driver", "przypisanie kierowcy", "required"),
  rel("workflow", "vehicle", "gotowość pojazdu", "required"),
  rel("workflow", "document", "dokumenty i dowody", "required"),
  rel("workflow", "gps", "lokalizacja i czas dojazdu", "required"),
  rel("workflow", "escrow", "zabezpieczenie płatności", "required"),
  rel("workflow", "wallet", "status płatności", "required"),
  rel("workflow", "notification", "powiadomienia procesu", "required"),
  rel("escrow", "audit-log", "dowód finansowy", "audit"),
  rel("wallet", "audit-log", "audyt transakcji", "audit"),
  rel("audit-log", "reputation", "zdarzenie reputacji", "required"),
  rel("reputation", "profile", "profil zaufania", "required"),
  rel("profile", "notification", "komunikat profilu", "info"),
  rel("notification", "ui", "powiadomienie w interfejsie", "required"),
  rel("permission", "routing-access", "ochrona tras", "info"),
  rel("routing-access", "ui", "widoczny interfejs", "info"),
  rel("translation", "ui", "klucze tłumaczeń", "info"),
  rel("company", "user-company-role", "członkostwo firmy", "info"),
  rel("user-company-role", "permission", "uprawnienia członkostwa", "info"),
  rel("knowledge", "workflow", "kontekst wiedzy", "info"),
  rel("knowledge", "ai-control", "kontekst ryzyka", "info"),
  rel("knowledge", "gl-academy", "treści szkoleniowe", "future"),
  rel("ai-control", "notification", "alert ryzyka", "info"),
  rel("driver", "vehicle", "aktywny pojazd", "info"),
  rel("wallet", "escrow", "blokada środków", "required"),
  rel("financial-audit", "audit-log", "finansowy wpis dowodowy", "audit"),
  rel("financial-audit", "wallet", "audyt portfela", "audit"),
  rel("financial-audit", "escrow", "audyt escrow", "audit"),
  rel("profile", "gl-jobs", "tożsamość zawodowa", "future"),
  rel("company", "gl-jobs", "kontekst firmy", "future"),
  rel("vehicle", "gl-fleet-market", "zasób floty", "future"),
  rel("company", "gl-fleet-market", "właściciel firmy", "future"),
  ...[
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
    "knowledge"
  ].map((from) => rel(from, "audit-log", "zapis do rejestru dowodowego", "audit"))
]);

export const engineArchitectureFlow = Object.freeze([
  ["user", "identity", "tożsamość użytkownika"],
  ["identity", "registration-onboarding", "weryfikacja tożsamości"],
  ["registration-onboarding", "company", "kontekst firmy"],
  ["company", "permission", "zakres uprawnień"],
  ["permission", "workflow", "dozwolona akcja"],
  ["workflow", "driver", "przypisanie kierowcy"],
  ["workflow", "vehicle", "gotowość pojazdu"],
  ["workflow", "document", "dokumenty i dowody"],
  ["workflow", "gps", "lokalizacja i czas dojazdu"],
  ["workflow", "escrow", "zabezpieczenie płatności"],
  ["workflow", "wallet", "status płatności"],
  ["escrow", "audit-log", "dowód finansowy"],
  ["wallet", "audit-log", "audyt transakcji"],
  ["audit-log", "reputation", "zdarzenie reputacji"],
  ["reputation", "profile", "profil zaufania"],
  ["profile", "notification", "komunikat profilu"],
  ["notification", "ui", "interfejs użytkownika"]
]);

export function validateEngineArchitecture(engines = engineArchitecture) {
  const errors = [];
  const ids = new Set(engines.map((item) => item.id));
  const workflow = engines.find((item) => item.id === WORKFLOW_ENGINE_ID);

  if (!workflow) errors.push("Brakuje centralnego Silnika Workflow");

  engines.forEach((item) => {
    ["id", "name", "layer", "type", "description", "dependsOn", "providesTo", "workflowRole", "status", "files", "tests"].forEach((field) => {
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

  engineArchitectureRelations.forEach((item) => {
    if (!ids.has(item.from)) errors.push(`Relacja wskazuje brakujący silnik ${item.from}`);
    if (!ids.has(item.to)) errors.push(`Relacja wskazuje brakujący silnik ${item.to}`);
    if (!engineArchitectureRelationTypes[item.type]) errors.push(`Relacja ${item.from}->${item.to} ma nieznany typ ${item.type}`);
  });

  return {
    ok: errors.length === 0,
    errors
  };
}

export function engineArchitectureById(engines = engineArchitecture) {
  return new Map(engines.map((item) => [item.id, item]));
}

export function engineArchitectureLinks(engines = engineArchitecture) {
  const ids = new Set(engines.map((item) => item.id));
  const names = engineArchitectureById(engines);
  const seen = new Set();
  return engineArchitectureRelations
    .filter((item) => ids.has(item.from) && ids.has(item.to))
    .filter((item) => {
      const key = `${item.from}->${item.to}:${item.type}:${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      ...item,
      relation: item.type,
      reason: item.label,
      fromName: names.get(item.from)?.name || item.from,
      toName: names.get(item.to)?.name || item.to
    }));
}

export function engineArchitectureFlowLinks(flow = engineArchitectureFlow, engines = engineArchitecture) {
  const names = engineArchitectureById(engines);
  return flow.map(([from, to, reason]) => ({
    from,
    to,
    type: "required",
    relation: "flow",
    label: reason,
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

function docs(status, files, tests) {
  return Object.freeze({
    status,
    files: Object.freeze(files),
    tests: Object.freeze(tests)
  });
}

function rel(from, to, label, type = "info") {
  return Object.freeze({ from, to, label, type });
}

function engine(input) {
  const documentation = engineDocumentation[input.id] || docs(EngineStatuses.IN_PROGRESS, [], []);
  return Object.freeze({
    ...input,
    status: input.status || documentation.status,
    files: Object.freeze(input.files || documentation.files || []),
    tests: Object.freeze(input.tests || documentation.tests || []),
    responsibility: input.responsibility || input.workflowRole || "",
    inputs: Object.freeze(input.inputs || input.dependsOn || []),
    outputs: Object.freeze(input.outputs || input.providesTo || []),
    usedBy: Object.freeze(input.usedBy || input.providesTo || []),
    dependsOn: Object.freeze(input.dependsOn || []),
    providesTo: Object.freeze(input.providesTo || []),
    mapPosition: Object.freeze(input.mapPosition || [0, 0, 0])
  });
}
