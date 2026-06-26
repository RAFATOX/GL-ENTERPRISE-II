import { ActionTypes, Roles } from "../core/constants.js";

const menu = {
  dashboard: { id: "dashboard", label: "Panel" },
  myTransports: { id: "transports", label: "Moje transporty" },
  transports: { id: "transports", label: "Transporty" },
  create: { id: "create", label: "Ladunki" },
  gps: { id: "gps", label: "GPS" },
  navigation: { id: "driver_mobile", label: "Nawigacja" },
  loading: { id: "warehouse", label: "Zaladunek" },
  unloading: { id: "driver_mobile", label: "Rozladunek" },
  documents: { id: "documents", label: "Dokumenty" },
  parking: { id: "parking", label: "Parkingi" },
  driverTime: { id: "jobs", label: "Czas pracy" },
  messages: { id: "communication", label: "Komunikaty" },
  profile: { id: "profile", label: "Profil" },
  companies: { id: "companies", label: "Firmy" },
  users: { id: "users", label: "Uzytkownicy" },
  audit: { id: "audit", label: "Audit Log" },
  ai: { id: "ai", label: "AI" },
  payments: { id: "payments", label: "Platnosci" },
  wallets: { id: "wallets", label: "Portfele" },
  escrow: { id: "escrow", label: "Escrow" },
  stats: { id: "statistics", label: "Statystyki" },
  system: { id: "system", label: "System" },
  settings: { id: "admin", label: "Ustawienia" },
  warehouse: { id: "warehouse", label: "Rampy i zdjecia" },
  carrier: { id: "carrier", label: "Przewoznicy" },
  drivers: { id: "driver_assignment", label: "Kierowcy" },
  security: { id: "security", label: "Brama" },
  customs: { id: "customs", label: "Odprawy celne" },
  authority: { id: "authority", label: "Kontrole" },
  ferry: { id: "ferry", label: "Prom / intermodal" },
  service: { id: "service", label: "Serwis" },
  insurance: { id: "insurance", label: "Ubezpieczenia" },
  tests: { id: "system_tests", label: "System Tests" }
};

const roleConfig = {
  [Roles.DRIVER]: {
    workspace: "Kierowca",
    dashboard: "driver",
    menu: [menu.dashboard, menu.myTransports, menu.gps, menu.navigation, menu.loading, menu.unloading, menu.documents, menu.parking, menu.driverTime, menu.messages, menu.profile],
    widgets: ["transportStatus", "gps", "eta", "driverTime", "messages"],
    actions: [ActionTypes.START_PICKUP_NAVIGATION, ActionTypes.ADD_LOAD_PHOTO, ActionTypes.UPLOAD_DOCUMENT, ActionTypes.PARKING_REPORT]
  },
  [Roles.CLIENT_OWNER]: {
    workspace: "Klient",
    dashboard: "client",
    menu: [menu.dashboard, menu.create, menu.transports, menu.documents, menu.payments, menu.carrier, menu.messages, menu.profile],
    widgets: ["loads", "payments", "carriers", "messages"],
    actions: [ActionTypes.CREATE_LOAD, ActionTypes.ADD_LOAD_PHOTO, ActionTypes.CONFIRM_GPS, ActionTypes.PUBLISH_LOAD]
  },
  [Roles.CLIENT_DISPATCHER]: {
    workspace: "Dyspozytor klienta",
    dashboard: "client",
    menu: [menu.dashboard, menu.create, menu.transports, menu.documents, menu.carrier, menu.messages, menu.profile],
    widgets: ["loads", "carriers", "messages"],
    actions: [ActionTypes.CREATE_LOAD, ActionTypes.ADD_LOAD_PHOTO, ActionTypes.CONFIRM_GPS]
  },
  [Roles.WAREHOUSE_WORKER]: {
    workspace: "Magazyn",
    dashboard: "warehouse",
    menu: [menu.dashboard, menu.warehouse, menu.transports, menu.security, menu.documents, menu.messages, menu.profile],
    widgets: ["ramps", "queue", "photos", "security"],
    actions: [ActionTypes.ADD_LOAD_PHOTO, ActionTypes.CONFIRM_LOADING, ActionTypes.UPLOAD_DOCUMENT]
  },
  [Roles.PAYMENT_OPERATOR]: {
    workspace: "Platnosci",
    dashboard: "payments",
    menu: [menu.dashboard, menu.escrow, menu.payments, menu.wallets, menu.audit, menu.profile],
    widgets: ["escrow", "payments", "blocks"],
    actions: [ActionTypes.RELEASE_PAYMENT]
  },
  [Roles.ADMIN]: {
    workspace: "Administrator",
    dashboard: "admin",
    menu: [menu.dashboard, menu.companies, menu.users, menu.transports, menu.audit, menu.ai, menu.payments, menu.stats, menu.system, menu.settings],
    widgets: ["platform", "risk", "finance", "audit"],
    actions: [ActionTypes.ADMIN_BLOCK_TRANSPORT, ActionTypes.AI_RUN_CHECK, ActionTypes.RUN_RESILIENCE_CHECK]
  },
  [Roles.SUPER_ADMIN]: {
    workspace: "Super Admin",
    dashboard: "admin",
    menu: [menu.dashboard, menu.companies, menu.users, menu.transports, menu.audit, menu.ai, menu.payments, menu.escrow, menu.stats, menu.system, menu.settings, menu.tests],
    widgets: ["platform", "risk", "finance", "audit"],
    actions: [ActionTypes.AI_RUN_CHECK, ActionTypes.RUN_RESILIENCE_CHECK]
  },
  [Roles.PLATFORM_OWNER]: {
    workspace: "Platforma",
    dashboard: "platform",
    menu: [menu.dashboard, menu.companies, menu.users, menu.transports, menu.audit, menu.ai, menu.payments, menu.escrow, menu.wallets, menu.stats, menu.system, menu.settings, menu.tests],
    widgets: ["platform", "risk", "finance", "audit", "tests"],
    actions: [ActionTypes.AI_RUN_CHECK, ActionTypes.RUN_RESILIENCE_CHECK, ActionTypes.RESET_DEMO]
  },
  [Roles.CARRIER_OWNER]: {
    workspace: "Przewoznik",
    dashboard: "carrier",
    menu: [menu.dashboard, menu.transports, menu.carrier, menu.drivers, menu.gps, menu.documents, menu.parking, menu.driverTime, menu.messages, menu.profile],
    widgets: ["fleet", "drivers", "transportStatus", "messages"],
    actions: [ActionTypes.ACCEPT_CARRIER, ActionTypes.ASSIGN_DRIVER, ActionTypes.REQUEST_TECHNICAL_SERVICE]
  },
  [Roles.CARRIER_DISPATCHER]: {
    workspace: "Dyspozytor przewoznika",
    dashboard: "carrier",
    menu: [menu.dashboard, menu.transports, menu.drivers, menu.gps, menu.documents, menu.parking, menu.messages, menu.profile],
    widgets: ["fleet", "drivers", "transportStatus"],
    actions: [ActionTypes.ACCEPT_CARRIER, ActionTypes.ASSIGN_DRIVER]
  },
  [Roles.SECURITY]: {
    workspace: "Ochrona",
    dashboard: "security",
    menu: [menu.dashboard, menu.security, menu.transports, menu.gps, menu.messages, menu.profile],
    widgets: ["gate", "plate", "transportStatus"],
    actions: [ActionTypes.RECORD_SECURITY_CHECK, ActionTypes.SCAN_LICENSE_PLATE]
  },
  [Roles.CUSTOMS_AGENT]: {
    workspace: "Agencja celna",
    dashboard: "customs",
    menu: [menu.dashboard, menu.customs, menu.documents, menu.messages, menu.profile],
    widgets: ["customs", "documents", "transportStatus"],
    actions: [ActionTypes.START_CUSTOMS, ActionTypes.CLEAR_CUSTOMS, ActionTypes.HOLD_CUSTOMS]
  },
  [Roles.AUTHORITY_USER]: {
    workspace: "Organ kontrolny",
    dashboard: "authority",
    menu: [menu.dashboard, menu.authority, menu.documents, menu.gps, menu.profile],
    widgets: ["authority", "documents", "transportStatus"],
    actions: [ActionTypes.START_AUTHORITY_CONTROL, ActionTypes.RECORD_DOCUMENT_CHECK, ActionTypes.PASS_AUTHORITY_CONTROL]
  },
  [Roles.FERRY_OPERATOR]: {
    workspace: "Operator promowy",
    dashboard: "ferry",
    menu: [menu.dashboard, menu.ferry, menu.gps, menu.documents, menu.messages, menu.profile],
    widgets: ["ferry", "eta", "documents"],
    actions: [ActionTypes.BOOK_FERRY, ActionTypes.CHECK_IN_FERRY, ActionTypes.COMPLETE_FERRY]
  },
  [Roles.RAIL_OPERATOR]: {
    workspace: "Operator kolejowy",
    dashboard: "rail",
    menu: [menu.dashboard, menu.transports, menu.gps, menu.documents, menu.messages, menu.profile],
    widgets: ["transportStatus", "eta", "documents"],
    actions: [ActionTypes.SEND_MESSAGE]
  },
  [Roles.WORKSHOP]: {
    workspace: "Warsztat",
    dashboard: "service",
    menu: [menu.dashboard, menu.service, menu.gps, menu.messages, menu.profile],
    widgets: ["service", "eta", "transportStatus"],
    actions: [ActionTypes.ACCEPT_SERVICE_JOB, ActionTypes.COMPLETE_SERVICE_JOB]
  },
  [Roles.MOBILE_SERVICE]: {
    workspace: "Serwis mobilny",
    dashboard: "service",
    menu: [menu.dashboard, menu.service, menu.gps, menu.messages, menu.profile],
    widgets: ["service", "eta", "transportStatus"],
    actions: [ActionTypes.ACCEPT_SERVICE_JOB, ActionTypes.COMPLETE_SERVICE_JOB]
  },
  [Roles.ROADSIDE_ASSISTANCE]: {
    workspace: "Pomoc drogowa",
    dashboard: "service",
    menu: [menu.dashboard, menu.service, menu.gps, menu.messages, menu.profile],
    widgets: ["service", "eta", "transportStatus"],
    actions: [ActionTypes.ACCEPT_SERVICE_JOB, ActionTypes.COMPLETE_SERVICE_JOB]
  },
  [Roles.INSURANCE_PARTNER]: {
    workspace: "Ubezpieczenia",
    dashboard: "insurance",
    menu: [menu.dashboard, menu.insurance, menu.documents, menu.messages, menu.profile],
    widgets: ["risk", "documents", "transportStatus"],
    actions: [ActionTypes.OPEN_CLAIM, ActionTypes.UPLOAD_DOCUMENT]
  },
  [Roles.SUPPORT_AGENT]: {
    workspace: "Wsparcie",
    dashboard: "support",
    menu: [menu.dashboard, menu.transports, menu.messages, menu.ai, menu.profile],
    widgets: ["messages", "risk", "transportStatus"],
    actions: [ActionTypes.OPEN_DISPUTE, ActionTypes.AI_RUN_CHECK]
  },
  [Roles.READONLY_AUDITOR]: {
    workspace: "Audyt",
    dashboard: "audit",
    menu: [menu.dashboard, menu.transports, menu.audit, menu.profile],
    widgets: ["audit", "transportStatus"],
    actions: []
  }
};

export function getRoleConfig(role) {
  return roleConfig[role] || roleConfig[Roles.PLATFORM_OWNER];
}

export function menuForRole(role) {
  return getRoleConfig(role).menu;
}

export function viewAllowedForRole(role, view) {
  return view === "dashboard" || menuForRole(role).some((item) => item.id === view);
}

export function firstViewForRole(role) {
  return menuForRole(role)[0]?.id || "dashboard";
}
