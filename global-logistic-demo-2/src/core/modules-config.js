import { Roles } from "./constants.js";

export const FinancePermissions = Object.freeze({
  WALLET_OWN_READ: "wallet.own.read",
  WALLET_OWN_MANAGE: "wallet.own.manage",
  WALLET_PLATFORM_READ: "wallet.platform.read",
  WALLET_PLATFORM_MANAGE: "wallet.platform.manage",
  BILLING_OWN_READ: "billing.own.read",
  INVOICES_OWN_READ: "invoices.own.read",
  SETTLEMENTS_OWN_READ: "settlements.own.read",
  ESCROW_OWN_READ: "escrow.own.read",
  ESCROW_MANAGE: "escrow.manage",
  PAYOUTS_OWN_READ: "payouts.own.read",
  PAYOUTS_MANAGE: "payouts.manage",
  FINANCE_AUDIT_READ: "finance.audit.read"
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
  PROFILE: "module.profile",
  SETTINGS: "module.settings",
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
    ...clientRoles, ...dispatcherRoles
  ], "Tworzenie i publikacja ladunkow."),
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
  moduleItem("trust", "Reputacja GL", "TS", "/trust", "trust", ModulePermissions.TRUST, [
    ...clientRoles, ...carrierRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.SECURITY,
    Roles.CUSTOMS_AGENT, Roles.FERRY_OPERATOR, ...complianceRoles
  ], "Reputacja firm, kierowcow i partnerow."),
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
  moduleItem("profile", "Profil", "PR", "/profile", "profile", ModulePermissions.PROFILE, allRoles, "Profil aktywnego uzytkownika."),
  moduleItem("settings", "Ustawienia", "ST", "/settings", "admin", ModulePermissions.SETTINGS, [], "Ustawienia systemowe dla administracji."),
  moduleItem("security", "Ochrona / brama", "SE", "/security", "security", ModulePermissions.SECURITY, [Roles.SECURITY], "Kontrola bramy i skan tablic."),
  moduleItem("customs", "Odprawy celne", "CU", "/customs", "customs", ModulePermissions.CUSTOMS, [Roles.CUSTOMS_AGENT], "Odprawa, MRN i komunikacja celna."),
  moduleItem("authority", "Kontrole drogowe", "AU", "/authority", "authority", ModulePermissions.AUTHORITY, [Roles.AUTHORITY_USER, ...complianceRoles], "Dostep organow kontrolnych."),
  moduleItem("intermodal", "Prom / kolej", "IM", "/intermodal", "ferry", ModulePermissions.INTERMODAL, [Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...carrierRoles, Roles.DRIVER], "Prom, kolej i terminal."),
  moduleItem("ai", "Kontrola AI", "AI", "/ai", "ai", ModulePermissions.AI, [Roles.SUPPORT_AGENT, ...complianceRoles], "Alerty AI i kontrola ryzyka."),
  moduleItem("audit", "Audit Log", "AL", "/audit", "audit", ModulePermissions.AUDIT, [Roles.PAYMENT_OPERATOR, ...platformWalletRoles, ...complianceRoles], "Historia zdarzen i decyzji."),
  moduleItem("system", "System", "SY", "/system", "system", ModulePermissions.SYSTEM, [], "Stan systemu i konfiguracja platformy."),
  moduleItem("system-tests", "Testy systemu", "QA", "/system-tests", "system_tests", ModulePermissions.SYSTEM, [], "Testy odpornosci demo.")
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
    ModulePermissions.AUDIT,
    ModulePermissions.RISK
  ]
};

export function permissionsForRole(role, user = {}) {
  const configured = modulesConfig
    .filter((module) => module.allowedRoles.includes(role))
    .flatMap((module) => module.requiredPermissions);
  return [...new Set([...(explicitPermissionsByRole[role] || []), ...configured, ...(user.permissions || [])])];
}

export function getVisibleModules(user = {}, activeRole = user.role) {
  const permissions = permissionsForRole(activeRole, user);
  return modulesConfig.filter((module) => moduleIsAllowed(module, activeRole, permissions));
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
  if (!moduleIsAllowed(module, activeRole, permissions)) {
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

function moduleIsAllowed(module, role, permissions) {
  const hasPermissions = module.requiredPermissions.every((permission) => permissions.includes(permission));
  return hasPermissions && (module.allowedRoles.includes(role) || module.allowPermissionOverride);
}
