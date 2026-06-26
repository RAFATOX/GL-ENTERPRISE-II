import { Roles } from "./constants.js";

export const ModulePermissions = Object.freeze({
  DASHBOARD: "module.dashboard",
  TRANSPORTS: "module.transports",
  LOADS: "module.loads",
  LIVE_MAP: "module.live_map",
  GPS: "module.gps",
  DRIVER_PANEL: "module.driver_panel",
  PHOTOS: "module.photos",
  DOCUMENTS: "module.documents",
  PARKING: "module.parking",
  CHAT: "module.chat",
  JOBS: "module.jobs",
  ACADEMY: "module.academy",
  TRUST: "module.trust",
  WALLET: "module.wallet",
  INSURANCE: "module.insurance",
  REPORTS: "module.reports",
  COMPANY: "module.company",
  PROFILE: "module.profile",
  SETTINGS: "module.settings",
  SECURITY: "module.security",
  CUSTOMS: "module.customs",
  AUTHORITY: "module.authority",
  INTERMODAL: "module.intermodal",
  SERVICE: "module.service",
  AI: "module.ai",
  AUDIT: "module.audit",
  SYSTEM: "module.system"
});

const adminRoles = [Roles.PLATFORM_OWNER, Roles.SUPER_ADMIN, Roles.ADMIN];
const clientRoles = [Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER];
const carrierRoles = [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER];
const dispatcherRoles = [Roles.CLIENT_DISPATCHER, Roles.CARRIER_DISPATCHER];
const serviceRoles = [Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE];
const academyRoles = [Roles.ACADEMY_TEACHER, Roles.ACADEMY_STUDENT];
const complianceRoles = [Roles.COMPLIANCE, Roles.READONLY_AUDITOR];
const allRoles = [...new Set(Object.values(Roles))];

function withAdmin(roles = []) {
  return [...new Set([...adminRoles, ...roles])];
}

function moduleItem(id, label, icon, route, view, permission, roles, description) {
  return Object.freeze({
    id,
    label,
    icon,
    route,
    view,
    requiredPermissions: [permission],
    allowedRoles: withAdmin(roles),
    description
  });
}

export const modulesConfig = Object.freeze([
  moduleItem("dashboard", "Dashboard", "DB", "/dashboard", "dashboard", ModulePermissions.DASHBOARD, allRoles, "Glowny panel pracy dla aktywnej roli."),
  moduleItem("transports", "Transporty", "TR", "/transporty", "transports", ModulePermissions.TRANSPORTS, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.INSURANCE_PARTNER,
    Roles.PAYMENT_OPERATOR, Roles.SECURITY, Roles.CUSTOMS_AGENT, Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR,
    Roles.RAIL_OPERATOR, ...serviceRoles, Roles.SUPPORT_AGENT, ...complianceRoles
  ], "Lista transportow dostepnych dla roli."),
  moduleItem("loads", "Ladunki", "LD", "/ladunki", "create", ModulePermissions.LOADS, [
    ...clientRoles, ...dispatcherRoles
  ], "Tworzenie i publikacja ladunkow."),
  moduleItem("live-map", "Live Map", "LM", "/live-map", "live_map", ModulePermissions.LIVE_MAP, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.PAYMENT_OPERATOR,
    Roles.SECURITY, Roles.CUSTOMS_AGENT, Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...serviceRoles
  ], "Mapa operacyjna transportow."),
  moduleItem("gl-gps", "GL GPS", "GP", "/gl-gps", "gps", ModulePermissions.GPS, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.SECURITY,
    Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...serviceRoles
  ], "Punkty GPS i ETA transportu."),
  moduleItem("driver-panel", "Panel kierowcy", "DR", "/kierowca", "driver_mobile", ModulePermissions.DRIVER_PANEL, [
    Roles.DRIVER
  ], "Profesjonalny panel pracy kierowcy bez makiety telefonu."),
  moduleItem("gl-photos", "GL Photos", "PH", "/gl-photos", "photos", ModulePermissions.PHOTOS, [
    ...clientRoles, ...carrierRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.INSURANCE_PARTNER
  ], "Dowody zdjeciowe przypisane do transportu."),
  moduleItem("documents", "Dokumenty / CMR", "CM", "/dokumenty-cmr", "documents", ModulePermissions.DOCUMENTS, [
    ...clientRoles, ...carrierRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.INSURANCE_PARTNER, Roles.CUSTOMS_AGENT,
    Roles.AUTHORITY_USER, Roles.FERRY_OPERATOR, ...complianceRoles
  ], "CMR, dokumenty transportowe i integralnosc plikow."),
  moduleItem("parking", "GL Live Parking", "PK", "/parking", "parking", ModulePermissions.PARKING, [
    ...carrierRoles, ...dispatcherRoles, Roles.DRIVER
  ], "Parkingi, wolne miejsca i raporty kierowcow."),
  moduleItem("chat", "GL Chat", "CH", "/chat", "communication", ModulePermissions.CHAT, [
    ...clientRoles, ...carrierRoles, ...dispatcherRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.INSURANCE_PARTNER,
    Roles.SECURITY, Roles.CUSTOMS_AGENT, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...serviceRoles, Roles.SUPPORT_AGENT
  ], "Komunikacja operacyjna i tlumaczenia."),
  moduleItem("jobs", "GL Jobs", "JB", "/jobs", "jobs", ModulePermissions.JOBS, [
    ...carrierRoles, ...dispatcherRoles, Roles.DRIVER
  ], "Zadania kierowcow i czas pracy."),
  moduleItem("academy", "GL Academy", "AC", "/academy", "academy", ModulePermissions.ACADEMY, [
    ...academyRoles
  ], "Szkolenia, materialy i role akademii."),
  moduleItem("trust", "GL Trust", "TS", "/trust", "trust", ModulePermissions.TRUST, [
    ...clientRoles, ...carrierRoles, Roles.DRIVER, Roles.WAREHOUSE_WORKER, Roles.INSURANCE_PARTNER, Roles.SECURITY,
    Roles.CUSTOMS_AGENT, Roles.FERRY_OPERATOR, ...serviceRoles, ...complianceRoles
  ], "Reputacja firm, kierowcow i partnerow."),
  moduleItem("wallet", "GL Wallet", "WL", "/wallet", "payments", ModulePermissions.WALLET, [
    Roles.PAYMENT_OPERATOR, Roles.CLIENT_OWNER, Roles.CARRIER_OWNER
  ], "Portfele, escrow, prowizje i historia demo."),
  moduleItem("insurance", "Ubezpieczenia", "IN", "/ubezpieczenia", "insurance", ModulePermissions.INSURANCE, [
    Roles.INSURANCE_PARTNER, Roles.CLIENT_OWNER, Roles.CARRIER_OWNER
  ], "Polisy, roszczenia i ryzyko."),
  moduleItem("reports", "Raporty i analizy", "RP", "/raporty", "statistics", ModulePermissions.REPORTS, [
    Roles.PAYMENT_OPERATOR, Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, ...complianceRoles
  ], "Statystyki, raporty i eksport demo."),
  moduleItem("company", "Moja firma", "CO", "/moja-firma", "companies", ModulePermissions.COMPANY, [
    ...clientRoles, ...carrierRoles, Roles.WAREHOUSE_WORKER, Roles.INSURANCE_PARTNER, Roles.PAYMENT_OPERATOR,
    Roles.CUSTOMS_AGENT, Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...serviceRoles, ...complianceRoles
  ], "Profil firmy i uczestnicy ekosystemu."),
  moduleItem("profile", "Profil", "PR", "/profil", "profile", ModulePermissions.PROFILE, allRoles, "Profil aktywnego uzytkownika."),
  moduleItem("settings", "Ustawienia", "ST", "/ustawienia", "admin", ModulePermissions.SETTINGS, [], "Ustawienia systemowe dla administracji."),
  moduleItem("security", "Security / brama", "SE", "/security", "security", ModulePermissions.SECURITY, [Roles.SECURITY], "Kontrola bramy i skan tablic."),
  moduleItem("customs", "Odprawy celne", "CU", "/clo", "customs", ModulePermissions.CUSTOMS, [Roles.CUSTOMS_AGENT], "Odprawa, MRN i komunikacja celna."),
  moduleItem("authority", "Kontrole drogowe", "AU", "/kontrole", "authority", ModulePermissions.AUTHORITY, [Roles.AUTHORITY_USER, ...complianceRoles], "Dostep organow kontrolnych."),
  moduleItem("intermodal", "Prom / kolej", "IM", "/intermodal", "ferry", ModulePermissions.INTERMODAL, [Roles.FERRY_OPERATOR, Roles.RAIL_OPERATOR, ...carrierRoles, Roles.DRIVER], "Prom, kolej i terminal."),
  moduleItem("service", "Serwis techniczny", "SV", "/serwis", "service", ModulePermissions.SERVICE, [...serviceRoles, ...carrierRoles, Roles.DRIVER], "Warsztat, serwis mobilny i pomoc drogowa."),
  moduleItem("ai", "AI Control", "AI", "/ai", "ai", ModulePermissions.AI, [Roles.SUPPORT_AGENT, ...complianceRoles], "Alerty AI i kontrola ryzyka."),
  moduleItem("audit", "Audit Log", "AL", "/audit", "audit", ModulePermissions.AUDIT, [Roles.PAYMENT_OPERATOR, ...complianceRoles], "Historia zdarzen i decyzji."),
  moduleItem("system", "System", "SY", "/system", "system", ModulePermissions.SYSTEM, [], "Stan systemu i konfiguracja platformy."),
  moduleItem("system-tests", "System Tests", "QA", "/system-tests", "system_tests", ModulePermissions.SYSTEM, [], "Testy odporności demo.")
]);

const explicitPermissionsByRole = {
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
    ModulePermissions.AUDIT
  ]
};

export function permissionsForRole(role, user = {}) {
  if (adminRoles.includes(role)) {
    return [...new Set(modulesConfig.flatMap((module) => module.requiredPermissions))];
  }
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
  return module.allowedRoles.includes(role)
    && module.requiredPermissions.every((permission) => permissions.includes(permission));
}
