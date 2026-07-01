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

const engineSpecificationDetails = Object.freeze({
  user: spec({
    purpose: "Reprezentuje osobę fizyczną przed wyborem roli, firmy i zakresu uprawnień.",
    workflowOrder: ["1. Użytkownik wybiera język, kraj i metodę kontaktu.", "2. Silnik Tożsamości tworzy lub odnajduje trwałe user_id.", "3. Dalsze silniki pracują wyłącznie na user_id, a nie na telefonie lub e-mailu."],
    businessRules: ["Telefon i e-mail są metodami kontaktu, nie główną tożsamością.", "Jedna osoba może mieć wiele ról i kilka kontekstów firmowych.", "Brak potwierdzonej tożsamości ogranicza dostęp do funkcji operacyjnych."],
    triggers: ["pierwsze wejście do aplikacji", "logowanie", "zmiana aktywnej roli", "zmiana aktywnej przestrzeni"],
    auditLog: ["utworzenie użytkownika", "wybór języka", "zmiana danych kontaktowych", "próba wejścia bez weryfikacji"],
    permissions: ["identity.self.read", "profile.own.read"],
    relatedRoles: ["Kierowca", "Właściciel przewoźnika", "Klient", "Magazyn", "Warsztat", "Ubezpieczyciel", "Właściciel platformy"],
    relatedModules: ["Profil", "Rejestracja", "Aktywna rola", "Aktywna przestrzeń"],
    flowSteps: ["Użytkownik otwiera GL", "System tworzy kontekst osoby", "Silnik Tożsamości potwierdza user_id", "Rejestracja sprawdza brakujące dane", "Interfejs pokazuje dostępne role i przestrzenie"]
  }),
  identity: spec({
    purpose: "Potwierdza tożsamość użytkownika i utrzymuje sesję bez duplikowania kont.",
    workflowOrder: ["1. Odbiera numer telefonu, hasło lub wyzwanie OTP.", "2. Weryfikuje kod, limit prób i ważność sesji.", "3. Przekazuje potwierdzone user_id do onboardingu, firm i uprawnień."],
    businessRules: ["Dowolny kod OTP nie jest akceptowany.", "Nieudane próby są limitowane i audytowane.", "Wylogowanie unieważnia aktywną sesję."],
    triggers: ["logowanie", "wylogowanie", "reset hasła", "weryfikacja OTP", "odświeżenie sesji"],
    auditLog: ["udane logowanie", "nieudane logowanie", "blokada OTP", "reset hasła", "wylogowanie"],
    permissions: ["identity.login", "identity.session.manage", "identity.password.reset"],
    relatedRoles: ["Każdy użytkownik GL"],
    relatedModules: ["Rejestracja", "Profil", "Routing i Dostęp", "Silnik Uprawnień"],
    flowSteps: ["Użytkownik podaje dane logowania", "Silnik Tożsamości sprawdza sesję i OTP", "Audit Log zapisuje próbę", "Permission Engine otrzymuje user_id", "UI przechodzi do aktywnego kontekstu"]
  }),
  "registration-onboarding": spec({
    purpose: "Prowadzi użytkownika od pierwszego wejścia do zweryfikowanego konta i kontekstu firmy.",
    workflowOrder: ["1. Wymaga języka, kraju, telefonu i zgód.", "2. Przechodzi przez OTP, konto i dokument tożsamości.", "3. Dla ról firmowych tworzy lub uzupełnia Company Engine."],
    businessRules: ["Bez telefonu i zgód nie wolno przejść do OTP.", "Bez dokumentu tożsamości konto pozostaje ograniczone.", "Każda rola może wymagać osobnych dokumentów."],
    triggers: ["pierwsza rejestracja", "wybór roli", "dodanie dokumentu", "weryfikacja firmy", "uzupełnienie braków"],
    auditLog: ["wybór języka", "potwierdzenie telefonu", "dodanie dokumentu", "zmiana statusu weryfikacji", "odrzucenie dokumentu"],
    permissions: ["onboarding.start", "identity.documents.upload", "company.create"],
    relatedRoles: ["Kierowca", "Właściciel przewoźnika", "Właściciel klienta", "Właściciel magazynu", "Właściciel warsztatu", "Partner ubezpieczeniowy"],
    relatedModules: ["Rejestracja", "Dokumenty", "Firma", "Profil"],
    flowSteps: ["Użytkownik wybiera język i kraj", "Podaje telefon i akceptuje zgody", "OTP potwierdza numer", "Użytkownik dodaje dane konta i dokumenty", "Company Engine tworzy firmę lub przypisanie"]
  }),
  company: spec({
    purpose: "Tworzy i utrzymuje firmę jako główny kontekst pracy organizacyjnej.",
    workflowOrder: ["1. Odbiera dane firmy z onboardingu.", "2. Tworzy company_id i status weryfikacji.", "3. Przekazuje członkostwo do UserCompanyRole i Permission Engine."],
    businessRules: ["Dane firmy są odseparowane przez company_id.", "Użytkownik może należeć do wielu firm.", "Niezatwierdzona firma ma ograniczone akcje biznesowe."],
    triggers: ["utworzenie firmy", "zaproszenie pracownika", "zmiana firmy aktywnej", "dodanie dokumentu firmowego"],
    auditLog: ["utworzenie firmy", "zmiana danych firmy", "zaproszenie użytkownika", "zmiana statusu weryfikacji", "zawieszenie firmy"],
    permissions: ["company.read", "company.manage", "company.invite_users", "company.documents.upload"],
    relatedRoles: ["Właściciel przewoźnika", "Właściciel klienta", "Właściciel magazynu", "Właściciel warsztatu", "Partner ubezpieczeniowy", "Właściciel platformy"],
    relatedModules: ["Moja firma", "Kierowcy", "Pojazdy", "Dokumenty firmy", "Rozliczenia"],
    flowSteps: ["Onboarding przekazuje dane firmy", "Silnik Firm tworzy company_id", "UserCompanyRole przypisuje właściciela", "Permission Engine wylicza dostęp", "Menu pokazuje moduły firmy"]
  }),
  "user-company-role": spec({
    purpose: "Łączy użytkownika z firmą, rolą firmową i zakresem uprawnień.",
    workflowOrder: ["1. Pobiera user_id i company_id.", "2. Przypisuje rolę w firmie.", "3. Permission Engine oblicza skuteczne prawa dla aktywnej przestrzeni."],
    businessRules: ["Rola działa tylko w danej firmie.", "Zmiana firmy wymaga przeliczenia permissions.", "Lista ról w UI nie może być globalną listą demonstracyjną."],
    triggers: ["przyjęcie zaproszenia", "zmiana aktywnej firmy", "zmiana roli firmowej", "odebranie uprawnień"],
    auditLog: ["nadanie roli", "zmiana roli", "usunięcie z firmy", "próba dostępu poza członkostwem"],
    permissions: ["company.roles.read", "company.roles.manage", "company.invite_users"],
    relatedRoles: ["Owner", "Admin", "Finance", "Dispatcher", "Driver Manager", "Mechanic", "Viewer"],
    relatedModules: ["Aktywna przestrzeń", "Moja firma", "Ustawienia", "Silnik Uprawnień"],
    flowSteps: ["Firma zaprasza użytkownika", "Użytkownik przyjmuje zaproszenie", "Silnik zapisuje UserCompanyRole", "Permission Engine liczy prawa", "Routing odświeża dostępne moduły"]
  }),
  permission: spec({
    purpose: "Jest jedynym źródłem decyzji, czy użytkownik może zobaczyć lub wykonać akcję.",
    workflowOrder: ["1. Pobiera user_id, activeRole i activeCompanyId.", "2. Łączy role z permission w aktywnym kontekście.", "3. Przekazuje wynik do menu, routingu, workflow i finansów."],
    businessRules: ["Nie wolno decydować o dostępie tylko po nazwie roli.", "Każda zmiana roli lub firmy czyści stary zakres dostępu.", "Brak permission oznacza ukrycie akcji lub Brak dostępu."],
    triggers: ["zmiana roli", "zmiana firmy", "wejście na trasę", "kliknięcie akcji", "zmiana uprawnień"],
    auditLog: ["próba wejścia bez dostępu", "zmiana permission", "zmiana roli", "odmowa akcji"],
    permissions: ["permissions.evaluate", "admin.permissions.manage", "admin.audit.read"],
    relatedRoles: ["Każda rola użytkownika", "Administrator GL", "Compliance GL", "Właściciel platformy"],
    relatedModules: ["Menu modułów", "Routing", "Workflow", "Portfele", "Panel administracyjny"],
    flowSteps: ["Aktywny kontekst wysyła user_id i company_id", "Permission Engine pobiera role firmowe", "Silnik wylicza permissions", "Routing blokuje lub przepuszcza widok", "UI renderuje tylko dozwolone moduły"]
  }),
  "routing-access": spec({
    purpose: "Chroni wejścia do widoków i synchronizuje trasę z aktywną rolą oraz firmą.",
    workflowOrder: ["1. Odbiera próbę wejścia w route.", "2. Pyta Permission Engine o wymagane uprawnienia.", "3. Renderuje widok albo Brak dostępu."],
    businessRules: ["Ręczne wpisanie URL nie omija Permission Engine.", "Zmiana roli przebudowuje route context bez wylogowania.", "Stare panele rolowe nie mogą pozostać osobną aplikacją."],
    triggers: ["kliknięcie modułu", "ręczny URL", "zmiana aktywnej roli", "zmiana aktywnej firmy"],
    auditLog: ["wejście na chronioną trasę", "odmowa dostępu", "zmiana widoku", "zmiana aktywnego kontekstu"],
    permissions: ["routing.access", "modules.read"],
    relatedRoles: ["Każda rola użytkownika"],
    relatedModules: ["Dashboard", "Menu modułów", "AccessDenied", "Profil"],
    flowSteps: ["Użytkownik wybiera moduł", "Routing sprawdza wymagane permission", "Brak permission pokazuje Brak dostępu", "Dostęp renderuje właściwy moduł", "Audit Log zapisuje odmowę lub wejście"]
  }),
  ui: spec({
    purpose: "Renderuje jeden spójny interfejs GL na podstawie aktywnej roli, firmy i tłumaczeń.",
    workflowOrder: ["1. Pobiera snapshot aktywnego kontekstu.", "2. Renderuje dashboard, menu, profil i moduły.", "3. Przekazuje akcje użytkownika do silników, zamiast zmieniać dane lokalnie."],
    businessRules: ["UI nie decyduje samodzielnie o uprawnieniach.", "Zwykły użytkownik nie widzi elementów developerskich.", "Teksty muszą przechodzić przez Translation Engine."],
    triggers: ["zmiana roli", "zmiana firmy", "kliknięcie modułu", "zmiana języka", "nowe powiadomienie"],
    auditLog: ["zmiana widoku", "próba niedozwolonej akcji", "aktywacja kontekstu"],
    permissions: ["modules.read", "profile.own.read"],
    relatedRoles: ["Każda rola użytkownika"],
    relatedModules: ["Dashboard", "Profil", "Menu modułów", "Dokumenty", "Rozliczenia"],
    flowSteps: ["Permission Engine zwraca dozwolone moduły", "Translation Engine dostarcza teksty", "UI buduje menu i panel", "Akcja użytkownika trafia do właściwego silnika", "Widok aktualizuje się po zdarzeniu"]
  }),
  translation: spec({
    purpose: "Zapewnia spójny język interfejsu i komunikatów bez mieszania języków.",
    workflowOrder: ["1. Odczytuje język użytkownika.", "2. Zwraca teksty po translation_key.", "3. Obsługuje komunikaty walidacji, formularzy i statusów."],
    businessRules: ["Polski UI nie pokazuje technicznych angielskich nazw.", "Brak klucza musi być wykrywalny w testach.", "Kod i modele mogą zostać techniczne, ale widok nie."],
    triggers: ["wybór języka", "render widoku", "walidacja formularza", "zmiana aktywnej roli"],
    auditLog: ["wybór języka", "zmiana języka", "brakujący klucz tłumaczenia"],
    permissions: ["translation.read"],
    relatedRoles: ["Każda rola użytkownika"],
    relatedModules: ["Dashboard", "Onboarding", "Profil", "Wallet", "Dokumenty"],
    flowSteps: ["UI prosi o translation_key", "Silnik wybiera słownik języka", "Parametry są podstawiane do komunikatu", "Widok renderuje tekst użytkownika", "Testy blokują powrót technicznych etykiet"]
  }),
  workflow: spec({
    purpose: "Koordynuje cały cykl transportu od ładunku do dostawy, audytu, reputacji i rozliczenia.",
    workflowOrder: ["1. Odbiera zdarzenie biznesowe transportu.", "2. Sprawdza permissions, firmę, kierowcę, pojazd, dokumenty, GPS i płatność.", "3. Zmienia status procesu i publikuje zdarzenia do kolejnych silników."],
    businessRules: ["Nie wolno pomijać etapów transportu.", "Transport wymagający escrow nie startuje bez zabezpieczonej płatności.", "Każda ważna zmiana statusu trafia do Audit Log."],
    triggers: ["utworzenie ładunku", "przyjęcie ładunku", "przypisanie kierowcy", "załadunek", "rozładunek", "zakończenie transportu"],
    auditLog: ["zmiana statusu transportu", "przypisanie zasobów", "blokada etapu", "zakończenie procesu", "spór"],
    permissions: ["loads.create", "loads.accept", "loads.assign_driver", "transports.manage_company", "documents.upload"],
    relatedRoles: ["Właściciel przewoźnika", "Dyspozytor", "Kierowca", "Właściciel klienta", "Pracownik magazynu", "Administrator GL"],
    relatedModules: ["Transporty", "Ładunki", "GPS", "Dokumenty", "Escrow", "Powiadomienia"],
    flowSteps: ["Klient dodaje ładunek", "Workflow odbiera zdarzenie", "Sprawdzenie uprawnień", "Silnik Firm potwierdza kontekst", "Silnik Kierowcy i Pojazdów sprawdza zasoby", "Silnik Dokumentów i GPS potwierdza warunki", "Escrow i Portfele zabezpieczają płatność", "Audit Log zapisuje dowód", "Reputacja i Profil aktualizują zaufanie", "Powiadomienia i UI pokazują wynik"]
  }),
  "transport-load": spec({
    purpose: "Utrzymuje dane ładunku, transportu i ich statusy operacyjne.",
    workflowOrder: ["1. Klient publikuje ładunek.", "2. Przewoźnik akceptuje i przypisuje zasoby.", "3. Transport przechodzi przez statusy workflow."],
    businessRules: ["Ładunek aktywny musi mieć wymagania, daty i status płatności.", "Przyjęcie ładunku wymaga zgodnego pojazdu i kierowcy.", "Status transportu wynika z Workflow Engine."],
    triggers: ["utworzenie ładunku", "wyszukiwanie ładunków", "akceptacja ładunku", "przypisanie transportu"],
    auditLog: ["utworzenie ładunku", "akceptacja", "przypisanie pojazdu", "przypisanie kierowcy", "zmiana statusu"],
    permissions: ["loads.create", "loads.view_company", "loads.accept", "loads.assign_driver"],
    relatedRoles: ["Właściciel klienta", "Pracownik klienta", "Właściciel przewoźnika", "Dyspozytor"],
    relatedModules: ["Ładunki", "Szukaj ładunków", "Moje transporty", "Rozliczenia"],
    flowSteps: ["Klient tworzy ładunek", "Silnik zapisuje wymagania", "Przewoźnik widzi ofertę", "Workflow sprawdza zgodność zasobów", "Transport przechodzi do realizacji"]
  }),
  driver: spec({
    purpose: "Utrzymuje dane kierowcy, jego weryfikację, dostępność i przypisania transportowe.",
    workflowOrder: ["1. Sprawdza, czy kierowca należy do aktywnej firmy lub działa jako osoba.", "2. Weryfikuje dokumenty i status.", "3. Udostępnia kierowcę Workflow tylko, gdy spełnia wymagania."],
    businessRules: ["Kierowca bez wymaganych dokumentów nie może rozpocząć transportu.", "Kierowca nie widzi finansów firmy przewoźnika.", "Do transportu trafiają tylko aktywni i zweryfikowani kierowcy."],
    triggers: ["dodanie kierowcy", "zaproszenie kierowcy", "przypisanie do transportu", "potwierdzenie etapu przez kierowcę"],
    auditLog: ["dodanie kierowcy", "zmiana statusu kierowcy", "przypisanie do transportu", "odmowa z powodu dokumentów"],
    permissions: ["drivers.assign", "drivers.view_company", "documents.upload", "transports.driver.confirm"],
    relatedRoles: ["Kierowca", "Właściciel przewoźnika", "Dyspozytor", "Kierownik floty"],
    relatedModules: ["Moi kierowcy", "Czas pracy", "GPS", "Transporty", "Dokumenty"],
    flowSteps: ["Przewoźnik zaprasza kierowcę", "Silnik sprawdza UserCompanyRole", "Dokumenty potwierdzają uprawnienia", "Workflow przypisuje transport", "Kierowca potwierdza etapy w aplikacji"]
  }),
  vehicle: spec({
    purpose: "Utrzymuje pojazdy firmy, ich parametry, dokumenty i zgodność z ładunkami.",
    workflowOrder: ["1. Firma dodaje pojazd.", "2. Silnik sprawdza status i parametry techniczne.", "3. Workflow dopuszcza tylko pojazdy zgodne z wymaganiami ładunku."],
    businessRules: ["Pojazd w serwisie nie może zostać przypisany do transportu.", "ADR, chłodnia i ładowność muszą odpowiadać wymaganiom ładunku.", "Zmiany statusu pojazdu są audytowane."],
    triggers: ["dodanie pojazdu", "edycja parametrów", "zmiana statusu", "przypisanie do kierowcy", "akceptacja ładunku"],
    auditLog: ["utworzenie pojazdu", "zmiana dokumentów", "zmiana statusu", "przypisanie do transportu"],
    permissions: ["vehicles.create", "vehicles.manage", "drivers.assign", "documents.upload"],
    relatedRoles: ["Właściciel przewoźnika", "Kierownik floty", "Dyspozytor", "Kierowca"],
    relatedModules: ["Moje pojazdy", "Flota", "Dokumenty pojazdu", "Szukaj ładunków"],
    flowSteps: ["Firma dodaje pojazd", "Silnik zapisuje parametry", "Dokumenty potwierdzają przegląd i ubezpieczenie", "Workflow porównuje wymagania ładunku", "Pojazd trafia do transportu"]
  }),
  document: spec({
    purpose: "Zarządza dokumentami użytkownika, firmy, transportu, CMR i dowodami zdjęciowymi.",
    workflowOrder: ["1. Odbiera dokument lub zdjęcie.", "2. Przypisuje go do user_id, company_id, transport_id albo document_id.", "3. Przekazuje status do Workflow, Profilu i Audytu."],
    businessRules: ["Dokument transportowy nie jest dokumentem osobistym.", "Dostęp do dokumentu zależy od permission i kontekstu.", "Akceptacja dokumentów może odblokować rozliczenie."],
    triggers: ["upload dokumentu", "zdjęcie załadunku", "potwierdzenie CMR", "odrzucenie dokumentu", "żądanie kontroli"],
    auditLog: ["dodanie dokumentu", "zmiana statusu dokumentu", "odrzucenie", "potwierdzenie CMR", "dostęp kontrolny"],
    permissions: ["documents.upload", "documents.approve", "documents.view_company", "company.documents.upload"],
    relatedRoles: ["Kierowca", "Pracownik magazynu", "Właściciel przewoźnika", "Właściciel klienta", "Administrator GL"],
    relatedModules: ["Dokumenty", "CMR", "Zdjęcia GL", "Załadunek", "Rozładunek"],
    flowSteps: ["Użytkownik dodaje dokument", "Silnik przypisuje document_id", "Permission Engine sprawdza widoczność", "Workflow aktualizuje status transportu", "Audit Log zapisuje dowód"]
  }),
  gps: spec({
    purpose: "Dostarcza lokalizację, historię trasy, ETA i potwierdzenia miejsca zdarzenia.",
    workflowOrder: ["1. Odbiera pozycję pojazdu lub kierowcy.", "2. Przelicza ETA i zgodność miejsca z etapem.", "3. Wysyła sygnały do Workflow, Powiadomień i AI."],
    businessRules: ["GPS nie zastępuje uprawnień dostępu do danych.", "Zdarzenia załadunku i rozładunku mogą wymagać zgodności lokalizacji.", "Zmiana ETA powinna powiadomić zainteresowane strony."],
    triggers: ["aktualizacja pozycji", "dojazd do magazynu", "opuszczenie trasy", "opóźnienie", "potwierdzenie lokalizacji zdjęcia"],
    auditLog: ["pozycja etapowa", "zmiana ETA", "potwierdzenie geolokalizacji", "wykrycie odchylenia trasy"],
    permissions: ["gps.read_own", "gps.view_transport", "transports.monitor"],
    relatedRoles: ["Kierowca", "Dyspozytor", "Właściciel przewoźnika", "Magazyn", "Klient"],
    relatedModules: ["Live Map", "GL GPS", "Nawigacja", "Moje transporty"],
    flowSteps: ["Kierowca wysyła lokalizację", "GPS aktualizuje transport", "Workflow porównuje etap i miejsce", "AI analizuje opóźnienie", "Powiadomienia wysyłają nową ETA"]
  }),
  wallet: spec({
    purpose: "Obsługuje rozliczenia użytkowników, firm i platformy zgodnie z zakresem finansowym.",
    workflowOrder: ["1. Odbiera żądanie operacji finansowej.", "2. Sprawdza permission i financial scope.", "3. Tworzy wpis audytu przez Financial Audit i zapisuje transakcję."],
    businessRules: ["PlatformWallet widzą tylko role finansowe platformy.", "Driver widzi tylko UserWallet, jeśli ma rozliczenia osobiste.", "Nie wolno zapisać transakcji bez audit_log_id."],
    triggers: ["blokada środków", "wypłata", "prowizja GL", "rozliczenie transportu", "korekta"],
    auditLog: ["wallet transaction", "payout", "fee", "adjustment", "payment status change"],
    permissions: ["wallet.own.read", "wallet.company.read", "wallet.platform.read", "wallet.platform.manage", "payouts.company.manage"],
    relatedRoles: ["Właściciel przewoźnika", "Księgowość przewoźnika", "Właściciel klienta", "Finanse GL", "Właściciel platformy"],
    relatedModules: ["Rozliczenia", "Faktury", "GL Wallet", "Status wypłaty", "Escrow transportu"],
    flowSteps: ["Workflow zgłasza operację finansową", "Permission Engine sprawdza zakres", "Financial Audit tworzy rekord audytu", "Wallet zapisuje transakcję", "Notification informuje właściwe role"]
  }),
  "financial-audit": spec({
    purpose: "Wymusza powiązany rekord audytu dla każdej operacji finansowej.",
    workflowOrder: ["1. Odbiera zamiar operacji z Wallet lub Escrow.", "2. Tworzy realny audit_log_id.", "3. Zwraca identyfikator wymagany do zapisu finansowego."],
    businessRules: ["Brak Audit Service blokuje operację finansową.", "audit_log_id nie może być sztucznym stringiem.", "Operacja finansowa i audyt są jedną operacją logiczną."],
    triggers: ["transakcja portfela", "blokada escrow", "zwolnienie escrow", "wypłata", "decyzja sporu"],
    auditLog: ["utworzenie wpisu finansowego", "powiązanie audit_log_id", "blokada operacji bez audytu"],
    permissions: ["finance.audit.write", "finance.audit.read"],
    relatedRoles: ["Finanse GL", "Właściciel platformy", "Administrator GL"],
    relatedModules: ["GL Wallet", "Escrow", "Rozliczenia", "Audit Log"],
    flowSteps: ["Wallet lub Escrow prosi o audyt", "Financial Audit waliduje payload", "Audit Log tworzy rekord", "audit_log_id wraca do operacji", "Dopiero wtedy zapis finansowy jest dozwolony"]
  }),
  escrow: spec({
    purpose: "Zabezpiecza środki dla transportu do czasu spełnienia warunków dostawy i dokumentów.",
    workflowOrder: ["1. Klient blokuje środki dla ładunku.", "2. Escrow utrzymuje status podczas transportu.", "3. Po dostawie zwalnia, zwraca lub dzieli środki zgodnie z decyzją."],
    businessRules: ["Transport z wymaganym escrow nie startuje bez blokady środków.", "Spór zamraża escrow.", "Driver i role bez finansów nie widzą historii operacji escrow."],
    triggers: ["utworzenie transportu", "blokada środków", "zakończenie dostawy", "akceptacja dokumentów", "spór"],
    auditLog: ["reserve", "hold", "release", "refund", "split", "dispute lock"],
    permissions: ["escrow.own.read", "escrow.company.read", "escrow.manage", "wallet.company.manage"],
    relatedRoles: ["Właściciel klienta", "Właściciel przewoźnika", "Księgowość przewoźnika", "Finanse GL", "Moderator sporów"],
    relatedModules: ["Escrow transportu", "Rozliczenia", "Spory", "GL Wallet"],
    flowSteps: ["Klient tworzy ładunek z płatnością", "Wallet blokuje środki", "Escrow zapisuje operację z audit_log_id", "Workflow obserwuje warunki dostawy", "Escrow zwalnia lub zamraża środki"]
  }),
  "audit-log": spec({
    purpose: "Jest niezmiennym rejestrem dowodowym wszystkich kluczowych działań GL.",
    workflowOrder: ["1. Odbiera zdarzenie od silnika domenowego.", "2. Zapisuje aktora, akcję, stare i nowe wartości oraz entity_id.", "3. Udostępnia dowód dla finansów, AI, zgodności i administracji."],
    businessRules: ["Wpisów audytu nie wolno usuwać ani edytować.", "Operacje finansowe nie istnieją bez audit_log_id.", "Próby obejścia dostępu też są audytowane."],
    triggers: ["rejestracja", "zmiana statusu", "operacja finansowa", "odmowa dostępu", "decyzja sporu"],
    auditLog: ["własny rekord zdarzenia", "powiązania entity_id", "actor_id", "timestamp", "old_value", "new_value"],
    permissions: ["admin.audit.read", "finance.audit.read", "compliance.review"],
    relatedRoles: ["Właściciel platformy", "Administrator GL", "Compliance GL", "Finanse GL", "Moderator sporów"],
    relatedModules: ["Audit Log", "Developer/Admin", "Compliance", "GL Wallet", "Spory"],
    flowSteps: ["Silnik domenowy tworzy zdarzenie", "Audit Log zapisuje rekord", "Identyfikator trafia do operacji", "Admin lub Compliance może odczytać ścieżkę", "AI korzysta z historii do kontroli"]
  }),
  knowledge: spec({
    purpose: "Gromadzi wiedzę operacyjną, regulacyjną i procesową dla Workflow oraz AI.",
    workflowOrder: ["1. Rejestruje źródło wiedzy.", "2. Filtruje je po kraju, roli i typie procesu.", "3. Przekazuje kontekst do Workflow, AI i Akademii GL."],
    businessRules: ["Źródła wiedzy mają zakres i wersję.", "Dostęp do wiedzy zależy od permission.", "Wiedza nie zastępuje decyzji prawnej, ale wspiera kontrolę procesu."],
    triggers: ["dodanie źródła", "zapytanie workflow", "analiza AI", "lekcja Akademii GL"],
    auditLog: ["dodanie źródła wiedzy", "aktualizacja źródła", "użycie wiedzy w procesie"],
    permissions: ["knowledge.read", "knowledge.manage", "compliance.review"],
    relatedRoles: ["Administrator GL", "Compliance GL", "Nauczyciel Akademii GL", "Właściciel platformy"],
    relatedModules: ["Baza wiedzy", "AI", "Akademia GL", "Workflow"],
    flowSteps: ["Źródło wiedzy zostaje zarejestrowane", "Permission Engine sprawdza dostęp", "Workflow pyta o regułę", "AI otrzymuje kontekst ryzyka", "Akademia GL wykorzystuje materiał szkoleniowy"]
  }),
  "ai-control": spec({
    purpose: "Analizuje ryzyka, opóźnienia, braki dokumentów, anomalie finansowe i próby obejścia reguł.",
    workflowOrder: ["1. Odbiera zdarzenie z Workflow, GPS, Wallet, Escrow lub Knowledge.", "2. Sprawdza reguły ryzyka.", "3. Tworzy alert i rekomendację dla procesu lub admina."],
    businessRules: ["AI nie wykonuje decyzji finansowej bez silnika domenowego.", "Alert ma poziom ryzyka.", "Wynik AI musi być audytowalny."],
    triggers: ["brak dokumentów", "opóźnienie ETA", "nietypowa płatność", "spór", "podejrzane konto"],
    auditLog: ["alert AI", "poziom ryzyka", "rekomendacja", "powiązany transport lub user_id"],
    permissions: ["ai.alerts.read", "compliance.review", "admin.audit.read"],
    relatedRoles: ["Compliance GL", "Administrator GL", "Właściciel platformy", "Moderator sporów"],
    relatedModules: ["AI", "Alerty", "Compliance", "Workflow", "Powiadomienia"],
    flowSteps: ["Workflow wysyła zdarzenie", "Knowledge dostarcza reguły", "AI ocenia ryzyko", "Audit Log zapisuje wynik", "Notification wysyła alert do uprawnionej roli"]
  }),
  notification: spec({
    purpose: "Dostarcza użytkownikom komunikaty wynikające z procesu, ryzyka i zmian statusu.",
    workflowOrder: ["1. Odbiera zdarzenie domenowe.", "2. Wybiera odbiorców według roli, firmy i permission.", "3. Przekazuje komunikat do UI."],
    businessRules: ["Użytkownik dostaje tylko komunikaty z własnego zakresu.", "Powiadomienie nie może ujawniać cudzych finansów.", "Zmiana ETA i status transportu powinna być komunikowana właściwym stronom."],
    triggers: ["zmiana statusu transportu", "alert AI", "zmiana ETA", "spór", "akceptacja dokumentu"],
    auditLog: ["wysłanie powiadomienia", "odbiorcy", "typ komunikatu", "powiązany transport"],
    permissions: ["notifications.read", "notifications.manage"],
    relatedRoles: ["Kierowca", "Dyspozytor", "Klient", "Magazyn", "Compliance GL", "Finanse GL"],
    relatedModules: ["Komunikaty", "Dashboard", "Transporty", "AI"],
    flowSteps: ["Silnik domenowy publikuje zdarzenie", "Notification wybiera odbiorców", "Translation przygotowuje tekst", "UI pokazuje komunikat", "Audit Log zapisuje wysyłkę"]
  }),
  reputation: spec({
    purpose: "Przelicza zaufanie użytkowników i firm na podstawie realnych zdarzeń procesowych.",
    workflowOrder: ["1. Odbiera zdarzenie zakończenia, opóźnienia, sporu lub opinii.", "2. Aktualizuje miary reputacji.", "3. Przekazuje wynik do Profilu i Workflow."],
    businessRules: ["Reputacja wynika ze zdarzeń, nie z ręcznej deklaracji.", "Spory i fałszywe zgłoszenia obniżają zaufanie.", "Profil pokazuje reputację zgodnie z permission."],
    triggers: ["zakończenie transportu", "otrzymana opinia", "spór", "opóźnienie", "poprawne dokumenty"],
    auditLog: ["zmiana wskaźnika reputacji", "źródło zdarzenia", "liczba opinii", "spór wpływający na wynik"],
    permissions: ["trust.read", "reviews.create", "profile.public.read"],
    relatedRoles: ["Kierowca", "Przewoźnik", "Klient", "Magazyn", "Warsztat", "Ubezpieczyciel"],
    relatedModules: ["Profil", "Opinie", "Transporty", "Akademia GL"],
    flowSteps: ["Workflow kończy zdarzenie", "Audit Log dostarcza dowód", "Reputation liczy wynik", "Profile Engine aktualizuje kartę zaufania", "UI pokazuje ocenę i opinie"]
  }),
  profile: spec({
    purpose: "Buduje użytkownikowi i firmie czytelny profil z danymi, dokumentami, reputacją i portfelem właściwym dla roli.",
    workflowOrder: ["1. Pobiera identity, company, reputation i permissions.", "2. Filtruje sekcje profilu według aktywnej roli.", "3. Udostępnia UI bez danych technicznych i bez cudzych finansów."],
    businessRules: ["Profil nie pokazuje activeRole ani debugowych eventów.", "Portfel w profilu zależy od aktywnej roli.", "Dokumenty są widoczne tylko zgodnie z permission."],
    triggers: ["wejście w Profil", "zmiana aktywnej roli", "nowa opinia", "dodanie dokumentu", "zmiana firmy"],
    auditLog: ["zmiana danych profilu", "dodanie dokumentu", "otrzymana opinia", "wejście w profil publiczny"],
    permissions: ["profile.own.read", "profile.company.read", "documents.view_own", "wallet.own.read"],
    relatedRoles: ["Każda rola użytkownika"],
    relatedModules: ["Profil", "Reputacja", "Opinie", "Dokumenty", "Portfel"],
    flowSteps: ["UI otwiera profil", "Permission Engine wyznacza zakres", "Profile pobiera dane tożsamości i firmy", "Reputation dostarcza ocenę", "UI pokazuje zakładki właściwe dla roli"]
  }),
  dispute: spec({
    purpose: "Obsługuje spory, dowody, decyzje administracyjne i wpływ na escrow oraz reputację.",
    workflowOrder: ["1. Odbiera zgłoszenie sporu.", "2. Zbiera dowody z dokumentów, GPS, workflow i escrow.", "3. Decyzja wpływa na płatność i reputację."],
    businessRules: ["Spór zamraża escrow.", "Decyzja sporu musi mieć audit_log_id.", "Dostęp do sporu jest ograniczony do stron i moderatora."],
    triggers: ["zgłoszenie szkody", "spór o dostawę", "brak dokumentów", "decyzja moderatora"],
    auditLog: ["utworzenie sporu", "dodanie dowodu", "decyzja sporu", "release/refund/split"],
    permissions: ["disputes.create", "disputes.review", "escrow.manage", "admin.audit.read"],
    relatedRoles: ["Moderator sporów", "Właściciel klienta", "Właściciel przewoźnika", "Finanse GL", "Compliance GL"],
    relatedModules: ["Spory", "Escrow", "Dokumenty", "Audit Log", "Reputacja"],
    flowSteps: ["Strona zgłasza spór", "Escrow zamraża środki", "Silnik zbiera dowody", "Moderator podejmuje decyzję", "Wallet i Reputation aktualizują wynik"]
  }),
  "admin-views": spec({
    purpose: "Udostępnia techniczne i administracyjne widoki wyłącznie uprawnionym rolom platformy.",
    workflowOrder: ["1. Permission Engine potwierdza dostęp admina.", "2. Widok pobiera dane audytu, finansów, sporów i AI.", "3. UI pokazuje narzędzia bez ujawniania ich zwykłym użytkownikom."],
    businessRules: ["Zwykły użytkownik nie widzi EventBus, debug, audit log ani statusów developerskich.", "Panel admina wymaga osobnych uprawnień.", "Działania administracyjne są audytowane."],
    triggers: ["wejście admina", "przegląd audytu", "analiza sporu", "kontrola finansowa", "monitoring AI"],
    auditLog: ["wejście do panelu admina", "odczyt audytu", "zmiana decyzji", "akcja compliance"],
    permissions: ["admin.audit.read", "admin.system.manage", "compliance.review", "wallet.platform.read"],
    relatedRoles: ["Właściciel platformy", "Administrator GL", "Operator GL", "Finanse GL", "Compliance GL", "Support GL"],
    relatedModules: ["System", "Audit Log", "AI", "GL Wallet", "Spory"],
    flowSteps: ["Admin otwiera moduł systemowy", "Permission Engine potwierdza poziom dostępu", "Widok pobiera dane techniczne", "Admin wykonuje akcję", "Audit Log zapisuje czynność"]
  }),
  "gl-academy": spec({
    purpose: "Łączy wiedzę GL, profil i reputację z materiałami szkoleniowymi oraz certyfikacją.",
    workflowOrder: ["1. Knowledge Engine dostarcza materiał.", "2. Użytkownik wykonuje lekcję lub test.", "3. Profil i reputacja mogą otrzymać wynik szkolenia."],
    businessRules: ["Akademia nie zastępuje weryfikacji dokumentów.", "Status kursanta zależy od profilu.", "Materiały mogą mieć zakres roli i kraju."],
    triggers: ["rozpoczęcie kursu", "ukończenie lekcji", "zdany test", "aktualizacja materiału"],
    auditLog: ["rozpoczęcie kursu", "wynik testu", "nadanie certyfikatu", "zmiana materiału"],
    permissions: ["academy.read", "academy.learn", "academy.teach", "knowledge.read"],
    relatedRoles: ["Student Akademii GL", "Nauczyciel Akademii GL", "Kierowca", "Przewoźnik"],
    relatedModules: ["Akademia GL", "Profil", "Silnik Wiedzy", "Reputacja"],
    flowSteps: ["Użytkownik otwiera Akademię", "Knowledge dostarcza treść", "Permission Engine sprawdza rolę", "Profil zapisuje postęp", "Reputation może uwzględnić certyfikat"]
  }),
  "gl-jobs": spec({
    purpose: "Planowany moduł rynku pracy powiązany z profilem, firmą i zaufaniem.",
    workflowOrder: ["1. Firma publikuje ofertę pracy lub zlecenie.", "2. Profil kandydata i reputacja określają dopasowanie.", "3. Workflow może tworzyć przyszłe zdarzenia operacyjne."],
    businessRules: ["Moduł przyszły nie wpływa na obecny workflow produkcyjny.", "Oferty muszą być powiązane z firmą i profilem.", "Widoczność zależy od permissions."],
    triggers: ["publikacja oferty", "zgłoszenie kandydata", "aktualizacja profilu zawodowego"],
    auditLog: ["utworzenie oferty", "zgłoszenie", "zmiana statusu rekrutacji"],
    permissions: ["jobs.read", "jobs.manage", "profile.public.read"],
    relatedRoles: ["Właściciel przewoźnika", "Kierowca", "Student Akademii GL", "Support GL"],
    relatedModules: ["Giełda Pracy GL", "Profil", "Firma", "Reputacja"],
    flowSteps: ["Firma publikuje ofertę", "Profile dostarcza dane kandydata", "Permission Engine filtruje widoczność", "Reputation wspiera ocenę", "Workflow może utworzyć przyszłe zadanie"]
  }),
  "gl-fleet-market": spec({
    purpose: "Planowany moduł rynku pojazdów powiązany z firmami, flotą i dokumentami pojazdów.",
    workflowOrder: ["1. Firma wystawia pojazd lub szuka zasobu.", "2. Vehicle Engine dostarcza parametry i dokumenty.", "3. Company Engine potwierdza właściciela i zakres dostępu."],
    businessRules: ["Moduł przyszły nie zmienia aktualnej floty bez zgody firmy.", "Dane pojazdu muszą pochodzić z Vehicle Engine.", "Transakcje przyszłe będą wymagały audytu i permission."],
    triggers: ["wystawienie pojazdu", "zapytanie o pojazd", "aktualizacja statusu floty"],
    auditLog: ["utworzenie oferty pojazdu", "zmiana statusu oferty", "kontakt z właścicielem"],
    permissions: ["fleet_market.read", "fleet_market.manage", "vehicles.manage"],
    relatedRoles: ["Właściciel przewoźnika", "Kierownik floty", "Partner leasingowy", "Właściciel platformy"],
    relatedModules: ["Giełda Pojazdów GL", "Flota", "Moje pojazdy", "Firma"],
    flowSteps: ["Firma wybiera pojazd", "Vehicle Engine dostarcza dane techniczne", "Company Engine potwierdza właściciela", "Permission Engine sprawdza dostęp", "Oferta trafia do modułu przyszłego"]
  })
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
    [
      "id",
      "name",
      "layer",
      "type",
      "description",
      "dependsOn",
      "providesTo",
      "workflowRole",
      "status",
      "files",
      "tests",
      "purpose",
      "workflowOrder",
      "businessRules",
      "triggers",
      "auditLog",
      "permissions",
      "relatedRoles",
      "relatedModules",
      "flowSteps"
    ].forEach((field) => {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        errors.push(`${item.id || "unknown"} nie ma pola ${field}`);
      }
    });

    ["workflowOrder", "businessRules", "triggers", "auditLog", "permissions", "relatedRoles", "relatedModules", "flowSteps"].forEach((field) => {
      if (!Array.isArray(item[field]) || item[field].length === 0) {
        errors.push(`${item.id || "unknown"} nie ma kompletnej listy ${field}`);
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

function spec(input) {
  return Object.freeze({
    purpose: input.purpose,
    workflowOrder: Object.freeze(input.workflowOrder || []),
    businessRules: Object.freeze(input.businessRules || []),
    triggers: Object.freeze(input.triggers || []),
    auditLog: Object.freeze(input.auditLog || []),
    permissions: Object.freeze(input.permissions || []),
    relatedRoles: Object.freeze(input.relatedRoles || []),
    relatedModules: Object.freeze(input.relatedModules || []),
    flowSteps: Object.freeze(input.flowSteps || [])
  });
}

function rel(from, to, label, type = "info") {
  return Object.freeze({ from, to, label, type });
}

function engine(input) {
  const documentation = engineDocumentation[input.id] || docs(EngineStatuses.IN_PROGRESS, [], []);
  const specification = engineSpecificationDetails[input.id] || spec({
    purpose: input.description || input.workflowRole || input.name,
    workflowOrder: [input.workflowRole || input.name],
    businessRules: ["Silnik działa wyłącznie w aktywnym kontekście GL."],
    triggers: ["zdarzenie systemowe GL"],
    auditLog: ["zdarzenie silnika"],
    permissions: ["modules.read"],
    relatedRoles: ["Uprawnione role GL"],
    relatedModules: [input.name],
    flowSteps: [input.name, "Permission Engine", "Audit Log"]
  });
  return Object.freeze({
    ...input,
    purpose: input.purpose || specification.purpose || input.description || "",
    status: input.status || documentation.status,
    files: Object.freeze(input.files || documentation.files || []),
    tests: Object.freeze(input.tests || documentation.tests || []),
    responsibility: input.responsibility || input.workflowRole || "",
    inputs: Object.freeze(input.inputs || input.dependsOn || []),
    outputs: Object.freeze(input.outputs || input.providesTo || []),
    usedBy: Object.freeze(input.usedBy || input.providesTo || []),
    workflowOrder: Object.freeze(input.workflowOrder || specification.workflowOrder || []),
    businessRules: Object.freeze(input.businessRules || specification.businessRules || []),
    triggers: Object.freeze(input.triggers || specification.triggers || []),
    auditLog: Object.freeze(input.auditLog || specification.auditLog || []),
    permissions: Object.freeze(input.permissions || specification.permissions || []),
    relatedRoles: Object.freeze(input.relatedRoles || specification.relatedRoles || []),
    relatedModules: Object.freeze(input.relatedModules || specification.relatedModules || []),
    flowSteps: Object.freeze(input.flowSteps || specification.flowSteps || []),
    dependsOn: Object.freeze(input.dependsOn || []),
    providesTo: Object.freeze(input.providesTo || []),
    mapPosition: Object.freeze(input.mapPosition || [0, 0, 0])
  });
}
