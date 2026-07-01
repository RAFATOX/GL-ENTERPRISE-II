import { CompanyRoleNames, CompanyTypes, Roles } from "./constants.js";

export const FinancePermissions = Object.freeze({
  WALLET_OWN_READ: "wallet.own.read",
  WALLET_OWN_MANAGE: "wallet.own.manage",
  WALLET_COMPANY_READ: "wallet.company.read",
  WALLET_COMPANY_MANAGE: "wallet.company.manage",
  WALLET_PLATFORM_READ: "wallet.platform.read",
  WALLET_PLATFORM_MANAGE: "wallet.platform.manage",
  BILLING_OWN_READ: "billing.own.read",
  INVOICES_OWN_READ: "invoices.own.read",
  INVOICES_COMPANY_READ: "invoices.company.read",
  SETTLEMENTS_OWN_READ: "settlements.own.read",
  ESCROW_OWN_READ: "escrow.own.read",
  ESCROW_COMPANY_READ: "escrow.company.read",
  ESCROW_MANAGE: "escrow.manage",
  PAYOUTS_OWN_READ: "payouts.own.read",
  PAYOUTS_COMPANY_MANAGE: "payouts.company.manage",
  PAYOUTS_MANAGE: "payouts.manage",
  FINANCE_AUDIT_READ: "finance.audit.read"
});

export const CompanyPermissions = Object.freeze({
  CREATE: "company.create",
  READ: "company.read",
  MANAGE: "company.manage",
  INVITE_USERS: "company.invite_users",
  REMOVE_USERS: "company.remove_users",
  EMPLOYEES_READ: "company.employees.read",
  EMPLOYEES_MANAGE: "company.employees.manage",
  EMPLOYEES_INVITE: "company.employees.invite",
  EMPLOYEES_REMOVE: "company.employees.remove",
  EMPLOYEES_ASSIGN_ROLE: "company.employees.assign_role",
  DOCUMENTS_UPLOAD: "company.documents.upload",
  DOCUMENTS_VERIFY_STATUS_READ: "company.documents.verify_status_read"
});

export const LoadPermissions = Object.freeze({
  CREATE: "loads.create",
  ACCEPT: "loads.accept",
  ASSIGN_DRIVER: "loads.assign_driver",
  VIEW_OWN: "loads.view_own",
  VIEW_COMPANY: "loads.view_company",
  MANAGE_COMPANY: "loads.manage_company"
});

export const VehiclePermissions = Object.freeze({
  CREATE: "vehicles.create",
  MANAGE: "vehicles.manage"
});

export const DriverPermissions = Object.freeze({
  ASSIGN: "drivers.assign",
  MANAGE: "drivers.manage"
});

export const DocumentPermissions = Object.freeze({
  UPLOAD: "documents.upload",
  APPROVE: "documents.approve"
});

export const AdminPermissions = Object.freeze({
  AUDIT_READ: "admin.audit.read"
});

export const CompliancePermissions = Object.freeze({
  REVIEW: "compliance.review",
  SUSPEND_USER: "compliance.suspend_user",
  SUSPEND_COMPANY: "compliance.suspend_company"
});

export const KnowledgePermissions = Object.freeze({
  READ: "knowledge.read",
  MANAGE: "knowledge.manage",
  SOURCE_CREATE: "knowledge.source.create",
  SOURCE_UPDATE: "knowledge.source.update",
  SOURCE_ARCHIVE: "knowledge.source.archive",
  COMPLIANCE_READ: "knowledge.compliance.read",
  ACADEMY_READ: "knowledge.academy.read"
});

export const ModulePermissions = Object.freeze({
  DASHBOARD: "module.dashboard",
  TRANSPORTS: "module.transports",
  LOADS: "module.loads",
  LIVE_MAP: "module.live_map",
  GPS: "module.gps",
  PHOTOS: "module.photos",
  DOCUMENTS: "module.documents",
  PARKING: "module.parking",
  CHAT: "module.chat",
  JOBS: "module.jobs",
  ACADEMY: "module.academy",
  TRUST: "module.trust",
  WALLET: FinancePermissions.WALLET_OWN_READ,
  BILLING: FinancePermissions.BILLING_OWN_READ,
  INVOICES: FinancePermissions.INVOICES_OWN_READ,
  POLICIES: "module.policies",
  CLAIMS: "module.claims",
  RISK: "module.risk",
  SERVICE_ORDERS: "module.service_orders",
  REPORTS: "module.reports",
  COMPANY: "module.company",
  EMPLOYEES: "module.employees",
  PROFILE: "module.profile",
  SETTINGS: "module.settings",
  KNOWLEDGE: KnowledgePermissions.READ,
  SECURITY: "module.security",
  CUSTOMS: "module.customs",
  AUTHORITY: "module.authority",
  INTERMODAL: "module.intermodal",
  AI: "module.ai",
  AUDIT: "module.audit",
  SYSTEM: "module.system"
});

export const platformWalletRoles = Object.freeze([
  Roles.PLATFORM_OWNER,
  Roles.GL_OPERATOR,
  Roles.ADMIN_FINANCE
]);

const platformControlRoles = [Roles.PLATFORM_OWNER, Roles.SUPER_ADMIN, Roles.ADMIN];
const clientRoles = [Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER];
const carrierRoles = [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER];
const dispatcherRoles = [Roles.CLIENT_DISPATCHER, Roles.CARRIER_DISPATCHER];
const serviceRoles = [Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE];
const academyRoles = [Roles.ACADEMY_TEACHER, Roles.ACADEMY_STUDENT];
const complianceRoles = [Roles.COMPLIANCE, Roles.READONLY_AUDITOR];
const insurerRoles = [Roles.INSURANCE_PARTNER];
export const ownWalletRoles = Object.freeze([
  Roles.CLIENT_OWNER,
  Roles.CARRIER_OWNER,
  ...insurerRoles,
  ...serviceRoles
]);
const walletRouteRoles = [...platformWalletRoles, ...ownWalletRoles];
const billingRoles = [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, ...insurerRoles, ...serviceRoles, Roles.PAYMENT_OPERATOR];
const invoiceRoles = [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, ...insurerRoles, ...serviceRoles];
const allRoles = [...new Set(Object.values(Roles))];

function withPlatformControl(roles = []) {
  return [...new Set([...platformControlRoles, ...roles])];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function moduleItem(id, label, icon, route, view, permission, roles, description, options = {}) {
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  const allowedRoles = options.includePlatformControl === false
    ? unique(roles)
    : withPlatformControl(roles);
  return Object.freeze({
    id,
    label,
    icon,
    route,
    view,
    requiredPermissions,
    allowedRoles,
    allowPermissionOverride: Boolean(options.allowPermissionOverride),
    labelByRole: Object.freeze(options.labelByRole || {}),
    descriptionByRole: Object.freeze(options.descriptionByRole || {}),
    description
  });
}

export const modulesConfig = Object.freeze([
  moduleItem("dashboard", "Pulpit", "DB", "/dashboard", "dashboard", ModulePermissions.DASHBOARD, allRoles, "Jedno glowne wejscie do aplikacji modulowej."),
  moduleItem("transports", "Transporty", "TR", "/transports", "transports", ModulePermissions.TRANSPORTS, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER,
    Roles.PAYMENT_OPERATOR, Roles.SECURITY, Roles.CUSTOMS_AGENT, Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR,
    Roles.RAIL_OPERATOR, Roles.SUPPORT_AGENT, ...complianceRoles, ...platformWalletRoles
  ], "Transporty dostepne dla aktywnej roli."),
  moduleItem("loads", "Ladunki", "LD", "/loads", "create", ModulePermissions.LOADS, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles
  ], "Tworzenie, wyszukiwanie i przyjmowanie ladunkow.", {
    labelByRole: {
      [Roles.CARRIER_OWNER]: "Szukaj ladunkow",
      [Roles.CARRIER_DISPATCHER]: "Szukaj ladunkow"
    },
    descriptionByRole: {
      [Roles.CARRIER_OWNER]: "Opublikowane ladunki, escrow i przypisanie kierowcy oraz pojazdu.",
      [Roles.CARRIER_DISPATCHER]: "Opublikowane ladunki, escrow i przypisanie kierowcy oraz pojazdu."
    }
  }),
  moduleItem("map", "Mapa", "MP", "/map", "live_map", ModulePermissions.LIVE_MAP, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.PAYMENT_OPERATOR,
    Roles.SECURITY, Roles.CUSTOMS_AGENT, Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR
  ], "Mapa operacyjna transportow."),
  moduleItem("gps", "GL GPS", "GP", "/gps", "gps", ModulePermissions.GPS, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.SECURITY,
    Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR
  ], "Punkty GPS i ETA transportu."),
  moduleItem("photos", "Zdjecia GL", "PH", "/photos", "photos", ModulePermissions.PHOTOS, [
    ...clientRoles, ...carrierRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER
  ], "Dowody zdjeciowe przypisane do transportu."),
  moduleItem("documents", "Dokumenty", "DC", "/documents", "documents", ModulePermissions.DOCUMENTS, [
    ...clientRoles, ...carrierRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, ...insurerRoles, Roles.CUSTOMS_AGENT,
    Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR, ...complianceRoles
  ], "CMR, dokumenty transportowe i dokumenty spraw."),
  moduleItem("parking", "Parkingi na zywo", "PK", "/parking", "parking", ModulePermissions.PARKING, [
    ...carrierRoles, ...dispatcherRoles, Roles.DRIVER
  ], "Parkingi, wolne miejsca i raporty kierowcow."),
  moduleItem("chat", "Czat GL", "CH", "/chat", "communication", ModulePermissions.CHAT, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER,
    Roles.SECURITY, Roles.CUSTOMS_AGENT, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, Roles.SUPPORT_AGENT
  ], "Komunikacja operacyjna i tlumaczenia."),
  moduleItem("jobs", "Zlecenia GL", "JB", "/jobs", "jobs", ModulePermissions.JOBS, [
    ...carrierRoles, ...dispatcherRoles, Roles.DRIVER
  ], "Zadania kierowcow i czas pracy."),
  moduleItem("academy", "Akademia GL", "AC", "/academy", "academy", ModulePermissions.ACADEMY, [
    ...academyRoles
  ], "Szkolenia, materialy i role akademii."),
  moduleItem("wallet", "Portfel", "WL", "/wallet", "wallet", ModulePermissions.WALLET, walletRouteRoles, "Portfel lub rozliczenia widoczne zgodnie z rola i wlascicielem danych.", {
    includePlatformControl: false,
    labelByRole: {
      [Roles.PLATFORM_OWNER]: "Portfel GL",
      [Roles.GL_OPERATOR]: "Portfel GL",
      [Roles.ADMIN_FINANCE]: "Portfel platformy",
      [Roles.CLIENT_OWNER]: "Moj portfel",
      [Roles.CARRIER_OWNER]: "Moj portfel",
      [Roles.INSURANCE_PARTNER]: "Rozliczenia polis",
      [Roles.WORKSHOP]: "Rozliczenia serwisowe",
      [Roles.MOBILE_SERVICE]: "Rozliczenia serwisowe",
      [Roles.ROADSIDE_ASSISTANCE]: "Rozliczenia serwisowe"
    },
    descriptionByRole: {
      [Roles.PLATFORM_OWNER]: "PlatformWallet: saldo GL, escrow, prowizje, wyplaty i audit finansowy.",
      [Roles.GL_OPERATOR]: "PlatformWallet: saldo GL, escrow, prowizje, wyplaty i audit finansowy.",
      [Roles.ADMIN_FINANCE]: "PlatformWallet: saldo GL, escrow, prowizje, wyplaty i audit finansowy.",
      [Roles.CLIENT_OWNER]: "Indywidualny portfel klienta, platnosci i escrow wlasnych transportow.",
      [Roles.CARRIER_OWNER]: "Indywidualny portfel przewoznika, naleznosci i status wyplat.",
      [Roles.INSURANCE_PARTNER]: "Rozliczenia polis bez salda platformy GL.",
      [Roles.WORKSHOP]: "Rozliczenia uslug serwisowych bez salda platformy GL.",
      [Roles.MOBILE_SERVICE]: "Rozliczenia uslug serwisowych bez salda platformy GL.",
      [Roles.ROADSIDE_ASSISTANCE]: "Rozliczenia uslug serwisowych bez salda platformy GL."
    }
  }),
  moduleItem("billing", "Rozliczenia", "BR", "/billing", "billing", ModulePermissions.BILLING, billingRoles, "Rozliczenia wlasne bez osobnego panelu roli.", {
    allowPermissionOverride: true
  }),
  moduleItem("invoices", "Faktury", "FV", "/invoices", "invoices", ModulePermissions.INVOICES, invoiceRoles, "Faktury przypisane do wlasnych transportow, polis lub uslug.", {
    allowPermissionOverride: true
  }),
  moduleItem("policies", "Polisy", "PL", "/policies", "policies", ModulePermissions.POLICIES, [
    ...insurerRoles, Roles.CLIENT_OWNER, Roles.CARRIER_OWNER
  ], "Polisy transportowe i status ochrony."),
  moduleItem("claims", "Zgloszenia szkod", "CL", "/claims", "claims", ModulePermissions.CLAIMS, [
    ...insurerRoles, Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.SUPPORT_AGENT
  ], "Roszczenia, szkody i paczki dowodowe."),
  moduleItem("risk", "Ocena ryzyka", "RK", "/risk", "risk", ModulePermissions.RISK, [
    ...insurerRoles, Roles.CARRIER_OWNER, Roles.CLIENT_OWNER, ...complianceRoles, Roles.SUPPORT_AGENT
  ], "Ryzyko transportu, AI i dokumenty spraw."),
  moduleItem("service-orders", "Zlecenia serwisowe", "SV", "/service-orders", "service_orders", ModulePermissions.SERVICE_ORDERS, [
    ...serviceRoles, ...carrierRoles, Roles.DRIVER
  ], "Warsztat, serwis mobilny i pomoc drogowa."),
  moduleItem("reports", "Raporty i analizy", "RP", "/reports", "statistics", ModulePermissions.REPORTS, [
    Roles.PAYMENT_OPERATOR, Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, ...platformWalletRoles, ...complianceRoles
  ], "Statystyki, raporty i eksport demo."),
  moduleItem("company", "Moja firma", "CO", "/company", "companies", ModulePermissions.COMPANY, [
    ...clientRoles, ...carrierRoles, Roles.WAREHOUSE_WORKER, Roles.PAYMENT_OPERATOR,
    Roles.CUSTOMS_AGENT, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...complianceRoles
  ], "Profil firmy i uczestnicy ekosystemu."),
  moduleItem("employees", "Pracownicy", "HR", "/employees", "employees", CompanyPermissions.EMPLOYEES_READ, [
    ...carrierRoles
  ], "Pracownicy firmy, kandydaci demo i przypisanie do aktywnej firmy.", {
    allowPermissionOverride: true
  }),
  moduleItem("profile", "Profil", "PR", "/profile", "profile", ModulePermissions.PROFILE, allRoles, "Profil aktywnego uzytkownika."),
  moduleItem("knowledge", "Biblioteka wiedzy GL", "KN", "/knowledge", "knowledge", ModulePermissions.KNOWLEDGE, [
    Roles.PLATFORM_OWNER, Roles.GL_OPERATOR, Roles.COMPLIANCE, Roles.ACADEMY_TEACHER
  ], "Centralny rejestr zrodel wiedzy, regulacji i materialow GL."),
  moduleItem("settings", "Ustawienia", "ST", "/settings", "admin", ModulePermissions.SETTINGS, [], "Ustawienia systemowe dla administracji."),
  moduleItem("security", "Ochrona / brama", "SE", "/security", "security", ModulePermissions.SECURITY, [Roles.SECURITY], "Kontrola bramy i skan tablic."),
  moduleItem("customs", "Odprawy celne", "CU", "/customs", "customs", ModulePermissions.CUSTOMS, [Roles.CUSTOMS_AGENT], "Odprawa, MRN i komunikacja celna."),
  moduleItem("authority", "Kontrole drogowe", "AU", "/authority", "authority", ModulePermissions.AUTHORITY, [Roles.AUTHORITY_USER, ...complianceRoles], "Dostep organow kontrolnych."),
  moduleItem("intermodal", "Prom / kolej", "IM", "/intermodal", "ferry", ModulePermissions.INTERMODAL, [Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...carrierRoles, Roles.DRIVER], "Prom, kolej i terminal."),
  moduleItem("ai", "Kontrola AI", "AI", "/ai", "ai", ModulePermissions.AI, [Roles.SUPPORT_AGENT, ...complianceRoles], "Alerty AI i kontrola ryzyka."),
  moduleItem("audit", "Dziennik audytu", "AL", "/audit", "audit", ModulePermissions.AUDIT, [Roles.GL_OPERATOR, Roles.ADMIN_FINANCE], "Historia zdarzen i decyzji."),
  moduleItem("system", "System", "SY", "/system", "system", ModulePermissions.SYSTEM, [Roles.GL_OPERATOR, Roles.ADMIN_FINANCE], "Stan systemu i konfiguracja platformy."),
  moduleItem("system-tests", "Testy systemu", "QA", "/system-tests", "system_tests", ModulePermissions.SYSTEM, [Roles.GL_OPERATOR, Roles.ADMIN_FINANCE], "Testy odpornosci demo.")
]);

const explicitPermissionsByRole = {
  [Roles.PLATFORM_OWNER]: [
    FinancePermissions.WALLET_OWN_MANAGE,
    FinancePermissions.WALLET_PLATFORM_READ,
    FinancePermissions.WALLET_PLATFORM_MANAGE,
    FinancePermissions.ESCROW_MANAGE,
    FinancePermissions.PAYOUTS_MANAGE,
    FinancePermissions.FINANCE_AUDIT_READ
  ],
  [Roles.GL_OPERATOR]: [
    FinancePermissions.WALLET_OWN_MANAGE,
    FinancePermissions.WALLET_PLATFORM_READ,
    FinancePermissions.WALLET_PLATFORM_MANAGE,
    FinancePermissions.ESCROW_MANAGE,
    FinancePermissions.PAYOUTS_MANAGE,
    FinancePermissions.FINANCE_AUDIT_READ
  ],
  [Roles.ADMIN_FINANCE]: [
    FinancePermissions.WALLET_OWN_MANAGE,
    FinancePermissions.WALLET_PLATFORM_READ,
    FinancePermissions.WALLET_PLATFORM_MANAGE,
    FinancePermissions.ESCROW_MANAGE,
    FinancePermissions.PAYOUTS_MANAGE,
    FinancePermissions.FINANCE_AUDIT_READ
  ],
  [Roles.CLIENT_OWNER]: [
    FinancePermissions.WALLET_OWN_MANAGE,
    FinancePermissions.ESCROW_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ
  ],
  [Roles.CARRIER_OWNER]: [
    FinancePermissions.WALLET_OWN_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.PAYOUTS_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ
  ],
  [Roles.INSURANCE_PARTNER]: [
    FinancePermissions.WALLET_OWN_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ
  ],
  [Roles.WORKSHOP]: [
    FinancePermissions.WALLET_OWN_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.PAYOUTS_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ
  ],
  [Roles.MOBILE_SERVICE]: [
    FinancePermissions.WALLET_OWN_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.PAYOUTS_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ
  ],
  [Roles.ROADSIDE_ASSISTANCE]: [
    FinancePermissions.WALLET_OWN_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.PAYOUTS_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ
  ],
  [Roles.PAYMENT_OPERATOR]: [FinancePermissions.PAYOUTS_MANAGE],
  [Roles.ACADEMY_STUDENT]: [ModulePermissions.DASHBOARD, ModulePermissions.ACADEMY, ModulePermissions.PROFILE],
  [Roles.ACADEMY_TEACHER]: [ModulePermissions.DASHBOARD, ModulePermissions.ACADEMY, ModulePermissions.PROFILE, ModulePermissions.REPORTS],
  [Roles.COMPLIANCE]: [
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    ModulePermissions.AUTHORITY,
    ModulePermissions.AI,
    ModulePermissions.RISK,
    ModulePermissions.KNOWLEDGE,
    KnowledgePermissions.MANAGE,
    KnowledgePermissions.SOURCE_CREATE,
    KnowledgePermissions.SOURCE_UPDATE,
    KnowledgePermissions.SOURCE_ARCHIVE,
    KnowledgePermissions.COMPLIANCE_READ
  ]
};

export const PrivateContextPermissions = Object.freeze([
  ModulePermissions.DASHBOARD,
  ModulePermissions.PROFILE,
  CompanyPermissions.CREATE
]);

export const PrivateRolePermissionMap = Object.freeze({
  [Roles.ACADEMY_STUDENT]: unique([
    ...PrivateContextPermissions,
    ModulePermissions.ACADEMY
  ]),
  [Roles.ACADEMY_TEACHER]: unique([
    ...PrivateContextPermissions,
    ModulePermissions.ACADEMY,
    ModulePermissions.REPORTS,
    ModulePermissions.KNOWLEDGE,
    KnowledgePermissions.ACADEMY_READ
  ])
});

export const PlatformRolePermissionMap = Object.freeze({
  [Roles.PLATFORM_OWNER]: unique([
    ...Object.values(ModulePermissions),
    ...Object.values(CompanyPermissions),
    ...Object.values(LoadPermissions),
    ...Object.values(VehiclePermissions),
    ...Object.values(DriverPermissions),
    ...Object.values(DocumentPermissions),
    ...Object.values(FinancePermissions),
    ...Object.values(AdminPermissions),
    ...Object.values(CompliancePermissions),
    ...Object.values(KnowledgePermissions)
  ]),
  [Roles.GL_OPERATOR]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    ModulePermissions.WALLET,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.AUTHORITY,
    ModulePermissions.AI,
    ModulePermissions.AUDIT,
    ModulePermissions.SYSTEM,
    CompanyPermissions.READ,
    CompanyPermissions.MANAGE,
    FinancePermissions.WALLET_PLATFORM_READ,
    FinancePermissions.WALLET_PLATFORM_MANAGE,
    FinancePermissions.ESCROW_MANAGE,
    FinancePermissions.PAYOUTS_MANAGE,
    FinancePermissions.FINANCE_AUDIT_READ,
    AdminPermissions.AUDIT_READ,
    CompliancePermissions.REVIEW,
    CompliancePermissions.SUSPEND_COMPANY,
    CompliancePermissions.SUSPEND_USER,
    ModulePermissions.KNOWLEDGE,
    ...Object.values(KnowledgePermissions)
  ]),
  [Roles.ADMIN_FINANCE]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.REPORTS,
    ModulePermissions.PROFILE,
    ModulePermissions.WALLET,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.AUDIT,
    ModulePermissions.SYSTEM,
    FinancePermissions.WALLET_PLATFORM_READ,
    FinancePermissions.WALLET_PLATFORM_MANAGE,
    FinancePermissions.ESCROW_MANAGE,
    FinancePermissions.PAYOUTS_MANAGE,
    FinancePermissions.FINANCE_AUDIT_READ,
    AdminPermissions.AUDIT_READ
  ]),
  [Roles.SUPER_ADMIN]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LOADS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.PHOTOS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.PARKING,
    ModulePermissions.CHAT,
    ModulePermissions.JOBS,
    ModulePermissions.ACADEMY,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    ModulePermissions.SETTINGS,
    ModulePermissions.SECURITY,
    ModulePermissions.CUSTOMS,
    ModulePermissions.AUTHORITY,
    ModulePermissions.INTERMODAL,
    ModulePermissions.AI,
    ModulePermissions.AUDIT,
    ModulePermissions.SYSTEM,
    ...Object.values(CompanyPermissions),
    ...Object.values(LoadPermissions),
    ...Object.values(VehiclePermissions),
    ...Object.values(DriverPermissions),
    ...Object.values(DocumentPermissions),
    AdminPermissions.AUDIT_READ,
    CompliancePermissions.REVIEW,
    CompliancePermissions.SUSPEND_COMPANY,
    CompliancePermissions.SUSPEND_USER
  ]),
  [Roles.ADMIN]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LOADS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.PHOTOS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.PARKING,
    ModulePermissions.CHAT,
    ModulePermissions.JOBS,
    ModulePermissions.ACADEMY,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    ModulePermissions.SETTINGS,
    ModulePermissions.SECURITY,
    ModulePermissions.CUSTOMS,
    ModulePermissions.AUTHORITY,
    ModulePermissions.INTERMODAL,
    ModulePermissions.AI,
    ModulePermissions.AUDIT,
    ModulePermissions.SYSTEM,
    CompanyPermissions.READ,
    CompanyPermissions.MANAGE,
    CompanyPermissions.INVITE_USERS,
    CompanyPermissions.DOCUMENTS_VERIFY_STATUS_READ,
    LoadPermissions.VIEW_COMPANY,
    LoadPermissions.MANAGE_COMPANY,
    DocumentPermissions.APPROVE,
    AdminPermissions.AUDIT_READ,
    CompliancePermissions.REVIEW,
    CompliancePermissions.SUSPEND_COMPANY,
    CompliancePermissions.SUSPEND_USER
  ]),
  [Roles.COMPLIANCE]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    ModulePermissions.AUTHORITY,
    ModulePermissions.AI,
    ModulePermissions.RISK,
    CompanyPermissions.READ,
    LoadPermissions.VIEW_COMPANY,
    CompliancePermissions.REVIEW,
    CompliancePermissions.SUSPEND_COMPANY,
    CompliancePermissions.SUSPEND_USER,
    ModulePermissions.KNOWLEDGE,
    KnowledgePermissions.MANAGE,
    KnowledgePermissions.SOURCE_CREATE,
    KnowledgePermissions.SOURCE_UPDATE,
    KnowledgePermissions.SOURCE_ARCHIVE,
    KnowledgePermissions.COMPLIANCE_READ
  ]),
  [Roles.SUPPORT_AGENT]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.CHAT,
    ModulePermissions.PROFILE,
    ModulePermissions.AI,
    ModulePermissions.RISK,
    LoadPermissions.VIEW_COMPANY,
    CompliancePermissions.REVIEW
  ]),
  [Roles.READONLY_AUDITOR]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.PROFILE,
    LoadPermissions.VIEW_COMPANY
  ])
});

const operationalCompanyPermissions = [
  ModulePermissions.DASHBOARD,
  ModulePermissions.TRANSPORTS,
  ModulePermissions.LIVE_MAP,
  ModulePermissions.GPS,
  ModulePermissions.PHOTOS,
  ModulePermissions.DOCUMENTS,
  ModulePermissions.PARKING,
  ModulePermissions.CHAT,
  ModulePermissions.JOBS,
  ModulePermissions.PROFILE,
  CompanyPermissions.READ,
  LoadPermissions.VIEW_COMPANY,
  DocumentPermissions.UPLOAD
];

export const CompanyRolePermissionMap = Object.freeze({
  [CompanyRoleNames.OWNER]: unique([
    ...operationalCompanyPermissions,
    ModulePermissions.LOADS,
    ModulePermissions.WALLET,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.EMPLOYEES,
    CompanyPermissions.MANAGE,
    CompanyPermissions.INVITE_USERS,
    CompanyPermissions.REMOVE_USERS,
    CompanyPermissions.EMPLOYEES_READ,
    CompanyPermissions.EMPLOYEES_MANAGE,
    CompanyPermissions.EMPLOYEES_INVITE,
    CompanyPermissions.EMPLOYEES_REMOVE,
    CompanyPermissions.EMPLOYEES_ASSIGN_ROLE,
    CompanyPermissions.DOCUMENTS_UPLOAD,
    CompanyPermissions.DOCUMENTS_VERIFY_STATUS_READ,
    LoadPermissions.CREATE,
    LoadPermissions.ACCEPT,
    LoadPermissions.ASSIGN_DRIVER,
    LoadPermissions.MANAGE_COMPANY,
    VehiclePermissions.CREATE,
    VehiclePermissions.MANAGE,
    DriverPermissions.ASSIGN,
    DriverPermissions.MANAGE,
    FinancePermissions.WALLET_COMPANY_READ,
    FinancePermissions.WALLET_COMPANY_MANAGE,
    FinancePermissions.WALLET_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ,
    FinancePermissions.INVOICES_COMPANY_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.ESCROW_OWN_READ,
    FinancePermissions.ESCROW_COMPANY_READ,
    FinancePermissions.PAYOUTS_OWN_READ,
    FinancePermissions.PAYOUTS_COMPANY_MANAGE
  ]),
  [CompanyRoleNames.ADMIN]: unique([
    ...operationalCompanyPermissions,
    ModulePermissions.LOADS,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.EMPLOYEES,
    CompanyPermissions.MANAGE,
    CompanyPermissions.INVITE_USERS,
    CompanyPermissions.EMPLOYEES_READ,
    CompanyPermissions.EMPLOYEES_MANAGE,
    CompanyPermissions.EMPLOYEES_INVITE,
    CompanyPermissions.EMPLOYEES_REMOVE,
    CompanyPermissions.EMPLOYEES_ASSIGN_ROLE,
    CompanyPermissions.DOCUMENTS_UPLOAD,
    CompanyPermissions.DOCUMENTS_VERIFY_STATUS_READ,
    LoadPermissions.CREATE,
    LoadPermissions.ACCEPT,
    LoadPermissions.ASSIGN_DRIVER,
    LoadPermissions.MANAGE_COMPANY,
    VehiclePermissions.MANAGE,
    DriverPermissions.ASSIGN,
    DriverPermissions.MANAGE,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_COMPANY_READ,
    FinancePermissions.ESCROW_COMPANY_READ
  ]),
  [CompanyRoleNames.FINANCE]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.WALLET,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    CompanyPermissions.DOCUMENTS_VERIFY_STATUS_READ,
    FinancePermissions.WALLET_COMPANY_READ,
    FinancePermissions.WALLET_OWN_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ,
    FinancePermissions.INVOICES_COMPANY_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.ESCROW_COMPANY_READ,
    FinancePermissions.PAYOUTS_OWN_READ,
    FinancePermissions.PAYOUTS_COMPANY_MANAGE,
    FinancePermissions.FINANCE_AUDIT_READ
  ]),
  [CompanyRoleNames.DISPATCHER]: unique([
    ...operationalCompanyPermissions,
    ModulePermissions.LOADS,
    LoadPermissions.CREATE,
    LoadPermissions.ACCEPT,
    LoadPermissions.ASSIGN_DRIVER,
    LoadPermissions.MANAGE_COMPANY,
    VehiclePermissions.MANAGE,
    DriverPermissions.ASSIGN
  ]),
  [CompanyRoleNames.DRIVER_MANAGER]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.JOBS,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    LoadPermissions.VIEW_COMPANY,
    LoadPermissions.ASSIGN_DRIVER,
    VehiclePermissions.MANAGE,
    DriverPermissions.ASSIGN,
    DriverPermissions.MANAGE,
    CompanyPermissions.INVITE_USERS,
    DocumentPermissions.UPLOAD
  ]),
  [CompanyRoleNames.DRIVER]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.PHOTOS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.PARKING,
    ModulePermissions.CHAT,
    ModulePermissions.JOBS,
    ModulePermissions.PROFILE,
    ModulePermissions.WALLET,
    CompanyPermissions.READ,
    LoadPermissions.VIEW_OWN,
    DocumentPermissions.UPLOAD,
    FinancePermissions.WALLET_OWN_READ
  ]),
  [CompanyRoleNames.FLEET_MANAGER]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.JOBS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    LoadPermissions.VIEW_COMPANY,
    LoadPermissions.ASSIGN_DRIVER,
    VehiclePermissions.MANAGE,
    DriverPermissions.ASSIGN,
    DriverPermissions.MANAGE,
    DocumentPermissions.UPLOAD
  ]),
  [CompanyRoleNames.CARRIER_ACCOUNTANT]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.REPORTS,
    ModulePermissions.COMPANY,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    CompanyPermissions.DOCUMENTS_VERIFY_STATUS_READ,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ,
    FinancePermissions.INVOICES_COMPANY_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.PAYOUTS_OWN_READ
  ]),
  [CompanyRoleNames.COMPANY_EMPLOYEE]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.CHAT,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    LoadPermissions.VIEW_COMPANY,
    DocumentPermissions.UPLOAD
  ]),
  [CompanyRoleNames.WAREHOUSE_MANAGER]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.PHOTOS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.CHAT,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    LoadPermissions.VIEW_COMPANY,
    DocumentPermissions.UPLOAD
  ]),
  [CompanyRoleNames.MECHANIC]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.SERVICE_ORDERS,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    DocumentPermissions.UPLOAD,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ,
    FinancePermissions.PAYOUTS_OWN_READ
  ]),
  [CompanyRoleNames.INSURANCE_MANAGER]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.POLICIES,
    ModulePermissions.CLAIMS,
    ModulePermissions.RISK,
    ModulePermissions.BILLING,
    ModulePermissions.INVOICES,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    DocumentPermissions.UPLOAD,
    FinancePermissions.BILLING_OWN_READ,
    FinancePermissions.INVOICES_OWN_READ,
    FinancePermissions.SETTLEMENTS_OWN_READ
  ]),
  [CompanyRoleNames.EMPLOYEE]: unique([
    ...operationalCompanyPermissions,
    LoadPermissions.VIEW_OWN
  ]),
  [CompanyRoleNames.VIEWER]: unique([
    ModulePermissions.DASHBOARD,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.PROFILE,
    CompanyPermissions.READ,
    LoadPermissions.VIEW_COMPANY
  ])
});

export const CompanyTypePermissionMap = Object.freeze({
  [CompanyTypes.CLIENT]: unique([
    ModulePermissions.LOADS,
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.PHOTOS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.CHAT,
    LoadPermissions.CREATE,
    LoadPermissions.VIEW_COMPANY,
    FinancePermissions.ESCROW_OWN_READ,
    FinancePermissions.ESCROW_COMPANY_READ
  ]),
  [CompanyTypes.CARRIER]: unique([
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.PHOTOS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.PARKING,
    ModulePermissions.CHAT,
    ModulePermissions.JOBS,
    LoadPermissions.ACCEPT,
    LoadPermissions.ASSIGN_DRIVER,
    LoadPermissions.VIEW_COMPANY
  ]),
  [CompanyTypes.WAREHOUSE]: unique([
    ModulePermissions.TRANSPORTS,
    ModulePermissions.LIVE_MAP,
    ModulePermissions.GPS,
    ModulePermissions.PHOTOS,
    ModulePermissions.DOCUMENTS,
    ModulePermissions.CHAT
  ]),
  [CompanyTypes.WORKSHOP]: unique([ModulePermissions.SERVICE_ORDERS, ModulePermissions.BILLING, ModulePermissions.INVOICES]),
  [CompanyTypes.MOBILE_SERVICE]: unique([ModulePermissions.SERVICE_ORDERS, ModulePermissions.BILLING, ModulePermissions.INVOICES]),
  [CompanyTypes.ROADSIDE_ASSISTANCE]: unique([ModulePermissions.SERVICE_ORDERS, ModulePermissions.BILLING, ModulePermissions.INVOICES]),
  [CompanyTypes.INSURER]: unique([ModulePermissions.DOCUMENTS, ModulePermissions.POLICIES, ModulePermissions.CLAIMS, ModulePermissions.RISK, ModulePermissions.BILLING, ModulePermissions.INVOICES]),
  [CompanyTypes.INSURANCE]: unique([ModulePermissions.DOCUMENTS, ModulePermissions.POLICIES, ModulePermissions.CLAIMS, ModulePermissions.RISK, ModulePermissions.BILLING, ModulePermissions.INVOICES]),
  [CompanyTypes.PAYMENT]: unique([ModulePermissions.BILLING, ModulePermissions.INVOICES, ModulePermissions.REPORTS]),
  [CompanyTypes.SECURITY]: unique([ModulePermissions.SECURITY, ModulePermissions.TRANSPORTS, ModulePermissions.LIVE_MAP, ModulePermissions.GPS]),
  [CompanyTypes.CUSTOMS_AGENT]: unique([ModulePermissions.CUSTOMS, ModulePermissions.TRANSPORTS, ModulePermissions.DOCUMENTS, ModulePermissions.CHAT]),
  [CompanyTypes.AUTHORITY]: unique([ModulePermissions.AUTHORITY, ModulePermissions.TRANSPORTS, ModulePermissions.DOCUMENTS]),
  [CompanyTypes.FERRY_OPERATOR]: unique([ModulePermissions.INTERMODAL, ModulePermissions.TRANSPORTS, ModulePermissions.DOCUMENTS, ModulePermissions.CHAT]),
  [CompanyTypes.RAIL_OPERATOR]: unique([ModulePermissions.INTERMODAL, ModulePermissions.TRANSPORTS, ModulePermissions.DOCUMENTS, ModulePermissions.CHAT]),
  [CompanyTypes.ACADEMY_PARTNER]: unique([ModulePermissions.ACADEMY, ModulePermissions.PROFILE])
});

export function permissionsForRole(role, user = {}) {
  if (user.permissionsSource === "company_engine") return unique(user.permissions || []);
  if (Array.isArray(user.permissions) && user.permissions.length) {
    return unique([...(explicitPermissionsByRole[role] || []), ...user.permissions]);
  }
  const configured = modulesConfig
    .filter((module) => module.allowedRoles.includes(role))
    .flatMap((module) => module.requiredPermissions);
  return [...new Set([...(explicitPermissionsByRole[role] || []), ...configured, ...(user.permissions || [])])];
}

export function getVisibleModules(user = {}, activeRole = user.role) {
  const permissions = permissionsForRole(activeRole, user);
  return modulesConfig.filter((module) => moduleIsAllowed(module, activeRole, permissions, user));
}

export function moduleForRoute(route) {
  const normalized = normalizeRoute(route);
  return modulesConfig.find((module) => module.route === normalized) || null;
}

export function moduleForView(view, activeRole = null) {
  const modules = activeRole ? getVisibleModules({ role: activeRole }, activeRole) : modulesConfig;
  return modules.find((module) => module.view === view) || modulesConfig.find((module) => module.view === view) || null;
}

export function canAccessModuleView(user = {}, activeRole = user.role, view, route = null) {
  const module = route ? moduleForRoute(route) : moduleForView(view);
  if (!module || module.view !== view) {
    return { ok: false, reason: `module route not found for ${route || view}` };
  }
  const permissions = permissionsForRole(activeRole, user);
  if (!moduleIsAllowed(module, activeRole, permissions, user)) {
    return { ok: false, reason: `${activeRole} has no access to module ${module.label}` };
  }
  return { ok: true, module };
}

export function firstModuleForRole(role) {
  return getVisibleModules({ role }, role)[0] || modulesConfig[0];
}

export function routeForView(view, role = null) {
  return moduleForView(view, role)?.route || "/dashboard";
}

export function normalizeRoute(route = "") {
  const noHash = String(route || "").replace(/^#/, "");
  if (!noHash || noHash === "/") return "/dashboard";
  return noHash.startsWith("/") ? noHash : `/${noHash}`;
}

function moduleIsAllowed(module, role, permissions, user = {}) {
  const hasPermissions = module.requiredPermissions.every((permission) => permissions.includes(permission));
  if (hasPermissions && user.permissionsSource === "company_engine") return true;
  return hasPermissions && (module.allowedRoles.includes(role) || module.allowPermissionOverride);
}
