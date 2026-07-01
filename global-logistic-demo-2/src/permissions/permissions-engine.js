import { ActionTypes, AccountStatuses, DEMO_MODE, Roles, TransportStatuses } from "../core/constants.js";
import {
  AdminPermissions,
  CompanyPermissions,
  CompliancePermissions,
  DocumentPermissions,
  DriverPermissions,
  FinancePermissions,
  KnowledgePermissions,
  LoadPermissions,
  ModulePermissions,
  VehiclePermissions,
  canAccessModuleView
} from "../core/modules-config.js";
import { onboardingActionTypes } from "../onboarding/registration-onboarding-engine.js";

const platformActions = Object.values(ActionTypes);
const onboardingActions = new Set(onboardingActionTypes(ActionTypes));
const authActions = new Set([
  ActionTypes.AUTH_LOGIN_START,
  ActionTypes.AUTH_LOGIN_VERIFY_OTP,
  ActionTypes.AUTH_LOGOUT,
  ActionTypes.AUTH_PASSWORD_RESET_START,
  ActionTypes.AUTH_PASSWORD_RESET_CONFIRM
]);
const sessionActions = new Set([
  ActionTypes.SELECT_LANGUAGE,
  ActionTypes.OPEN_LANGUAGE_SELECTION,
  ActionTypes.RETURN_TO_START,
  ActionTypes.SELECT_CONTEXT,
  ActionTypes.SELECT_ROLE,
  ActionTypes.SELECT_VIEW,
  ActionTypes.SELECT_TRANSPORT
]);

const rolePermissions = {
  [Roles.PLATFORM_OWNER]: platformActions,
  [Roles.GL_OPERATOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.RELEASE_PAYMENT,
    ActionTypes.ADMIN_RESOLVE_DISPUTE,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.AI_RUN_CHECK
  ],
  [Roles.ADMIN_FINANCE]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.RELEASE_PAYMENT,
    ActionTypes.ADMIN_RESOLVE_DISPUTE,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.AI_RUN_CHECK
  ],
  [Roles.SUPER_ADMIN]: platformActions.filter((action) => action !== ActionTypes.RESET_DEMO),
  [Roles.ADMIN]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.RECORD_SECURITY_CHECK,
    ActionTypes.SIMULATE_API_CALL,
    ActionTypes.RUN_INTEGRATION_SYNC,
    ActionTypes.RUN_RESILIENCE_CHECK,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.AI_RUN_CHECK,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.START_CUSTOMS,
    ActionTypes.CLEAR_CUSTOMS,
    ActionTypes.HOLD_CUSTOMS,
    ActionTypes.START_AUTHORITY_CONTROL,
    ActionTypes.RECORD_DOCUMENT_CHECK,
    ActionTypes.RECORD_ROAD_INSPECTION,
    ActionTypes.PASS_AUTHORITY_CONTROL,
    ActionTypes.REPORT_AUTHORITY_ISSUE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.START_PORT_NAVIGATION,
    ActionTypes.CHECK_IN_FERRY,
    ActionTypes.BOARD_FERRY,
    ActionTypes.COMPLETE_FERRY,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.ADMIN_BLOCK_TRANSPORT,
    ActionTypes.ADMIN_RESOLVE_DISPUTE,
    ActionTypes.ADMIN_BLOCK_ACCOUNT,
    ActionTypes.OPEN_DISPUTE,
    ActionTypes.UPLOAD_DOCUMENT
  ],
  [Roles.CLIENT_OWNER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.CREATE_LOAD,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.CONFIRM_GPS,
    ActionTypes.PUBLISH_LOAD,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.OPEN_DISPUTE
  ],
  [Roles.CLIENT_DISPATCHER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.CREATE_LOAD,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.CONFIRM_GPS,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.OPEN_DISPUTE
  ],
  [Roles.WAREHOUSE_WORKER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.CONFIRM_LOADING,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK
  ],
  [Roles.CARRIER_OWNER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_CARRIER,
    ActionTypes.ASSIGN_DRIVER,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.ADD_VEHICLE
  ],
  [Roles.CARRIER_DISPATCHER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_CARRIER,
    ActionTypes.ASSIGN_DRIVER,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE
  ],
  [Roles.DRIVER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.START_PICKUP_NAVIGATION,
    ActionTypes.ARRIVE_PICKUP,
    ActionTypes.START_LOADING,
    ActionTypes.CONFIRM_LOADING,
    ActionTypes.START_TRANSIT,
    ActionTypes.SELECT_PARKING,
    ActionTypes.START_BREAK,
    ActionTypes.FINISH_BREAK,
    ActionTypes.ARRIVE_DELIVERY,
    ActionTypes.START_UNLOADING,
    ActionTypes.CONFIRM_DELIVERY,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.START_PORT_NAVIGATION,
    ActionTypes.BOARD_FERRY,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.PARKING_REPORT
  ],
  [Roles.INSURANCE_PARTNER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.OPEN_CLAIM,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.PAYMENT_OPERATOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.RELEASE_PAYMENT
  ],
  [Roles.SECURITY_GUARD]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.RECORD_SECURITY_CHECK,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.CUSTOMS_AGENT]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.START_CUSTOMS,
    ActionTypes.CLEAR_CUSTOMS,
    ActionTypes.HOLD_CUSTOMS,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.AUTHORITY_USER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.START_AUTHORITY_CONTROL,
    ActionTypes.RECORD_DOCUMENT_CHECK,
    ActionTypes.RECORD_ROAD_INSPECTION,
    ActionTypes.PASS_AUTHORITY_CONTROL,
    ActionTypes.REPORT_AUTHORITY_ISSUE,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.FERRY_OPERATOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.BOOK_FERRY,
    ActionTypes.START_PORT_NAVIGATION,
    ActionTypes.CHECK_IN_FERRY,
    ActionTypes.BOARD_FERRY,
    ActionTypes.COMPLETE_FERRY,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.RAIL_OPERATOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.WORKSHOP]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.MOBILE_SERVICE]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.ROADSIDE_ASSISTANCE]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.ACADEMY_TEACHER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT
  ],
  [Roles.ACADEMY_STUDENT]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT
  ],
  [Roles.COMPLIANCE]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.AI_RUN_CHECK
  ],
  [Roles.SUPPORT_AGENT]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.OPEN_DISPUTE,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.AI_RUN_CHECK
  ],
  [Roles.READONLY_AUDITOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT
  ]
};

const actionPermissionRequirements = {
  [ActionTypes.SELECT_CONTEXT]: [[ModulePermissions.DASHBOARD]],
  [ActionTypes.SELECT_VIEW]: [[ModulePermissions.DASHBOARD]],
  [ActionTypes.SELECT_TRANSPORT]: [[LoadPermissions.VIEW_OWN], [LoadPermissions.VIEW_COMPANY], [ModulePermissions.TRANSPORTS]],
  [ActionTypes.CREATE_COMPANY]: [[CompanyPermissions.CREATE]],
  [ActionTypes.UPDATE_COMPANY]: [[CompanyPermissions.MANAGE]],
  [ActionTypes.INVITE_COMPANY_USER]: [[CompanyPermissions.INVITE_USERS]],
  [ActionTypes.ACCEPT_COMPANY_INVITATION]: [[CompanyPermissions.READ]],
  [ActionTypes.CHANGE_COMPANY_USER_ROLE]: [[CompanyPermissions.MANAGE]],
  [ActionTypes.CHANGE_COMPANY_USER_PERMISSIONS]: [[CompanyPermissions.MANAGE]],
  [ActionTypes.REMOVE_COMPANY_USER]: [[CompanyPermissions.REMOVE_USERS]],
  [ActionTypes.UPLOAD_COMPANY_DOCUMENT]: [[CompanyPermissions.DOCUMENTS_UPLOAD]],
  [ActionTypes.VERIFY_COMPANY]: [[CompliancePermissions.REVIEW]],
  [ActionTypes.REJECT_COMPANY_VERIFICATION]: [[CompliancePermissions.REVIEW]],
  [ActionTypes.SUSPEND_COMPANY]: [[CompliancePermissions.SUSPEND_COMPANY]],
  [ActionTypes.REGISTER_USER]: [[CompanyPermissions.CREATE]],
  [ActionTypes.VERIFY_ACCOUNT]: [[CompliancePermissions.REVIEW]],
  [ActionTypes.CHANGE_PHONE]: [[ModulePermissions.PROFILE]],
  [ActionTypes.ADD_COMPANY_DRIVER]: [[DriverPermissions.MANAGE]],
  [ActionTypes.ADD_VEHICLE]: [[VehiclePermissions.CREATE]],
  [ActionTypes.CREATE_KNOWLEDGE_SOURCE]: [[KnowledgePermissions.MANAGE], [KnowledgePermissions.SOURCE_CREATE]],
  [ActionTypes.UPDATE_KNOWLEDGE_SOURCE]: [[KnowledgePermissions.MANAGE], [KnowledgePermissions.SOURCE_UPDATE]],
  [ActionTypes.ARCHIVE_KNOWLEDGE_SOURCE]: [[KnowledgePermissions.MANAGE], [KnowledgePermissions.SOURCE_ARCHIVE]],
  [ActionTypes.CREATE_LOAD]: [[LoadPermissions.CREATE]],
  [ActionTypes.ADD_LOAD_PHOTO]: [[DocumentPermissions.UPLOAD], [ModulePermissions.PHOTOS]],
  [ActionTypes.CONFIRM_GPS]: [[ModulePermissions.GPS]],
  [ActionTypes.PUBLISH_LOAD]: [[LoadPermissions.CREATE], [LoadPermissions.MANAGE_COMPANY]],
  [ActionTypes.ACCEPT_CARRIER]: [[LoadPermissions.ACCEPT]],
  [ActionTypes.ASSIGN_DRIVER]: [[LoadPermissions.ASSIGN_DRIVER], [DriverPermissions.ASSIGN]],
  [ActionTypes.START_PICKUP_NAVIGATION]: [[LoadPermissions.VIEW_OWN]],
  [ActionTypes.ARRIVE_PICKUP]: [[LoadPermissions.VIEW_OWN]],
  [ActionTypes.START_LOADING]: [[LoadPermissions.VIEW_OWN], [LoadPermissions.VIEW_COMPANY]],
  [ActionTypes.CONFIRM_LOADING]: [[LoadPermissions.VIEW_OWN], [LoadPermissions.VIEW_COMPANY]],
  [ActionTypes.UPLOAD_DOCUMENT]: [[DocumentPermissions.UPLOAD]],
  [ActionTypes.START_TRANSIT]: [[LoadPermissions.VIEW_OWN]],
  [ActionTypes.SELECT_PARKING]: [[ModulePermissions.PARKING]],
  [ActionTypes.START_BREAK]: [[ModulePermissions.PARKING]],
  [ActionTypes.FINISH_BREAK]: [[ModulePermissions.PARKING]],
  [ActionTypes.ARRIVE_DELIVERY]: [[LoadPermissions.VIEW_OWN]],
  [ActionTypes.START_UNLOADING]: [[LoadPermissions.VIEW_OWN]],
  [ActionTypes.CONFIRM_DELIVERY]: [[LoadPermissions.VIEW_OWN]],
  [ActionTypes.RELEASE_PAYMENT]: [[FinancePermissions.WALLET_PLATFORM_MANAGE], [FinancePermissions.ESCROW_MANAGE]],
  [ActionTypes.OPEN_DISPUTE]: [[LoadPermissions.VIEW_COMPANY], [CompliancePermissions.REVIEW]],
  [ActionTypes.OPEN_CLAIM]: [[ModulePermissions.CLAIMS]],
  [ActionTypes.SEND_MESSAGE]: [[ModulePermissions.CHAT]],
  [ActionTypes.REQUEST_TRANSLATION]: [[ModulePermissions.CHAT]],
  [ActionTypes.SCAN_LICENSE_PLATE]: [[ModulePermissions.SECURITY], [ModulePermissions.AUTHORITY], [ModulePermissions.TRANSPORTS]],
  [ActionTypes.RECORD_SECURITY_CHECK]: [[ModulePermissions.SECURITY]],
  [ActionTypes.MARK_CUSTOMS_REQUIRED]: [[LoadPermissions.MANAGE_COMPANY], [ModulePermissions.CUSTOMS]],
  [ActionTypes.SEND_TO_CUSTOMS]: [[LoadPermissions.MANAGE_COMPANY], [ModulePermissions.CUSTOMS]],
  [ActionTypes.START_CUSTOMS]: [[ModulePermissions.CUSTOMS]],
  [ActionTypes.CLEAR_CUSTOMS]: [[ModulePermissions.CUSTOMS]],
  [ActionTypes.HOLD_CUSTOMS]: [[ModulePermissions.CUSTOMS]],
  [ActionTypes.START_AUTHORITY_CONTROL]: [[ModulePermissions.AUTHORITY]],
  [ActionTypes.RECORD_DOCUMENT_CHECK]: [[ModulePermissions.AUTHORITY]],
  [ActionTypes.RECORD_ROAD_INSPECTION]: [[ModulePermissions.AUTHORITY]],
  [ActionTypes.PASS_AUTHORITY_CONTROL]: [[ModulePermissions.AUTHORITY]],
  [ActionTypes.REPORT_AUTHORITY_ISSUE]: [[ModulePermissions.AUTHORITY]],
  [ActionTypes.MARK_FERRY_REQUIRED]: [[LoadPermissions.MANAGE_COMPANY], [ModulePermissions.INTERMODAL]],
  [ActionTypes.BOOK_FERRY]: [[ModulePermissions.INTERMODAL]],
  [ActionTypes.START_PORT_NAVIGATION]: [[ModulePermissions.INTERMODAL], [LoadPermissions.VIEW_OWN]],
  [ActionTypes.CHECK_IN_FERRY]: [[ModulePermissions.INTERMODAL]],
  [ActionTypes.BOARD_FERRY]: [[ModulePermissions.INTERMODAL], [LoadPermissions.VIEW_OWN]],
  [ActionTypes.COMPLETE_FERRY]: [[ModulePermissions.INTERMODAL]],
  [ActionTypes.REPORT_BREAKDOWN]: [[ModulePermissions.SERVICE_ORDERS], [LoadPermissions.VIEW_OWN]],
  [ActionTypes.REQUEST_TECHNICAL_SERVICE]: [[ModulePermissions.SERVICE_ORDERS], [LoadPermissions.MANAGE_COMPANY]],
  [ActionTypes.ACCEPT_SERVICE_JOB]: [[ModulePermissions.SERVICE_ORDERS]],
  [ActionTypes.COMPLETE_SERVICE_JOB]: [[ModulePermissions.SERVICE_ORDERS]],
  [ActionTypes.SIMULATE_API_CALL]: [[ModulePermissions.SYSTEM], [AdminPermissions.AUDIT_READ]],
  [ActionTypes.RUN_INTEGRATION_SYNC]: [[ModulePermissions.SYSTEM], [AdminPermissions.AUDIT_READ]],
  [ActionTypes.RUN_RESILIENCE_CHECK]: [[ModulePermissions.SYSTEM], [AdminPermissions.AUDIT_READ]],
  [ActionTypes.RUN_COMPLIANCE_CHECK]: [[CompliancePermissions.REVIEW]],
  [ActionTypes.AI_RUN_CHECK]: [[ModulePermissions.AI], [CompliancePermissions.REVIEW]],
  [ActionTypes.ADMIN_BLOCK_TRANSPORT]: [[CompliancePermissions.REVIEW]],
  [ActionTypes.ADMIN_RESOLVE_DISPUTE]: [[CompliancePermissions.REVIEW], [FinancePermissions.ESCROW_MANAGE]],
  [ActionTypes.ADMIN_BLOCK_ACCOUNT]: [[CompliancePermissions.SUSPEND_USER]],
  [ActionTypes.PARKING_REPORT]: [[ModulePermissions.PARKING]],
  [ActionTypes.RESET_DEMO]: [[ModulePermissions.SYSTEM]]
};

export class PermissionsEngine {
  can(actionType, context) {
    return this.canPerformAction(context.actor, actionType, context);
  }

  canPerformAction(user, actionType, entity = {}) {
    const context = entity.state ? entity : {
      actor: user,
      actionType,
      payload: entity.payload || {},
      state: entity.state || {}
    };

    // DEMO_MODE only: in production the role and user identity must come from backend auth
    // and be verified by the permissions engine, never from a UI role switcher.
    if (DEMO_MODE && actionType === ActionTypes.SELECT_ROLE && context.meta?.demoOnly) {
      return { ok: true, reason: "demo-only action allowed" };
    }

    if (DEMO_MODE && actionType === ActionTypes.RESET_DEMO) {
      return { ok: true, reason: "demo reset allowed" };
    }

    if ([ActionTypes.SELECT_LANGUAGE, ActionTypes.OPEN_LANGUAGE_SELECTION, ActionTypes.RETURN_TO_START].includes(actionType)) {
      return { ok: true, reason: "start and language selection allowed before app access" };
    }

    if (onboardingActions.has(actionType)) {
      return { ok: true, reason: "onboarding action allowed before app access" };
    }

    if (authActions.has(actionType)) {
      return { ok: true, reason: "identity action allowed before app access" };
    }

    if (actionType === ActionTypes.SELECT_VIEW && context.payload.view === "onboarding") {
      return { ok: true, reason: "onboarding view allowed" };
    }

    if (context.state?.session?.onboardingRequired && actionType === ActionTypes.SELECT_VIEW) {
      return {
        ok: false,
        reason: "onboarding wymagany przed dostepem do aplikacji"
      };
    }

    if (!accountApproved(context.actor) && actionType === ActionTypes.SELECT_VIEW) {
      return {
        ok: false,
        reason: `konto wymaga pelnej weryfikacji: ${context.actor.accountStatus}`
      };
    }

    const actionAccess = this.checkActionPermission(actionType, context);
    if (!actionAccess.ok) return actionAccess;

    if (actionType === ActionTypes.SELECT_VIEW) {
      const moduleAccess = canAccessModuleView(context.actor, context.actor.role, context.payload.view, context.payload.route);
      if (!moduleAccess.ok) return moduleAccess;
    }
    const entityAccess = this.checkEntityAccess(actionType, context);
    if (!entityAccess.ok) return entityAccess;
    return { ok: true, reason: "permission granted" };
  }

  listForRole(role) {
    return rolePermissions[role] || [];
  }

  checkActionPermission(actionType, context) {
    if (context.actor?.permissionsSource !== "company_engine") {
      return {
        ok: false,
        reason: "brak kontekstu Company Engine / Permission Engine"
      };
    }

    if (actionType === ActionTypes.SELECT_CONTEXT) {
      return canSelectContext(context);
    }

    if (actionType === ActionTypes.SELECT_ROLE) {
      return canSelectRole(context);
    }

    const requirementGroups = actionPermissionRequirements[actionType] || [];
    if (!requirementGroups.length) {
      return {
        ok: false,
        reason: `brak zmapowanego permission dla akcji ${actionType}`
      };
    }

    const granted = requirementGroups.some((group) => group.every((permission) => hasPermission(context.actor, permission)));
    if (!granted) {
      return {
        ok: false,
        reason: `brak permission dla ${actionType}: wymagane ${requirementGroups.map((group) => group.join("+")).join(" albo ")}`
      };
    }

    return { ok: true, reason: "permission granted by Company Engine context" };
  }

  checkEntityAccess(actionType, context) {
    const transport = transportForContext(context);
    if (!transport) return { ok: true, reason: "no transport scope" };
    const actor = context.actor;

    if (!canViewTransport(actor, transport, context.state)) {
      return {
        ok: false,
        reason: `${actor.role} has no access to transport ${transport.id}`
      };
    }

    if (
      actionType === ActionTypes.ACCEPT_CARRIER
      && carrierScoped(actor)
      && context.payload.carrierCompanyId !== actor.companyId
    ) {
      return {
        ok: false,
        reason: "carrier can accept only for own company_id"
      };
    }

    return { ok: true, reason: "entity access granted" };
  }

  filterSnapshot(snapshot, actor) {
    const visibleTransportIds = new Set(
      snapshot.transports
        .filter((transport) => canViewTransport(actor, transport, snapshot))
        .map((transport) => transport.id)
    );

    snapshot.transports = snapshot.transports.filter((transport) => visibleTransportIds.has(transport.id));
    if (!visibleTransportIds.has(snapshot.session.selectedTransportId)) {
      snapshot.session.selectedTransportId = snapshot.transports[0]?.id || null;
    }

    snapshot.shipments = snapshot.shipments.filter((shipment) => visibleTransportIds.has(shipment.transportId));
    snapshot.documents = snapshot.documents.filter((doc) => (
      visibleTransportIds.has(doc.transportId)
      && (privileged(actor) || (hasPermission(actor, ModulePermissions.DOCUMENTS) && doc.visibleToRoles.includes(actor.role)))
    ));
    snapshot.photos = snapshot.photos.filter((photo) => visibleTransportIds.has(photo.transportId));
    snapshot.jobs = snapshot.jobs.filter((job) => visibleTransportIds.has(job.transportId));
    snapshot.messages = snapshot.messages.filter((message) => visibleTransportIds.has(message.transportId));
    const visibleMessageIds = new Set(snapshot.messages.map((message) => message.id));
    snapshot.translations = snapshot.translations.filter((translation) => visibleMessageIds.has(translation.messageId));
    snapshot.messageThreads = snapshot.messageThreads.filter((thread) => visibleTransportIds.has(thread.transportId));
    snapshot.securityChecks = snapshot.securityChecks.filter((check) => visibleTransportIds.has(check.transportId));
    snapshot.disputeEvidencePacks = snapshot.disputeEvidencePacks.filter((pack) => visibleTransportIds.has(pack.transportId));
    snapshot.digitalCmrs = snapshot.digitalCmrs.filter((cmr) => visibleTransportIds.has(cmr.transportId));
    snapshot.customsCases = (snapshot.customsCases || []).filter((customsCase) => (
      visibleTransportIds.has(customsCase.transportId)
      && (privileged(actor) || (hasPermission(actor, ModulePermissions.CUSTOMS) && (actor.role === Roles.CUSTOMS_AGENT || actor.companyId === customsCase.agentCompanyId)))
    ));
    snapshot.customsPayments = (snapshot.customsPayments || []).filter((payment) => (
      visibleTransportIds.has(payment.transportId)
      && (privileged(actor) || (hasPermission(actor, ModulePermissions.CUSTOMS) && actor.role === Roles.CUSTOMS_AGENT) || paymentStatusScoped(actor))
    ));
    snapshot.authorityControls = (snapshot.authorityControls || []).filter((control) => (
      visibleTransportIds.has(control.transportId)
      && (privileged(actor) || authorityScoped(actor))
    ));
    snapshot.authorityControlHistory = (snapshot.authorityControlHistory || []).filter((history) => (
      visibleTransportIds.has(history.transportId)
      && (privileged(actor) || authorityScoped(actor))
    ));
    snapshot.ferryBookings = (snapshot.ferryBookings || []).filter((booking) => visibleTransportIds.has(booking.transportId));
    snapshot.ferryPayments = (snapshot.ferryPayments || []).filter((payment) => (
      visibleTransportIds.has(payment.transportId)
      && (privileged(actor) || (hasPermission(actor, ModulePermissions.INTERMODAL) && actor.role === Roles.FERRY_OPERATOR) || paymentStatusScoped(actor))
    ));
    snapshot.serviceRequests = (snapshot.serviceRequests || []).filter((request) => (
      visibleTransportIds.has(request.transportId)
      && (
        privileged(actor)
        || (hasPermission(actor, LoadPermissions.VIEW_OWN) && actor.role === Roles.DRIVER)
        || carrierScoped(actor)
        || serviceScoped(actor, request)
      )
    ));
    snapshot.servicePayments = (snapshot.servicePayments || []).filter((payment) => (
      visibleTransportIds.has(payment.transportId)
      && (privileged(actor) || paymentStatusScoped(actor) || (hasPermission(actor, FinancePermissions.INVOICES_OWN_READ) && payment.providerCompanyId === actor.companyId))
    ));
    snapshot.serviceProviders = (snapshot.serviceProviders || []).filter((provider) => (
      privileged(actor)
      || (hasPermission(actor, ModulePermissions.SERVICE_ORDERS) && [Roles.DRIVER, Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(actor.role))
      || provider.companyId === actor.companyId
    ));
    snapshot.companyComplianceEntries = (snapshot.companyComplianceEntries || []).filter((entry) => (
      privileged(actor) || entry.companyId === actor.companyId || authorityScoped(actor)
    ));
    snapshot.complianceChecks = snapshot.complianceChecks.filter((check) => visibleTransportIds.has(check.transportId));
    snapshot.crewPlans = snapshot.crewPlans.filter((plan) => visibleTransportIds.has(plan.transportId));
    const visibleDriverIds = new Set(snapshot.transports
      .flatMap((transport) => [transport.driverId, ...(snapshot.crewPlans.find((plan) => plan.transportId === transport.id)?.driverIds || [])])
      .filter(Boolean));
    snapshot.tachographImports = snapshot.tachographImports.filter((row) => (
      privileged(actor) || visibleDriverIds.has(row.driverId) || row.driverId === actor.userId
    ));
    snapshot.plateLookups = snapshot.plateLookups.filter((lookup) => (
      lookup.scannerUserId === actor.userId
      || (lookup.transportId && visibleTransportIds.has(lookup.transportId))
      || privileged(actor)
    ));

    if (authorityScoped(actor)) {
      snapshot.transports = snapshot.transports.map(sanitizeAuthorityTransport);
      snapshot.messages = [];
      snapshot.messageThreads = [];
      snapshot.translations = [];
      snapshot.photos = [];
      snapshot.disputes = [];
      snapshot.disputeEvidencePacks = [];
      snapshot.ferryPayments = [];
      snapshot.customsPayments = [];
      snapshot.servicePayments = [];
    }

    if (serviceAccessScoped(actor)) {
      snapshot.transports = snapshot.transports.map(sanitizeServiceTransport);
      snapshot.messages = snapshot.messages.filter((message) => message.authorId === actor.userId);
      const visibleThreadIds = new Set(snapshot.messages.map((message) => message.threadId));
      snapshot.messageThreads = snapshot.messageThreads.filter((thread) => visibleThreadIds.has(thread.id));
      snapshot.translations = snapshot.translations.filter((translation) => (
        snapshot.messages.some((message) => message.id === translation.messageId)
      ));
      snapshot.photos = [];
      snapshot.disputes = [];
      snapshot.disputeEvidencePacks = [];
    }

    if (!privileged(actor)) {
      snapshot.apiClients = [];
      snapshot.apiAudit = [];
      snapshot.integrations = [];
      snapshot.integrationRuns = [];
      snapshot.serviceHealth = [];
      snapshot.backupSnapshots = [];
      snapshot.resilienceChecks = [];
    }

    if (!canViewKnowledgeLibrary(actor)) {
      snapshot.knowledgeSources = [];
      snapshot.knowledgeQueries = [];
    } else if (hasPermission(actor, KnowledgePermissions.ACADEMY_READ) && !canManageKnowledge(actor)) {
      snapshot.knowledgeSources = (snapshot.knowledgeSources || []).filter((source) => (
        ["academy_material", "test_question_bank", "training_module", "certification_path"].includes(source.type)
      ));
    }

    const scope = financialScope(actor);
    const owner = financeOwnerForActor(actor, scope);
    snapshot.access = {
      actor: {
        userId: actor.userId,
        role: actor.role,
        companyId: actor.companyId,
        companyName: actor.companyName,
        companyType: actor.companyType,
        companyRole: actor.companyRole,
        contextType: actor.contextType,
        permissions: actor.permissions || [],
        permissionsSource: actor.permissionsSource
      },
      permissions: actor.permissions || [],
      contextType: actor.contextType || "private",
      contextOptions: actor.contextOptions || [],
      activeContextLabel: activeContextLabel(actor),
      canViewFinancials: scope !== "none",
      canViewPlatformWallet: scope === "platform",
      canViewOwnWallet: ["client", "carrier", "insurance", "service", "user"].includes(scope),
      canViewFinanceAudit: scope === "platform",
      financialScope: scope,
      financeOwnerType: owner.ownerType,
      financeOwnerId: owner.ownerId,
      walletView: walletViewForScope(scope),
      privateContactsVisible: privileged(actor)
    };

    if (scope === "none") {
      snapshot.payments = [];
      snapshot.wallets = [];
      snapshot.walletLedger = [];
      snapshot.walletTransactions = [];
      snapshot.walletRiskAlerts = [];
      snapshot.walletReports = [];
      snapshot.walletApiEndpoints = [];
      snapshot.exchangeRates = [];
      snapshot.escrows = [];
      snapshot.escrowOperations = [];
      snapshot.revenueLedger = [];
      snapshot.invoices = [];
      snapshot.settlements = [];
      snapshot.payouts = [];
    } else if (scope !== "platform") {
      const companyId = actor.companyId;
      const financialTransportIds = financialTransportIdsForScope(snapshot, actor, scope, visibleTransportIds);
      snapshot.payments = scope === "user"
        ? snapshot.payments.filter((payment) => userFinanceRecordVisible(payment, actor))
        : snapshot.payments.filter((payment) => financialTransportIds.has(payment.transportId));
      snapshot.escrows = ["client", "carrier"].includes(scope) ? snapshot.escrows.filter((escrow) => (
        escrow.payerCompanyId === companyId || escrow.payeeCompanyId === companyId
      )) : [];
      const escrowIds = new Set(snapshot.escrows.map((escrow) => escrow.id));
      snapshot.escrowOperations = ["client", "carrier"].includes(scope)
        ? (snapshot.escrowOperations || []).filter((operation) => (
          escrowIds.has(operation.escrowId) && financialTransportIds.has(operation.transportId)
        ))
        : [];
      snapshot.wallets = snapshot.wallets.filter((wallet) => walletVisibleForActor(wallet, actor, scope));
      const walletIds = new Set(snapshot.wallets.map((wallet) => wallet.id));
      snapshot.walletLedger = snapshot.walletLedger.filter((entry) => walletIds.has(entry.walletId));
      snapshot.walletTransactions = (snapshot.walletTransactions || []).filter((entry) => (
        transactionVisibleForScope(entry, actor, scope, financialTransportIds)
      ));
      const transactionIds = new Set(snapshot.walletTransactions.map((entry) => entry.id));
      snapshot.walletRiskAlerts = scope === "payment_status"
        ? (snapshot.walletRiskAlerts || []).filter((alert) => transactionIds.has(alert.transactionId))
        : [];
      snapshot.walletReports = [];
      snapshot.walletApiEndpoints = [];
      snapshot.exchangeRates = [];
      snapshot.revenueLedger = [];
      snapshot.invoices = filterFinanceRecords(snapshot.invoices || [], actor, financialTransportIds, scope);
      snapshot.settlements = filterFinanceRecords(snapshot.settlements || [], actor, financialTransportIds, scope);
      snapshot.payouts = filterFinanceRecords(snapshot.payouts || [], actor, financialTransportIds, scope);
    }

    if (!privileged(actor)) {
      snapshot.users = snapshot.users.map((user) => ({
        ...user,
        phone: user.id === actor.userId || user.companyId === actor.companyId ? user.phone : "restricted"
      }));
    }

    return snapshot;
  }
}

function transportForContext(context) {
  const nonTransportActions = [
    ActionTypes.SELECT_LANGUAGE,
    ActionTypes.OPEN_LANGUAGE_SELECTION,
    ActionTypes.RETURN_TO_START,
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_CONTEXT,
    ActionTypes.SELECT_VIEW,
    ActionTypes.REGISTER_USER,
    ActionTypes.VERIFY_ACCOUNT,
    ActionTypes.CHANGE_PHONE,
    ActionTypes.CREATE_COMPANY,
    ActionTypes.UPDATE_COMPANY,
    ActionTypes.INVITE_COMPANY_USER,
    ActionTypes.ACCEPT_COMPANY_INVITATION,
    ActionTypes.CHANGE_COMPANY_USER_ROLE,
    ActionTypes.CHANGE_COMPANY_USER_PERMISSIONS,
    ActionTypes.REMOVE_COMPANY_USER,
    ActionTypes.UPLOAD_COMPANY_DOCUMENT,
    ActionTypes.VERIFY_COMPANY,
    ActionTypes.REJECT_COMPANY_VERIFICATION,
    ActionTypes.SUSPEND_COMPANY,
    ActionTypes.ONBOARDING_START,
    ActionTypes.ONBOARDING_VERIFY_PHONE,
    ActionTypes.ONBOARDING_CREATE_ACCOUNT,
    ActionTypes.ONBOARDING_SELECT_ROLE,
    ActionTypes.ONBOARDING_SUBMIT_IDENTITY,
    ActionTypes.ONBOARDING_SUBMIT_ROLE_DOCUMENTS,
    ActionTypes.ONBOARDING_SUBMIT_COMPANY,
    ActionTypes.ONBOARDING_APPROVE,
    ActionTypes.ONBOARDING_REJECT,
    ActionTypes.CREATE_KNOWLEDGE_SOURCE,
    ActionTypes.UPDATE_KNOWLEDGE_SOURCE,
    ActionTypes.ARCHIVE_KNOWLEDGE_SOURCE,
    ActionTypes.ADD_COMPANY_DRIVER,
    ActionTypes.ADD_VEHICLE,
    ActionTypes.CREATE_LOAD,
    ActionTypes.ADMIN_BLOCK_ACCOUNT,
    ActionTypes.PARKING_REPORT,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.SIMULATE_API_CALL,
    ActionTypes.RUN_INTEGRATION_SYNC,
    ActionTypes.RUN_RESILIENCE_CHECK,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.RESET_DEMO
  ];
  if (!context.payload.transportId && nonTransportActions.includes(context.actionType)) return null;
  const transportId = context.payload.transportId || context.state.session.selectedTransportId;
  if (!transportId) return null;
  return context.state.transports.find((transport) => transport.id === transportId) || null;
}

function privileged(actor) {
  return hasPermission(actor, FinancePermissions.WALLET_PLATFORM_READ)
    || hasPermission(actor, AdminPermissions.AUDIT_READ)
    || hasPermission(actor, CompliancePermissions.REVIEW);
}

function carrierScoped(actor) {
  return [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(actor.role)
    && (hasPermission(actor, LoadPermissions.ACCEPT) || hasPermission(actor, LoadPermissions.MANAGE_COMPANY));
}

function serviceRole(role) {
  return [Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE].includes(role);
}

function serviceScoped(actor, request) {
  return serviceAccessScoped(actor) && (
    request.providerCompanyId === actor.companyId || request.status === "breakdown_reported"
  );
}

function serviceAccessScoped(actor) {
  return serviceRole(actor.role) && hasPermission(actor, ModulePermissions.SERVICE_ORDERS);
}

function authorityScoped(actor) {
  return actor.role === Roles.AUTHORITY_USER && hasPermission(actor, ModulePermissions.AUTHORITY);
}

function paymentStatusScoped(actor) {
  return actor.companyType === "payment" && hasPermission(actor, ModulePermissions.BILLING);
}

function canViewTransport(actor, transport, state) {
  if (privileged(actor) || platformFinanceRole(actor)) return true;
  if (
    [Roles.SUPPORT_AGENT, Roles.READONLY_AUDITOR].includes(actor.role)
    && (hasPermission(actor, AdminPermissions.AUDIT_READ) || hasPermission(actor, CompliancePermissions.REVIEW))
  ) return true;
  if (paymentStatusScoped(actor)) return true;
  if (actor.role === Roles.SECURITY_GUARD && hasPermission(actor, ModulePermissions.SECURITY)) return true;
  if (authorityScoped(actor)) {
    return ![TransportStatuses.COMPLETED, TransportStatuses.CANCELLED].includes(transport.status);
  }
  if (actor.role === Roles.CUSTOMS_AGENT && hasPermission(actor, ModulePermissions.CUSTOMS)) {
    return (state.customsCases || []).some((customsCase) => (
      customsCase.transportId === transport.id && customsCase.agentCompanyId === actor.companyId
    )) || [
      TransportStatuses.CUSTOMS_REQUIRED,
      TransportStatuses.WAITING_FOR_CUSTOMS,
      TransportStatuses.CUSTOMS_IN_PROGRESS,
      TransportStatuses.CUSTOMS_CLEARED,
      TransportStatuses.CUSTOMS_HOLD
    ].includes(transport.status);
  }
  if (serviceAccessScoped(actor)) {
    return (state.serviceRequests || []).some((request) => (
      request.transportId === transport.id
      && (request.providerCompanyId === actor.companyId || request.status === "breakdown_reported")
    ));
  }
  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(actor.role) && hasPermission(actor, LoadPermissions.VIEW_COMPANY)) {
    return transport.clientCompanyId === actor.companyId;
  }
  if (actor.role === Roles.WAREHOUSE_WORKER && hasPermission(actor, LoadPermissions.VIEW_COMPANY)) {
    return transport.warehouseWorkerId === actor.userId || transport.clientCompanyId === actor.companyId;
  }
  if (carrierScoped(actor)) {
    return transport.carrierCompanyId === actor.companyId
      || (!transport.carrierCompanyId && [
        TransportStatuses.PUBLISHED,
        TransportStatuses.CARRIER_OFFER_RECEIVED
      ].includes(transport.status));
  }
  if (actor.role === Roles.DRIVER && hasPermission(actor, LoadPermissions.VIEW_OWN)) {
    return transport.driverId === actor.userId;
  }
  if (actor.role === Roles.INSURANCE_PARTNER && (hasPermission(actor, ModulePermissions.POLICIES) || hasPermission(actor, ModulePermissions.CLAIMS) || hasPermission(actor, ModulePermissions.RISK))) {
    const policy = state.insurancePolicies.find((item) => item.id === transport.insuranceId);
    return Boolean(policy || transport.activeClaimId || transport.riskFlagged);
  }
  if (actor.role === Roles.FERRY_OPERATOR && hasPermission(actor, ModulePermissions.INTERMODAL)) {
    return (state.ferryBookings || []).some((booking) => (
      booking.transportId === transport.id && booking.operatorCompanyId === actor.companyId
    )) || ["FERRY", "INTERMODAL"].includes(transport.transportMode);
  }
  if (actor.role === Roles.RAIL_OPERATOR && hasPermission(actor, ModulePermissions.INTERMODAL)) {
    return ["TRAIN", "INTERMODAL"].includes(transport.transportMode);
  }
  return false;
}

function financialScope(actor) {
  if (hasPermission(actor, FinancePermissions.WALLET_PLATFORM_READ)) return "platform";
  if (actor.role === Roles.DRIVER && hasPermission(actor, FinancePermissions.WALLET_OWN_READ)) return "user";
  const canReadCompanyWallet = hasPermission(actor, FinancePermissions.WALLET_COMPANY_READ)
    || hasPermission(actor, FinancePermissions.WALLET_OWN_READ)
    || hasPermission(actor, FinancePermissions.INVOICES_COMPANY_READ)
    || hasPermission(actor, FinancePermissions.INVOICES_OWN_READ);
  if (canReadCompanyWallet && actor.companyType === "client") return "client";
  if (canReadCompanyWallet && actor.companyType === "carrier") return "carrier";
  if (canReadCompanyWallet && ["insurance", "insurer"].includes(actor.companyType)) return "insurance";
  if (canReadCompanyWallet && ["workshop", "mobile_service", "roadside_assistance"].includes(actor.companyType)) return "service";
  if (paymentStatusScoped(actor)) return "payment_status";
  return "none";
}

function financeOwnerForActor(actor, scope) {
  if (scope === "platform") return { ownerType: "platform", ownerId: "platform" };
  if (["insurance", "service"].includes(scope)) return { ownerType: "partner", ownerId: actor.companyId || actor.userId || null };
  if (["client", "carrier"].includes(scope)) return { ownerType: "company", ownerId: actor.companyId || null };
  if (scope === "user") return { ownerType: "user", ownerId: actor.userId || null };
  return { ownerType: null, ownerId: null };
}

function walletViewForScope(scope) {
  if (scope === "platform") return "PlatformWallet";
  if (scope === "client") return "CompanyWallet";
  if (scope === "carrier") return "CompanyWallet";
  if (scope === "insurance") return "PartnerWallet";
  if (scope === "service") return "PartnerWallet";
  if (scope === "user") return "UserWallet";
  return null;
}

function activeContextLabel(actor) {
  if (actor.contextType === "platform") return "Operator GL";
  if (actor.contextType === "company") return `${actor.companyName || actor.companyId} / ${actor.companyRole || "rola firmowa"}`;
  return "Osoba prywatna";
}

function walletVisibleForActor(wallet, actor, scope) {
  if (!wallet) return false;
  if (wallet.ownerType === "platform" || wallet.owner_type === "platform") return false;
  if (wallet.ownerType === "transport_escrow" || wallet.owner_type === "transport_escrow") return false;

  const ownerId = wallet.ownerId || wallet.owner_id || wallet.ownerCompanyId || wallet.ownerUserId;
  if (scope === "user") return wallet.ownerUserId === actor.userId || ownerId === actor.userId;
  if (!actor.companyId) return false;

  if (["client", "carrier"].includes(scope)) {
    return ownerId === actor.companyId
      && ["company", undefined, null].includes(wallet.ownerType || wallet.owner_type);
  }

  if (["insurance", "service"].includes(scope)) {
    return ownerId === actor.companyId
      && ["partner", "company", undefined, null].includes(wallet.ownerType || wallet.owner_type);
  }

  return false;
}

function transactionVisibleForScope(entry, actor, scope, financialTransportIds) {
  if (!entry) return false;
  if (scope === "payment_status") return financialTransportIds.has(entry.transportId);
  if (scope === "user") return entry.senderId === actor.userId || entry.receiverId === actor.userId || entry.ownerUserId === actor.userId;
  const companyId = actor.companyId;
  if (!companyId) return entry.senderId === actor.userId || entry.receiverId === actor.userId;
  if (entry.senderId === companyId || entry.receiverId === companyId) return true;
  if (["client", "carrier"].includes(scope)) {
    const escrowSide = String(entry.senderId || "").startsWith("escrow:")
      || String(entry.receiverId || "").startsWith("escrow:");
    return escrowSide && financialTransportIds.has(entry.transportId);
  }
  return false;
}

function filterFinanceRecords(records, actor, financialTransportIds, scope) {
  if (!Array.isArray(records) || scope === "payment_status") return [];
  if (scope === "user") {
    return records.filter((record) => userFinanceRecordVisible(record, actor));
  }
  const companyId = actor.companyId;
  return records.filter((record) => (
    record.ownerCompanyId === companyId
    || record.companyId === companyId
    || record.clientCompanyId === companyId
    || record.carrierCompanyId === companyId
    || record.partnerCompanyId === companyId
    || record.providerCompanyId === companyId
    || record.payerCompanyId === companyId
    || record.payeeCompanyId === companyId
    || record.recipientCompanyId === companyId
    || financialTransportIds.has(record.transportId)
  ));
}

function userFinanceRecordVisible(record, actor) {
  if (!record || !actor?.userId) return false;
  return [
    record.ownerUserId,
    record.userId,
    record.driverUserId,
    record.recipientUserId,
    record.payerUserId,
    record.payeeUserId
  ].includes(actor.userId);
}

function platformFinanceRole(actor) {
  return hasPermission(actor, FinancePermissions.WALLET_PLATFORM_READ);
}

function canViewKnowledgeLibrary(actor) {
  return [
    KnowledgePermissions.READ,
    KnowledgePermissions.MANAGE,
    KnowledgePermissions.COMPLIANCE_READ,
    KnowledgePermissions.ACADEMY_READ
  ].some((permission) => hasPermission(actor, permission));
}

function canManageKnowledge(actor) {
  return [
    KnowledgePermissions.MANAGE,
    KnowledgePermissions.SOURCE_CREATE,
    KnowledgePermissions.SOURCE_UPDATE,
    KnowledgePermissions.SOURCE_ARCHIVE,
    KnowledgePermissions.COMPLIANCE_READ
  ].some((permission) => hasPermission(actor, permission));
}

function hasPermission(actor, permission) {
  return (actor.permissions || []).includes(permission);
}

function canSelectContext(context) {
  const payload = context.payload || {};
  const actor = context.actor || {};
  if (payload.contextType === "private") return { ok: true, reason: "private context allowed" };
  if (payload.contextType === "platform") {
    const canUsePlatform = (actor.contextOptions || []).some((option) => option.contextType === "platform")
      || hasPermission(actor, FinancePermissions.WALLET_PLATFORM_READ)
      || hasPermission(actor, AdminPermissions.AUDIT_READ);
    return canUsePlatform
      ? { ok: true, reason: "platform context allowed" }
      : { ok: false, reason: "brak uprawnien operatora GL" };
  }
  const companyId = payload.companyId;
  const canUseCompany = (context.state.userCompanyRoles || []).some((membership) => (
    membership.userId === actor.userId
    && membership.companyId === companyId
    && membership.status === "active"
  ));
  return canUseCompany
    ? { ok: true, reason: "company context allowed" }
    : { ok: false, reason: "uzytkownik nie jest przypisany do tej firmy" };
}

function canSelectRole(context) {
  const requestedRole = context.payload?.role;
  const actor = context.actor || {};
  const user = (context.state.users || []).find((item) => item.id === actor.userId);
  const directRoles = user?.roles || [];
  const contextRoles = (actor.contextOptions || []).flatMap((option) => option.compatibleRoles || []);
  const allowedRoles = [...new Set([...directRoles, ...contextRoles])];
  if (allowedRoles.includes(requestedRole)) {
    return { ok: true, reason: "rola przypisana do aktywnego uzytkownika" };
  }
  return {
    ok: false,
    reason: "rola nie jest przypisana do aktywnego user_id"
  };
}

function accountApproved(actor) {
  return [AccountStatuses.APPROVED, AccountStatuses.VERIFIED].includes(actor.accountStatus);
}

function financialTransportIdsForScope(snapshot, actor, scope, visibleTransportIds) {
  if (scope === "client") {
    return new Set(snapshot.transports
      .filter((transport) => transport.clientCompanyId === actor.companyId)
      .map((transport) => transport.id));
  }
  if (scope === "carrier") {
    return new Set(snapshot.transports
      .filter((transport) => transport.carrierCompanyId === actor.companyId)
      .map((transport) => transport.id));
  }
  if (scope === "insurance") {
    return new Set((snapshot.insurancePolicies || [])
      .map((policy) => policy.transportId)
      .filter((transportId) => visibleTransportIds.has(transportId)));
  }
  if (scope === "service") {
    return new Set([
      ...(snapshot.servicePayments || [])
        .filter((payment) => payment.providerCompanyId === actor.companyId)
        .map((payment) => payment.transportId),
      ...(snapshot.serviceRequests || [])
        .filter((request) => request.providerCompanyId === actor.companyId)
        .map((request) => request.transportId)
    ].filter((transportId) => visibleTransportIds.has(transportId)));
  }
  if (scope === "payment_status") {
    return new Set([...visibleTransportIds]);
  }
  return new Set();
}

function sanitizeAuthorityTransport(transport) {
  return {
    ...transport,
    clientCompanyId: null,
    warehouseWorkerId: null,
    driverId: null,
    cargo: {
      description: "dane ograniczone do kontroli",
      weightKg: null,
      dimensions: "ograniczone",
      prePublishPhotoId: null
    },
    price: null,
    paymentStatus: "restricted",
    photoIds: [],
    activeDisputeId: null,
    activeClaimId: null,
    legalStatus: transport.riskFlagged ? "do sprawdzenia" : "brak blokady prawnej"
  };
}

function sanitizeServiceTransport(transport) {
  return {
    ...transport,
    clientCompanyId: null,
    warehouseWorkerId: null,
    cargo: {
      description: "dane niedostępne dla serwisu",
      weightKg: null,
      dimensions: "ograniczone",
      prePublishPhotoId: null
    },
    price: null,
    paymentStatus: "restricted",
    documentIds: [],
    photoIds: [],
    activeDisputeId: null,
    activeClaimId: null,
    riskFlagged: false
  };
}
