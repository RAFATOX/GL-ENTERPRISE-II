import { ActionTypes, Roles } from "../core/constants.js";
import {
  canAccessModuleView,
  firstModuleForRole,
  getVisibleModules,
  routeForView
} from "../core/modules-config.js";

const roleConfig = {
  [Roles.DRIVER]: {
    workspace: "Kierowca",
    dashboard: "driver",
    widgets: ["transportStatus", "gps", "eta", "driverTime", "messages"],
    actions: [ActionTypes.START_PICKUP_NAVIGATION, ActionTypes.ADD_LOAD_PHOTO, ActionTypes.UPLOAD_DOCUMENT, ActionTypes.PARKING_REPORT]
  },
  [Roles.CLIENT_OWNER]: {
    workspace: "Klient",
    dashboard: "client",
    widgets: ["loads", "payments", "carriers", "messages"],
    actions: [ActionTypes.CREATE_LOAD, ActionTypes.ADD_LOAD_PHOTO, ActionTypes.CONFIRM_GPS, ActionTypes.PUBLISH_LOAD]
  },
  [Roles.CLIENT_DISPATCHER]: {
    workspace: "Dyspozytor klienta",
    dashboard: "client",
    widgets: ["loads", "carriers", "messages"],
    actions: [ActionTypes.CREATE_LOAD, ActionTypes.ADD_LOAD_PHOTO, ActionTypes.CONFIRM_GPS]
  },
  [Roles.WAREHOUSE_WORKER]: {
    workspace: "Magazyn",
    dashboard: "warehouse",
    widgets: ["ramps", "queue", "photos", "security"],
    actions: [ActionTypes.ADD_LOAD_PHOTO, ActionTypes.CONFIRM_LOADING, ActionTypes.UPLOAD_DOCUMENT]
  },
  [Roles.PAYMENT_OPERATOR]: {
    workspace: "Platnosci",
    dashboard: "payments",
    widgets: ["escrow", "payments", "blocks"],
    actions: [ActionTypes.RELEASE_PAYMENT]
  },
  [Roles.ADMIN]: {
    workspace: "Administrator",
    dashboard: "admin",
    widgets: ["platform", "risk", "finance", "audit"],
    actions: [ActionTypes.ADMIN_BLOCK_TRANSPORT, ActionTypes.AI_RUN_CHECK, ActionTypes.RUN_RESILIENCE_CHECK]
  },
  [Roles.SUPER_ADMIN]: {
    workspace: "Super Admin",
    dashboard: "admin",
    widgets: ["platform", "risk", "finance", "audit"],
    actions: [ActionTypes.AI_RUN_CHECK, ActionTypes.RUN_RESILIENCE_CHECK]
  },
  [Roles.PLATFORM_OWNER]: {
    workspace: "Platforma",
    dashboard: "platform",
    widgets: ["platform", "risk", "finance", "audit", "tests"],
    actions: [ActionTypes.AI_RUN_CHECK, ActionTypes.RUN_RESILIENCE_CHECK, ActionTypes.RESET_DEMO]
  },
  [Roles.CARRIER_OWNER]: {
    workspace: "Przewoznik",
    dashboard: "carrier",
    widgets: ["fleet", "drivers", "transportStatus", "messages"],
    actions: [ActionTypes.ACCEPT_CARRIER, ActionTypes.ASSIGN_DRIVER, ActionTypes.REQUEST_TECHNICAL_SERVICE]
  },
  [Roles.CARRIER_DISPATCHER]: {
    workspace: "Dyspozytor przewoznika",
    dashboard: "carrier",
    widgets: ["fleet", "drivers", "transportStatus"],
    actions: [ActionTypes.ACCEPT_CARRIER, ActionTypes.ASSIGN_DRIVER]
  },
  [Roles.SECURITY]: {
    workspace: "Ochrona",
    dashboard: "security",
    widgets: ["gate", "plate", "transportStatus"],
    actions: [ActionTypes.RECORD_SECURITY_CHECK, ActionTypes.SCAN_LICENSE_PLATE]
  },
  [Roles.CUSTOMS_AGENT]: {
    workspace: "Agencja celna",
    dashboard: "customs",
    widgets: ["customs", "documents", "transportStatus"],
    actions: [ActionTypes.START_CUSTOMS, ActionTypes.CLEAR_CUSTOMS, ActionTypes.HOLD_CUSTOMS]
  },
  [Roles.AUTHORITY_USER]: {
    workspace: "Organ kontrolny",
    dashboard: "authority",
    widgets: ["authority", "documents", "transportStatus"],
    actions: [ActionTypes.START_AUTHORITY_CONTROL, ActionTypes.RECORD_DOCUMENT_CHECK, ActionTypes.PASS_AUTHORITY_CONTROL]
  },
  [Roles.FERRY_OPERATOR]: {
    workspace: "Operator promowy",
    dashboard: "ferry",
    widgets: ["ferry", "eta", "documents"],
    actions: [ActionTypes.BOOK_FERRY, ActionTypes.CHECK_IN_FERRY, ActionTypes.COMPLETE_FERRY]
  },
  [Roles.RAIL_OPERATOR]: {
    workspace: "Operator kolejowy",
    dashboard: "rail",
    widgets: ["transportStatus", "eta", "documents"],
    actions: [ActionTypes.SEND_MESSAGE]
  },
  [Roles.WORKSHOP]: {
    workspace: "Warsztat",
    dashboard: "service",
    widgets: ["service", "eta", "transportStatus"],
    actions: [ActionTypes.ACCEPT_SERVICE_JOB, ActionTypes.COMPLETE_SERVICE_JOB]
  },
  [Roles.MOBILE_SERVICE]: {
    workspace: "Serwis mobilny",
    dashboard: "service",
    widgets: ["service", "eta", "transportStatus"],
    actions: [ActionTypes.ACCEPT_SERVICE_JOB, ActionTypes.COMPLETE_SERVICE_JOB]
  },
  [Roles.ROADSIDE_ASSISTANCE]: {
    workspace: "Pomoc drogowa",
    dashboard: "service",
    widgets: ["service", "eta", "transportStatus"],
    actions: [ActionTypes.ACCEPT_SERVICE_JOB, ActionTypes.COMPLETE_SERVICE_JOB]
  },
  [Roles.INSURANCE_PARTNER]: {
    workspace: "Ubezpieczenia",
    dashboard: "insurance",
    widgets: ["risk", "documents", "transportStatus"],
    actions: [ActionTypes.OPEN_CLAIM, ActionTypes.UPLOAD_DOCUMENT]
  },
  [Roles.ACADEMY_TEACHER]: {
    workspace: "GL Academy",
    dashboard: "academy",
    widgets: ["courses", "students", "certificates"],
    actions: []
  },
  [Roles.ACADEMY_STUDENT]: {
    workspace: "GL Academy",
    dashboard: "academy",
    widgets: ["courses", "profile"],
    actions: []
  },
  [Roles.COMPLIANCE]: {
    workspace: "Compliance",
    dashboard: "audit",
    widgets: ["audit", "risk", "documents"],
    actions: [ActionTypes.RUN_COMPLIANCE_CHECK, ActionTypes.AI_RUN_CHECK]
  },
  [Roles.SUPPORT_AGENT]: {
    workspace: "Wsparcie",
    dashboard: "support",
    widgets: ["messages", "risk", "transportStatus"],
    actions: [ActionTypes.OPEN_DISPUTE, ActionTypes.AI_RUN_CHECK]
  },
  [Roles.READONLY_AUDITOR]: {
    workspace: "Audyt",
    dashboard: "audit",
    widgets: ["audit", "transportStatus"],
    actions: []
  }
};

export function getRoleConfig(role) {
  return roleConfig[role] || roleConfig[Roles.PLATFORM_OWNER];
}

export function menuForRole(role) {
  return getVisibleModules({ role }, role).map((module) => ({
    id: module.view,
    moduleId: module.id,
    label: module.label,
    icon: module.icon,
    route: module.route,
    requiredPermissions: module.requiredPermissions,
    allowedRoles: module.allowedRoles
  }));
}

export function viewAllowedForRole(role, view, route = null) {
  return canAccessModuleView({ role }, role, view, route).ok;
}

export function firstViewForRole(role) {
  return firstModuleForRole(role)?.view || "dashboard";
}

export function firstRouteForRole(role) {
  return firstModuleForRole(role)?.route || "/dashboard";
}

export function routeForRoleView(role, view) {
  return routeForView(view, role);
}
