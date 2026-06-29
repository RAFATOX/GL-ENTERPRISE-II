import {
  ActionTypes,
  AccountStatuses,
  CompanyRoleNames,
  CompanyVerificationStatuses,
  CriticalTransportActions,
  EventTypes,
  PaymentStatuses,
  Roles,
  SourceTypes,
  TransportStatuses
} from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";
import {
  isAccountApproved,
  onboardingActionTypes,
  roleForOperationalAction
} from "../onboarding/registration-onboarding-engine.js";
import { validation as validationMessage } from "../translation/ui-translation-engine.js";

function v(key, params = {}) {
  return validationMessage(key, params);
}

const nextStatusByAction = {
  [ActionTypes.START_PICKUP_NAVIGATION]: [TransportStatuses.DRIVER_ASSIGNED, TransportStatuses.PICKUP_NAVIGATION_STARTED, EventTypes.GPS_COORDINATES_CONFIRMED, "pickup navigation started"],
  [ActionTypes.ARRIVE_PICKUP]: [TransportStatuses.PICKUP_NAVIGATION_STARTED, TransportStatuses.ARRIVED_AT_PICKUP, EventTypes.DRIVER_ARRIVED_PICKUP, "driver arrived at pickup GPS point"],
  [ActionTypes.START_LOADING]: [TransportStatuses.ARRIVED_AT_PICKUP, TransportStatuses.LOADING_STARTED, EventTypes.LOADING_STARTED, "loading started"],
  [ActionTypes.CONFIRM_LOADING]: [TransportStatuses.LOADING_STARTED, TransportStatuses.LOADING_CONFIRMED, EventTypes.LOADING_CONFIRMED, "loading confirmed with evidence"],
  [ActionTypes.START_TRANSIT]: [TransportStatuses.PICKUP_DOCUMENTS_UPLOADED, TransportStatuses.IN_TRANSIT, EventTypes.TRANSPORT_IN_TRANSIT, "transport entered transit"],
  [ActionTypes.ARRIVE_DELIVERY]: [TransportStatuses.IN_TRANSIT, TransportStatuses.ARRIVED_AT_DELIVERY, EventTypes.GPS_COORDINATES_CONFIRMED, "driver arrived at delivery GPS point"],
  [ActionTypes.START_UNLOADING]: [TransportStatuses.ARRIVED_AT_DELIVERY, TransportStatuses.UNLOADING_STARTED, EventTypes.GPS_COORDINATES_CONFIRMED, "unloading started"],
  [ActionTypes.CONFIRM_DELIVERY]: [TransportStatuses.UNLOADING_STARTED, TransportStatuses.DELIVERY_CONFIRMED, EventTypes.DELIVERY_CONFIRMED, "delivery confirmed"]
};
const onboardingActions = new Set(onboardingActionTypes(ActionTypes));
const authActions = new Set([
  ActionTypes.AUTH_LOGIN_START,
  ActionTypes.AUTH_LOGIN_VERIFY_OTP,
  ActionTypes.AUTH_LOGOUT,
  ActionTypes.AUTH_PASSWORD_RESET_START,
  ActionTypes.AUTH_PASSWORD_RESET_CONFIRM
]);

export class WorkflowEngine {
  validate(context, modules) {
    const { actionType, payload, state, actor } = context;
    const reasons = [];
    const selectedTransport = modules.transports.getById(payload.transportId || state.session.selectedTransportId);

    if (!isAccountApproved(actor) && !sessionOnly(actionType) && !onboardingActions.has(actionType) && !authActions.has(actionType)) {
      reasons.push(v("account_not_verified", { status: actor.accountStatus }));
    }

    const verificationRole = actor.permissionsSource === "company_engine"
      ? actor.role
      : roleForOperationalAction(actionType, ActionTypes, actor.role);
    if (requiresVerifiedRole(actionType) && !modules.onboarding.canUseRole(actor, verificationRole)) {
      reasons.push(v("role_documents_required"));
    }

    if (requiresVerifiedCompany(actionType) && actor.companyId && !companyVerified(actor)) {
      reasons.push(v("company_not_verified", { status: actor.companyVerificationStatus }));
    }

    if (CriticalTransportActions.has(actionType) && selectedTransport) {
      if (selectedTransport.activeDisputeId) reasons.push(v("active_dispute_blocks"));
      if (selectedTransport.riskFlagged) reasons.push(v("ai_risk_blocks"));
    }

    switch (actionType) {
      case ActionTypes.SELECT_CONTEXT:
        if (!payload.contextType) reasons.push(v("context_type_required"));
        if (payload.contextType === "company" && !payload.companyId) reasons.push(v("company_id_required"));
        break;
      case ActionTypes.SELECT_ROLE:
        if (!payload.role) reasons.push(v("target_role_required"));
        break;
      case ActionTypes.SELECT_VIEW:
        if (!payload.view) reasons.push(v("target_view_required"));
        break;
      case ActionTypes.SELECT_TRANSPORT:
        if (!modules.transports.getById(payload.transportId)) reasons.push(v("transport_not_found"));
        break;
      case ActionTypes.REGISTER_USER:
        if (!payload.phone) reasons.push(v("phone_required"));
        if (!payload.role) reasons.push(v("role_required"));
        break;
      case ActionTypes.VERIFY_ACCOUNT:
      case ActionTypes.CHANGE_PHONE:
        if (!payload.userId) reasons.push(v("user_id_required"));
        if (actionType === ActionTypes.CHANGE_PHONE && !payload.phone) reasons.push(v("phone_required"));
        break;
      case ActionTypes.AUTH_LOGIN_START:
        if (!payload.identifier && !payload.phone && !payload.email) reasons.push(v("login_required"));
        break;
      case ActionTypes.AUTH_LOGIN_VERIFY_OTP:
        if (!payload.challengeId) reasons.push(v("otp_challenge_required"));
        if (!payload.otpCode) reasons.push(v("otp_code_required"));
        break;
      case ActionTypes.AUTH_LOGOUT:
        break;
      case ActionTypes.AUTH_PASSWORD_RESET_START:
        if (!payload.identifier && !payload.phone && !payload.email) reasons.push(v("login_required"));
        break;
      case ActionTypes.AUTH_PASSWORD_RESET_CONFIRM:
        if (!payload.challengeId) reasons.push(v("otp_challenge_required"));
        if (!payload.otpCode) reasons.push(v("otp_code_required"));
        if (!payload.newPassword) reasons.push(v("new_password_required"));
        break;
      case ActionTypes.CREATE_COMPANY:
        validateCreateCompany(payload, reasons);
        break;
      case ActionTypes.UPDATE_COMPANY:
        if (!payload.companyId && !actor.companyId) reasons.push(v("company_id_required"));
        break;
      case ActionTypes.INVITE_COMPANY_USER:
        if (!payload.userId) reasons.push(v("user_id_required"));
        if (!payload.companyId && !actor.companyId) reasons.push(v("company_id_required"));
        if (!payload.roleName) reasons.push(v("role_required"));
        break;
      case ActionTypes.ACCEPT_COMPANY_INVITATION:
        if (!payload.userCompanyRoleId && !payload.companyId) reasons.push(v("company_id_required"));
        break;
      case ActionTypes.CHANGE_COMPANY_USER_ROLE:
        if (!payload.userId && !payload.userCompanyRoleId) reasons.push(v("user_id_required"));
        if (!payload.roleName) reasons.push(v("role_required"));
        break;
      case ActionTypes.CHANGE_COMPANY_USER_PERMISSIONS:
        if (!payload.userId && !payload.userCompanyRoleId) reasons.push(v("user_id_required"));
        break;
      case ActionTypes.REMOVE_COMPANY_USER:
        if (!payload.userId && !payload.userCompanyRoleId) reasons.push(v("user_id_required"));
        break;
      case ActionTypes.UPLOAD_COMPANY_DOCUMENT:
        if (!payload.companyId && !actor.companyId) reasons.push(v("company_id_required"));
        if (!payload.type) reasons.push(v("identity_document_required"));
        break;
      case ActionTypes.VERIFY_COMPANY:
      case ActionTypes.REJECT_COMPANY_VERIFICATION:
      case ActionTypes.SUSPEND_COMPANY:
        if (!payload.companyId) reasons.push(v("company_id_required"));
        break;
      case ActionTypes.ONBOARDING_START:
        validateOnboardingStart(payload, reasons);
        break;
      case ActionTypes.ONBOARDING_VERIFY_PHONE:
        if (!payload.userId) reasons.push(v("user_id_required"));
        if (!payload.otpCode) reasons.push(v("otp_code_required"));
        break;
      case ActionTypes.ONBOARDING_CREATE_ACCOUNT:
        validateOnboardingAccount(payload, reasons);
        break;
      case ActionTypes.ONBOARDING_SELECT_ROLE:
        if (!payload.userId) reasons.push(v("user_id_required"));
        if (!payload.role) reasons.push(v("role_required"));
        break;
      case ActionTypes.ONBOARDING_SUBMIT_IDENTITY:
        validateOnboardingIdentity(payload, reasons);
        break;
      case ActionTypes.ONBOARDING_SUBMIT_ROLE_DOCUMENTS:
        if (!payload.userId) reasons.push(v("user_id_required"));
        if (!payload.role) reasons.push(v("role_required"));
        break;
      case ActionTypes.ONBOARDING_SUBMIT_COMPANY:
        if (!payload.userId) reasons.push(v("user_id_required"));
        if (!payload.companyName) reasons.push(v("company_name_required"));
        break;
      case ActionTypes.ONBOARDING_APPROVE:
      case ActionTypes.ONBOARDING_REJECT:
        if (!payload.userId) reasons.push(v("user_id_required"));
        break;
      case ActionTypes.ADD_COMPANY_DRIVER:
        validateAddCompanyDriver(actor, payload, reasons);
        break;
      case ActionTypes.ADD_VEHICLE:
        validateAddVehicle(actor, payload, reasons);
        break;
      case ActionTypes.CREATE_KNOWLEDGE_SOURCE:
        if (!payload.title) reasons.push(v("knowledge_title_required"));
        if (!payload.type) reasons.push(v("knowledge_type_required"));
        break;
      case ActionTypes.UPDATE_KNOWLEDGE_SOURCE:
      case ActionTypes.ARCHIVE_KNOWLEDGE_SOURCE:
        if (!payload.knowledge_source_id && !payload.id) reasons.push(v("knowledge_source_id_required"));
        break;
      case ActionTypes.CREATE_LOAD:
        if (!actor.companyId && !payload.clientCompanyId) reasons.push(v("client_company_required"));
        if (!payload.description) reasons.push(v("load_description_required"));
        if (!payload.pickupAddress) reasons.push(v("pickup_address_required"));
        if (!payload.deliveryAddress) reasons.push(v("delivery_address_required"));
        break;
      case ActionTypes.ADD_LOAD_PHOTO:
        requireTransport(selectedTransport, reasons);
        break;
      case ActionTypes.CONFIRM_GPS:
        requireTransport(selectedTransport, reasons);
        if (!payload.pickupGps && !payload.deliveryGps) reasons.push(v("gps_point_required"));
        break;
      case ActionTypes.PUBLISH_LOAD:
        validatePublish(selectedTransport, modules, reasons);
        break;
      case ActionTypes.ACCEPT_CARRIER:
        validateCarrierAccept(selectedTransport, payload, modules, reasons);
        break;
      case ActionTypes.ASSIGN_DRIVER:
        validateDriverAssignment(selectedTransport, payload, modules, reasons);
        break;
      case ActionTypes.START_TRANSIT:
        validateTransition(selectedTransport, actionType, modules, reasons);
        if (!modules.documents.hasDocumentType(selectedTransport, "pickup_confirmation")) {
          reasons.push(v("pickup_confirmation_required"));
        }
        break;
      case ActionTypes.RELEASE_PAYMENT:
        validatePaymentRelease(selectedTransport, modules, reasons);
        break;
      case ActionTypes.SEND_MESSAGE:
        requireTransport(selectedTransport, reasons);
        if (!payload.body) reasons.push(v("message_required"));
        break;
      case ActionTypes.REQUEST_TRANSLATION:
        if (!payload.messageId) reasons.push(v("message_id_required"));
        if (payload.messageId && !modules.communication.getMessage(payload.messageId)) reasons.push(v("message_not_found"));
        break;
      case ActionTypes.SCAN_LICENSE_PLATE:
        if (!payload.licensePlate) reasons.push(v("license_plate_required"));
        break;
      case ActionTypes.RECORD_SECURITY_CHECK:
        requireTransport(selectedTransport, reasons);
        if (!["pickup", "delivery"].includes(payload.checkpoint)) reasons.push("checkpoint must be pickup or delivery");
        break;
      case ActionTypes.MARK_CUSTOMS_REQUIRED:
      case ActionTypes.SEND_TO_CUSTOMS:
      case ActionTypes.START_CUSTOMS:
      case ActionTypes.CLEAR_CUSTOMS:
      case ActionTypes.HOLD_CUSTOMS:
        validateCustomsTransition(selectedTransport, actionType, modules, reasons);
        break;
      case ActionTypes.START_AUTHORITY_CONTROL:
      case ActionTypes.RECORD_DOCUMENT_CHECK:
      case ActionTypes.RECORD_ROAD_INSPECTION:
      case ActionTypes.PASS_AUTHORITY_CONTROL:
      case ActionTypes.REPORT_AUTHORITY_ISSUE:
        validateAuthorityTransition(selectedTransport, actionType, modules, reasons);
        break;
      case ActionTypes.MARK_FERRY_REQUIRED:
      case ActionTypes.BOOK_FERRY:
      case ActionTypes.START_PORT_NAVIGATION:
      case ActionTypes.CHECK_IN_FERRY:
      case ActionTypes.BOARD_FERRY:
      case ActionTypes.COMPLETE_FERRY:
        validateFerryTransition(selectedTransport, actionType, modules, reasons);
        break;
      case ActionTypes.REPORT_BREAKDOWN:
      case ActionTypes.REQUEST_TECHNICAL_SERVICE:
      case ActionTypes.ACCEPT_SERVICE_JOB:
      case ActionTypes.COMPLETE_SERVICE_JOB:
        validateServiceAction(selectedTransport, actionType, modules, reasons);
        break;
      case ActionTypes.SIMULATE_API_CALL:
        if (payload.apiClientId && !modules.api.getClient(payload.apiClientId)) reasons.push("api client not found");
        break;
      case ActionTypes.RUN_INTEGRATION_SYNC:
        if (payload.integrationId && !modules.integrations.getById(payload.integrationId)) reasons.push("integration not found");
        break;
      case ActionTypes.RUN_COMPLIANCE_CHECK:
        requireTransport(selectedTransport, reasons);
        break;
      case ActionTypes.RUN_RESILIENCE_CHECK:
        break;
      case ActionTypes.OPEN_CLAIM:
        requireTransport(selectedTransport, reasons);
        if (selectedTransport && !selectedTransport.insuranceId) reasons.push("transport has no insurance policy");
        break;
      case ActionTypes.PARKING_REPORT:
        if (!payload.parkingId) reasons.push("parking id is required");
        break;
      case ActionTypes.AI_RUN_CHECK:
      case ActionTypes.ADMIN_BLOCK_TRANSPORT:
      case ActionTypes.OPEN_DISPUTE:
      case ActionTypes.UPLOAD_DOCUMENT:
        requireTransport(selectedTransport, reasons);
        break;
      case ActionTypes.ADMIN_RESOLVE_DISPUTE:
        requireTransport(selectedTransport, reasons);
        if (selectedTransport && !selectedTransport.activeDisputeId) reasons.push("no active dispute to resolve");
        break;
      case ActionTypes.ADMIN_BLOCK_ACCOUNT:
        if (!payload.userId) reasons.push("user id is required");
        break;
      case ActionTypes.SELECT_PARKING:
      case ActionTypes.START_BREAK:
      case ActionTypes.FINISH_BREAK:
      case ActionTypes.START_PICKUP_NAVIGATION:
      case ActionTypes.ARRIVE_PICKUP:
      case ActionTypes.START_LOADING:
      case ActionTypes.CONFIRM_LOADING:
      case ActionTypes.ARRIVE_DELIVERY:
      case ActionTypes.START_UNLOADING:
      case ActionTypes.CONFIRM_DELIVERY:
        validateTransition(selectedTransport, actionType, modules, reasons);
        break;
      default:
        break;
    }

    return {
      ok: reasons.length === 0,
      reasons
    };
  }

  apply(context, modules) {
    const { actionType, payload, state, actor } = context;
    const events = [];
    const transport = modules.transports.getById(payload.transportId || state.session.selectedTransportId);

    switch (actionType) {
      case ActionTypes.SELECT_CONTEXT:
        return this.selectContext(state, modules, payload, actor);
      case ActionTypes.SELECT_ROLE:
        return this.selectRole(state, modules, payload, context);
      case ActionTypes.SELECT_VIEW:
        state.session.view = payload.view;
        state.session.selectedVehicleId = payload.view === "companies" ? payload.selectedVehicleId || state.session.selectedVehicleId || null : null;
        if (payload.view === "profile") {
          state.session.profileTargetId = payload.profileTargetId || null;
          state.session.profileTargetType = payload.profileTargetType || null;
        } else {
          state.session.profileTargetId = null;
          state.session.profileTargetType = null;
        }
        state.session.deniedView = null;
        state.session.deniedRoute = null;
        return {
          events: [sessionEvent(EventTypes.UI_VIEW_CHANGED, payload.view, "demo view selected")]
        };
      case ActionTypes.SELECT_TRANSPORT:
        state.session.selectedTransportId = payload.transportId;
        return {
          events: [sessionEvent(EventTypes.UI_VIEW_CHANGED, payload.transportId, "transport selected")]
        };
      case ActionTypes.REGISTER_USER:
        return modules.auth.registerPhoneUser(payload);
      case ActionTypes.VERIFY_ACCOUNT:
        return modules.auth.verifyAccount(payload.userId);
      case ActionTypes.CHANGE_PHONE:
        return modules.auth.changePhone(payload.userId, payload.phone);
      case ActionTypes.AUTH_LOGIN_START:
        return modules.auth.startLogin(payload);
      case ActionTypes.AUTH_LOGIN_VERIFY_OTP:
        return modules.auth.verifyLogin(payload, modules.companies);
      case ActionTypes.AUTH_LOGOUT:
        return modules.auth.logout(payload);
      case ActionTypes.AUTH_PASSWORD_RESET_START:
        return modules.auth.requestPasswordReset(payload);
      case ActionTypes.AUTH_PASSWORD_RESET_CONFIRM:
        return modules.auth.confirmPasswordReset(payload);
      case ActionTypes.CREATE_COMPANY:
        return modules.companies.createCompany(actor, payload);
      case ActionTypes.UPDATE_COMPANY:
        return modules.companies.updateCompany(actor, payload);
      case ActionTypes.INVITE_COMPANY_USER:
        return modules.companies.inviteUser(actor, payload);
      case ActionTypes.ACCEPT_COMPANY_INVITATION:
        return modules.companies.acceptInvitation(actor, payload);
      case ActionTypes.CHANGE_COMPANY_USER_ROLE:
        return modules.companies.changeUserRole(actor, payload);
      case ActionTypes.CHANGE_COMPANY_USER_PERMISSIONS:
        return modules.companies.changeUserPermissions(actor, payload);
      case ActionTypes.REMOVE_COMPANY_USER:
        return modules.companies.removeUser(actor, payload);
      case ActionTypes.UPLOAD_COMPANY_DOCUMENT:
        return modules.companies.uploadCompanyDocument(actor, payload);
      case ActionTypes.VERIFY_COMPANY:
        return modules.companies.verifyCompany(actor, payload);
      case ActionTypes.REJECT_COMPANY_VERIFICATION:
        return modules.companies.rejectCompany(actor, payload);
      case ActionTypes.SUSPEND_COMPANY:
        return modules.companies.suspendCompany(actor, payload);
      case ActionTypes.ONBOARDING_START:
        return modules.onboarding.start(payload);
      case ActionTypes.ONBOARDING_VERIFY_PHONE:
        return modules.onboarding.verifyPhone(payload);
      case ActionTypes.ONBOARDING_CREATE_ACCOUNT:
        return modules.onboarding.createAccount(payload);
      case ActionTypes.ONBOARDING_SELECT_ROLE:
        return modules.onboarding.selectRole(payload);
      case ActionTypes.ONBOARDING_SUBMIT_IDENTITY:
        return modules.onboarding.submitIdentity(payload);
      case ActionTypes.ONBOARDING_SUBMIT_ROLE_DOCUMENTS:
        return modules.onboarding.submitRoleDocuments(payload);
      case ActionTypes.ONBOARDING_SUBMIT_COMPANY:
        return modules.onboarding.submitCompany(payload);
      case ActionTypes.ONBOARDING_APPROVE:
        return modules.onboarding.approve(payload);
      case ActionTypes.ONBOARDING_REJECT:
        return modules.onboarding.reject(payload);
      case ActionTypes.ADD_COMPANY_DRIVER:
        return this.addCompanyDriver(state, actor, payload);
      case ActionTypes.ADD_VEHICLE:
        return this.addVehicle(state, actor, payload);
      case ActionTypes.CREATE_KNOWLEDGE_SOURCE:
        return modules.knowledge.registerSource(actor, payload);
      case ActionTypes.UPDATE_KNOWLEDGE_SOURCE:
        return modules.knowledge.updateSource(actor, payload);
      case ActionTypes.ARCHIVE_KNOWLEDGE_SOURCE:
        return modules.knowledge.archiveSource(actor, payload);
      case ActionTypes.CREATE_LOAD: {
        const created = modules.transports.createDraft(actor, payload);
        return {
          events: [{
            type: EventTypes.LOAD_CREATED,
            objectType: "transport",
            objectId: created.id,
            previousState: null,
            newState: created.status,
            reason: "load created through Transport Engine"
          }]
        };
      }
      case ActionTypes.ADD_LOAD_PHOTO: {
        const previous = transport.status;
        const result = modules.photos.addPhoto(transport, actor, payload);
        if (transport.cargo.prePublishPhotoId && modules.gps.transportHasCoordinates(transport)) {
          modules.transports.setStatus(transport, TransportStatuses.READY_TO_PUBLISH, actor, "photo and GPS present");
        }
        result.event.previousState = previous;
        result.event.newState = transport.status;
        return { events: [result.event] };
      }
      case ActionTypes.CONFIRM_GPS: {
        const previous = transport.status;
        const event = modules.gps.confirmCoordinates(transport, payload);
        if (transport.cargo.prePublishPhotoId && modules.gps.transportHasCoordinates(transport)) {
          modules.transports.setStatus(transport, TransportStatuses.READY_TO_PUBLISH, actor, "GPS and photo present");
        }
        event.previousState = previous;
        event.newState = transport.status;
        return { events: [event] };
      }
      case ActionTypes.PUBLISH_LOAD:
        return { events: [statusEvent(modules, transport, actor, TransportStatuses.PUBLISHED, EventTypes.LOAD_PUBLISHED, "load published to carrier market")] };
      case ActionTypes.ACCEPT_CARRIER: {
        transport.carrierCompanyId = payload.carrierCompanyId;
        return { events: [statusEvent(modules, transport, actor, TransportStatuses.CARRIER_ACCEPTED, EventTypes.CARRIER_ACCEPTED, "carrier accepted and payment reserved")] };
      }
      case ActionTypes.ASSIGN_DRIVER: {
        transport.driverId = payload.driverId;
        transport.vehicleId = payload.vehicleId;
        return { events: [statusEvent(modules, transport, actor, TransportStatuses.DRIVER_ASSIGNED, EventTypes.DRIVER_ASSIGNED, "driver and vehicle assigned")] };
      }
      case ActionTypes.UPLOAD_DOCUMENT: {
        const previous = transport.status;
        const result = modules.documents.upload(transport, actor, payload);
        if (payload.type === "pickup_confirmation" && transport.status === TransportStatuses.LOADING_CONFIRMED) {
          modules.transports.setStatus(transport, TransportStatuses.PICKUP_DOCUMENTS_UPLOADED, actor, "pickup document uploaded");
        }
        if (payload.type === "delivery_confirmation" && transport.status === TransportStatuses.DELIVERY_CONFIRMED) {
          modules.transports.setStatus(transport, TransportStatuses.DELIVERY_DOCUMENTS_UPLOADED, actor, "delivery document uploaded");
          modules.transports.setStatus(transport, TransportStatuses.PAYMENT_PENDING, actor, "payment can be released");
        }
        result.event.previousState = previous;
        result.event.newState = transport.status;
        return { events: [result.event] };
      }
      case ActionTypes.SELECT_PARKING: {
        transport.currentParkingId = payload.parkingId;
        return { events: [statusEvent(modules, transport, actor, TransportStatuses.PARKING_BREAK, EventTypes.PARKING_SELECTED, "parking selected for legal break")] };
      }
      case ActionTypes.START_BREAK:
        modules.driverTime.startBreak(transport.driverId);
        return { events: [statusEvent(modules, transport, actor, TransportStatuses.PARKING_BREAK, EventTypes.BREAK_STARTED, "driver break started")] };
      case ActionTypes.FINISH_BREAK:
        return { events: [statusEvent(modules, transport, actor, TransportStatuses.IN_TRANSIT, EventTypes.BREAK_FINISHED, "driver break finished")] };
      case ActionTypes.RELEASE_PAYMENT: {
        const previous = transport.status;
        const paymentEvent = modules.payments.release(transport, { actor });
        modules.transports.setStatus(transport, TransportStatuses.PAID, actor, "payment released");
        paymentEvent.previousState = previous;
        paymentEvent.newState = transport.status;
        const completedEvent = statusEvent(modules, transport, actor, TransportStatuses.COMPLETED, EventTypes.TRANSPORT_COMPLETED, "transport completed after payment release");
        return { events: [paymentEvent, completedEvent] };
      }
      case ActionTypes.SEND_MESSAGE: {
        const result = modules.communication.sendMessage(transport, actor, payload);
        return { events: [result.event] };
      }
      case ActionTypes.REQUEST_TRANSLATION: {
        const message = modules.communication.getMessage(payload.messageId);
        const event = modules.translation.translateMessage(message, payload.targetLanguage || state.session.language || "pl");
        return { events: event ? [event] : [] };
      }
      case ActionTypes.SCAN_LICENSE_PLATE: {
        const result = modules.plateToDriver.scan(actor, payload);
        return { events: [result.event] };
      }
      case ActionTypes.RECORD_SECURITY_CHECK: {
        const result = modules.security.record(transport, actor, payload);
        return { events: [result.event] };
      }
      case ActionTypes.MARK_CUSTOMS_REQUIRED:
        return modules.customs.markRequired(transport, actor, payload, modules);
      case ActionTypes.SEND_TO_CUSTOMS:
        return modules.customs.sendToCustoms(transport, actor, payload, modules);
      case ActionTypes.START_CUSTOMS:
        return modules.customs.start(transport, actor, payload, modules);
      case ActionTypes.CLEAR_CUSTOMS:
        return modules.customs.clear(transport, actor, payload, modules);
      case ActionTypes.HOLD_CUSTOMS:
        return modules.customs.hold(transport, actor, payload, modules);
      case ActionTypes.START_AUTHORITY_CONTROL:
        return modules.authority.start(transport, actor, payload, modules);
      case ActionTypes.RECORD_DOCUMENT_CHECK:
        return modules.authority.documentCheck(transport, actor, payload, modules);
      case ActionTypes.RECORD_ROAD_INSPECTION:
        return modules.authority.roadInspection(transport, actor, payload, modules);
      case ActionTypes.PASS_AUTHORITY_CONTROL:
        return modules.authority.pass(transport, actor, payload, modules);
      case ActionTypes.REPORT_AUTHORITY_ISSUE:
        return modules.authority.issue(transport, actor, payload, modules);
      case ActionTypes.MARK_FERRY_REQUIRED:
        return modules.ferry.markRequired(transport, actor, payload, modules);
      case ActionTypes.BOOK_FERRY:
        return modules.ferry.book(transport, actor, payload, modules);
      case ActionTypes.START_PORT_NAVIGATION:
        return modules.ferry.startPortNavigation(transport, actor, payload, modules);
      case ActionTypes.CHECK_IN_FERRY:
        return modules.ferry.checkIn(transport, actor, payload, modules);
      case ActionTypes.BOARD_FERRY:
        return modules.ferry.board(transport, actor, payload, modules);
      case ActionTypes.COMPLETE_FERRY:
        return modules.ferry.complete(transport, actor, payload, modules);
      case ActionTypes.REPORT_BREAKDOWN:
        return modules.service.reportBreakdown(transport, actor, payload, modules);
      case ActionTypes.REQUEST_TECHNICAL_SERVICE:
        return modules.service.requestService(transport, actor, payload, modules);
      case ActionTypes.ACCEPT_SERVICE_JOB:
        return modules.service.acceptService(transport, actor, payload, modules);
      case ActionTypes.COMPLETE_SERVICE_JOB:
        return modules.service.completeService(transport, actor, payload, modules);
      case ActionTypes.SIMULATE_API_CALL: {
        const result = modules.api.simulateCall(actor, payload);
        return { events: [result.event] };
      }
      case ActionTypes.RUN_INTEGRATION_SYNC: {
        const result = modules.integrations.sync(actor, payload);
        return { events: [result.event] };
      }
      case ActionTypes.RUN_COMPLIANCE_CHECK: {
        const result = modules.compliance.runDriverCheck(transport, modules);
        return { events: [result.event] };
      }
      case ActionTypes.RUN_RESILIENCE_CHECK:
        return { events: modules.resilience.runCheck().events };
      case ActionTypes.OPEN_DISPUTE:
        return modules.disputes.open(transport, actor, payload, modules);
      case ActionTypes.OPEN_CLAIM: {
        const previous = transport.status;
        const result = modules.insurance.openClaim(transport, actor, payload);
        modules.transports.setStatus(transport, TransportStatuses.CLAIM_OPENED, actor, "claim opened");
        result.event.previousState = previous;
        result.event.newState = transport.status;
        return { events: [result.event] };
      }
      case ActionTypes.AI_RUN_CHECK:
        return { events: modules.ai.inspectTransport(transport, modules).events };
      case ActionTypes.ADMIN_BLOCK_TRANSPORT:
        modules.payments.setStatus(transport, PaymentStatuses.BLOCKED, {
          actor,
          reason: payload.reason || "manual admin block"
        });
        return { events: [statusEvent(modules, transport, actor, TransportStatuses.BLOCKED, EventTypes.TRANSPORT_BLOCKED, payload.reason || "manual admin block")] };
      case ActionTypes.ADMIN_RESOLVE_DISPUTE:
        return modules.disputes.resolve(transport, actor, payload, modules);
      case ActionTypes.ADMIN_BLOCK_ACCOUNT:
        return this.blockAccount(state, payload);
      case ActionTypes.PARKING_REPORT:
        return this.parkingReport(actor, payload, modules);
      default:
        if (nextStatusByAction[actionType]) {
          const [, nextStatus, eventType, reason] = nextStatusByAction[actionType];
          return { events: [statusEvent(modules, transport, actor, nextStatus, eventType, reason)] };
        }
        return { events };
    }
  }

  selectContext(state, modules, payload, actor) {
    const previous = `${state.session.contextType || "private"}:${state.session.companyId || "none"}`;
    const user = modules.users.getById(state.session.userId);
    const requestedRole = state.session.role || user?.selectedRole || user?.roles?.[0];
    const contexts = modules.companies.contextsForUser(state.session.userId);
    const selectedContext = contexts.find((context) => (
      context.contextType === payload.contextType
      && (context.companyId || null) === (payload.companyId || null)
      && (!payload.userCompanyRoleId || context.userCompanyRoleId === payload.userCompanyRoleId)
    )) || modules.companies.contextForRole(state.session.userId, requestedRole, payload);
    const nextRole = selectedContext.compatibleRoles.includes(requestedRole)
      ? requestedRole
      : selectedContext.compatibleRoles[0];
    applySessionContext(state, modules, {
      userId: state.session.userId,
      role: nextRole,
      context: selectedContext
    });
    state.session.deniedView = null;
    state.session.deniedRoute = null;
    return {
      events: [{
        type: EventTypes.SESSION_CONTEXT_CHANGED,
        objectType: "session",
        objectId: "demo-session",
        previousState: previous,
        newState: `${state.session.contextType}:${state.session.companyId || "none"}`,
        reason: `aktywny kontekst zmieniony przez ${actor.userId}`
      }]
    };
  }

  selectRole(state, modules, payload, context) {
    const previous = `${state.session.userId}:${state.session.role}:${state.session.companyId || "none"}`;
    const currentUser = modules.users.getById(state.session.userId);
    const currentRoles = currentUser ? modules.companies.availableRolesForUser(currentUser.id) : [];
    const sameIdentity = currentUser && currentRoles.includes(payload.role);
    const user = sameIdentity
      ? currentUser
      : context.meta?.demoOnly
      ? modules.users.findDemoUserForRole(payload.role)
      : currentUser;
    if (!user) return { events: [] };
    const role = sameIdentity || user?.roles?.includes(payload.role) ? payload.role : modules.companies.roleForSession(user, { role: payload.role });
    const selectedContext = modules.companies.contextForRole(user.id, role, {
      contextType: payload.contextType || state.session.contextType,
      companyId: payload.companyId || state.session.companyId,
      userCompanyRoleId: payload.userCompanyRoleId || payload.companyRoleId || state.session.companyRoleId
    });
    applySessionContext(state, modules, {
      userId: user.id,
      role,
      context: selectedContext
    });
    user.selectedRole = role;
    user.companyId = selectedContext.companyId || user.companyId || null;
    state.session.onboardingRequired = false;
    state.session.onboardingUserId = null;
    state.session.deniedView = null;
    state.session.deniedRoute = null;
    return {
      events: [{
        type: EventTypes.SESSION_ROLE_CHANGED,
        objectType: "session",
        objectId: "demo-session",
        previousState: previous,
        newState: `${state.session.userId}:${state.session.role}:${state.session.companyId || "none"}`,
        reason: sameIdentity ? "rola zmieniona w ramach tej samej tozsamosci" : "demo role switcher selected"
      }]
    };
  }

  blockAccount(state, payload) {
    const user = state.users.find((item) => item.id === payload.userId);
    const previous = user.accountStatus;
    user.accountStatus = AccountStatuses.BLOCKED;
    return {
      events: [{
        type: EventTypes.ACCOUNT_BLOCKED,
        objectType: "user",
        objectId: user.id,
        previousState: previous,
        newState: user.accountStatus,
        reason: payload.reason || "manual admin account block"
      }]
    };
  }

  addVehicle(state, actor, payload) {
    const vehicle = {
      id: payload.vehicleId || `veh-${Date.now()}`,
      vehicle_id: payload.vehicleId || null,
      plate: normalizePlate(payload.plate),
      companyId: actor.companyId,
      company_id: actor.companyId,
      type: payload.type || "zestaw",
      vehicleType: payload.vehicleType || payload.type || "zestaw",
      brand: payload.brand || "Marka",
      model: payload.model || "Model",
      registrationCountry: payload.registrationCountry || actor.country || "PL",
      grossWeightKg: numberOrDefault(payload.grossWeightKg || payload.dmc, 40000),
      payloadKg: numberOrDefault(payload.payloadKg || payload.capacityKg, 24000),
      palletCapacity: numberOrDefault(payload.palletCapacity || payload.pallets, 33),
      bodyType: payload.bodyType || "plandeka",
      adr: yes(payload.adr),
      refrigerated: yes(payload.refrigerated),
      lift: yes(payload.lift),
      status: payload.status || "active",
      documentsValid: payload.documentsValid === undefined ? true : yes(payload.documentsValid),
      insuranceValid: payload.insuranceValid === undefined ? true : yes(payload.insuranceValid),
      technicalInspectionValid: payload.technicalInspectionValid === undefined ? true : yes(payload.technicalInspectionValid),
      available: (payload.status || "active") === "active",
      documentIds: normalizeList(payload.documentIds),
      insurancePolicy: payload.insurancePolicy || null,
      technicalInspectionExpiresAt: payload.technicalInspectionExpiresAt || null,
      createdAt: nowIso(),
      createdBy: actor.userId
    };
    vehicle.vehicle_id = vehicle.id;
    state.vehicles.unshift(vehicle);
    return {
      events: [{
        type: EventTypes.COMPANY_VERIFIED,
        objectType: "vehicle",
        objectId: vehicle.id,
        previousState: null,
        newState: "vehicle_added",
        reason: "pojazd dodany po weryfikacji przewoznika"
      }]
    };
  }

  getRelevantKnowledge(context, modules) {
    return modules.knowledge.getRelevantKnowledge(context);
  }

  addCompanyDriver(state, actor, payload) {
    const companyId = payload.companyId || actor.companyId;
    const existing = state.users.find((user) => (
      (payload.email && user.email === payload.email)
      || (payload.phone && user.phone === payload.phone)
      || (payload.userId && user.id === payload.userId)
    ));
    const driver = existing || {
      id: payload.userId || createId("user"),
      name: payload.name || `${payload.firstName || "Kierowca"} ${payload.lastName || "GL"}`.trim(),
      firstName: payload.firstName || firstName(payload.name) || "Kierowca",
      lastName: payload.lastName || lastName(payload.name) || "GL",
      email: payload.email || null,
      phone: payload.phone || null,
      language: payload.language || "pl",
      country: payload.country || "PL",
      countryOfResidence: payload.countryOfResidence || payload.country || "PL",
      userType: Roles.DRIVER,
      companyId,
      roles: [Roles.DRIVER],
      selectedRole: Roles.DRIVER,
      accountStatus: payload.verified === "false" ? AccountStatuses.ROLE_DOCUMENTS_PENDING : AccountStatuses.APPROVED,
      verificationStatus: payload.verified === "false" ? AccountStatuses.ROLE_DOCUMENTS_PENDING : AccountStatuses.APPROVED,
      onboardingStage: payload.verified === "false" ? "role_documents" : "approved",
      phoneVerified: Boolean(payload.phone),
      documentVerified: yes(payload.identityDocument || payload.documentVerified || true),
      faceVerified: yes(payload.selfie || payload.faceVerified || true),
      documentsValid: payload.documentsValid === undefined ? true : yes(payload.documentsValid),
      identityDocument: null,
      roleVerificationStatus: {
        [Roles.DRIVER]: payload.documentsValid === "false" ? AccountStatuses.ROLE_DOCUMENTS_PENDING : AccountStatuses.APPROVED
      },
      roleDocuments: {
        [Roles.DRIVER]: driverRoleDocuments(payload)
      },
      walletReady: false,
      driverTimeLegal: payload.driverTimeLegal === undefined ? true : yes(payload.driverTimeLegal),
      previousPhones: [],
      invitedBy: actor.userId,
      invitedAt: nowIso()
    };

    if (existing) {
      if (!driver.roles.includes(Roles.DRIVER)) driver.roles.push(Roles.DRIVER);
      driver.selectedRole ||= Roles.DRIVER;
      driver.companyId ||= companyId;
      driver.documentsValid = payload.documentsValid === undefined ? driver.documentsValid : yes(payload.documentsValid);
      driver.roleVerificationStatus ||= {};
      driver.roleVerificationStatus[Roles.DRIVER] = driver.documentsValid ? AccountStatuses.APPROVED : AccountStatuses.ROLE_DOCUMENTS_PENDING;
      driver.roleDocuments ||= {};
      driver.roleDocuments[Roles.DRIVER] = driverRoleDocuments(payload);
    } else {
      state.users.unshift(driver);
    }

    const membership = state.userCompanyRoles.find((item) => item.userId === driver.id && item.companyId === companyId)
      || createDriverMembership(driver.id, companyId, actor.userId);
    if (!state.userCompanyRoles.some((item) => item.id === membership.id)) state.userCompanyRoles.unshift(membership);
    membership.status = "active";
    membership.acceptedAt ||= nowIso();

    const company = state.companies.find((item) => item.id === companyId);
    company.people ||= [];
    if (!company.people.includes(driver.id)) company.people.push(driver.id);

    if (!state.driverTime.some((item) => item.driverId === driver.id)) {
      state.driverTime.push({
        driverId: driver.id,
        drivingHoursToday: 0,
        breakHours: 0,
        remainingLegalHours: 9,
        legalToComplete: driver.driverTimeLegal,
        ferryRailAllowance: false
      });
    }

    return {
      events: [
        {
          type: existing ? EventTypes.COMPANY_USER_INVITED : EventTypes.USER_REGISTERED,
          objectType: "user",
          objectId: driver.id,
          previousState: existing ? "existing_user" : null,
          newState: driver.accountStatus,
          reason: "kierowca dodany do firmy przewoznika"
        },
        {
          type: EventTypes.COMPANY_DRIVER_ADDED,
          objectType: "company",
          objectId: companyId,
          previousState: null,
          newState: driver.id,
          reason: "kierowca przypisany do firmy przez Company Engine"
        }
      ]
    };
  }

  parkingReport(actor, payload, modules) {
    const result = modules.parking.report(payload.parkingId, actor, payload);
    if (!result) return { events: [] };
    const events = [result.event];
    if (!result.report.credible) {
      const trustEvent = modules.trust.change(actor.userId, -6, "false parking report");
      if (trustEvent) events.push(trustEvent);
    }
    return { events };
  }
}

function applySessionContext(state, modules, input) {
  const context = input.context || modules.companies.contextForRole(input.userId, input.role);
  const role = input.role || context.compatibleRoles?.[0] || state.session.role;
  state.session.userId = input.userId;
  state.session.role = role;
  state.session.activeRole = role;
  state.session.contextType = context.contextType;
  state.session.companyId = context.contextType === "company" ? context.companyId : null;
  state.session.activeCompanyId = state.session.companyId;
  state.session.companyRoleId = context.userCompanyRoleId || null;
  state.session.activeContext = {
    contextType: context.contextType,
    companyId: context.companyId || null,
    userCompanyRoleId: context.userCompanyRoleId || null,
    label: context.label || null
  };
  state.session.view = "dashboard";
  state.session.selectedVehicleId = null;
  state.session.profileTargetId = null;
  state.session.profileTargetType = null;
  state.session.selectedTransportId = firstVisibleTransportForSession(state, role, context);
}

function firstVisibleTransportForSession(state, role, context) {
  const current = state.transports.find((transport) => transport.id === state.session.selectedTransportId);
  const companyId = context.companyId || null;
  const userId = state.session.userId;
  const transport = state.transports.find((item) => transportVisibleForRole(state, item, role, companyId, userId))
    || (current && transportVisibleForRole(state, current, role, companyId, userId) ? current : null);
  return transport?.id || null;
}

function transportVisibleForRole(state, transport, role, companyId, userId) {
  if (!transport) return false;
  if ([Roles.PLATFORM_OWNER, Roles.GL_OPERATOR, Roles.ADMIN_FINANCE, Roles.SUPER_ADMIN, Roles.ADMIN, Roles.COMPLIANCE, Roles.SUPPORT_AGENT, Roles.READONLY_AUDITOR].includes(role)) {
    return true;
  }
  if ([Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(role)) {
    return transport.carrierCompanyId === companyId || (!transport.carrierCompanyId && [
      TransportStatuses.PUBLISHED,
      TransportStatuses.CARRIER_OFFER_RECEIVED
    ].includes(transport.status));
  }
  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(role)) return transport.clientCompanyId === companyId;
  if (role === Roles.DRIVER) return transport.driverId === userId;
  if (role === Roles.WAREHOUSE_WORKER) return transport.warehouseWorkerId === userId || transport.clientCompanyId === companyId;
  if ([Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE].includes(role)) {
    return (state.serviceRequests || []).some((request) => (
      request.transportId === transport.id
      && (request.providerCompanyId === companyId || request.status === "breakdown_reported")
    ));
  }
  if (role === Roles.INSURANCE_PARTNER) {
    return (state.insurancePolicies || []).some((policy) => policy.id === transport.insuranceId)
      || Boolean(transport.activeClaimId || transport.riskFlagged);
  }
  if (role === Roles.SECURITY_GUARD || role === Roles.AUTHORITY_USER || role === Roles.CUSTOMS_AGENT) return true;
  if (role === Roles.FERRY_OPERATOR || role === Roles.RAIL_OPERATOR) return ["FERRY", "TRAIN", "INTERMODAL"].includes(transport.transportMode);
  return false;
}

function sessionOnly(actionType) {
  return [ActionTypes.SELECT_CONTEXT, ActionTypes.SELECT_ROLE, ActionTypes.SELECT_VIEW, ActionTypes.SELECT_TRANSPORT].includes(actionType);
}

function requiresVerifiedRole(actionType) {
  return [
    ActionTypes.CREATE_LOAD,
    ActionTypes.PUBLISH_LOAD,
    ActionTypes.ACCEPT_CARRIER,
    ActionTypes.ASSIGN_DRIVER,
    ActionTypes.ADD_COMPANY_DRIVER,
    ActionTypes.ADD_VEHICLE,
    ActionTypes.START_PICKUP_NAVIGATION,
    ActionTypes.START_TRANSIT,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.OPEN_CLAIM,
    ActionTypes.RELEASE_PAYMENT
  ].includes(actionType);
}

function requiresVerifiedCompany(actionType) {
  return [
    ActionTypes.CREATE_LOAD,
    ActionTypes.PUBLISH_LOAD,
    ActionTypes.ACCEPT_CARRIER,
    ActionTypes.ASSIGN_DRIVER,
    ActionTypes.ADD_COMPANY_DRIVER,
    ActionTypes.ADD_VEHICLE,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.OPEN_CLAIM
  ].includes(actionType);
}

function companyVerified(actor) {
  return [
    CompanyVerificationStatuses.VERIFIED,
    CompanyVerificationStatuses.LIMITED
  ].includes(actor.companyVerificationStatus);
}

function validateCreateCompany(payload, reasons) {
  if (!payload.name && !payload.companyName) reasons.push(v("company_name_required"));
  if (!payload.country) reasons.push(v("company_country_required"));
  if (!payload.vatEu && !payload.vat) reasons.push(v("vat_required"));
  if (!payload.address) reasons.push(v("company_address_required"));
  if (!payload.type && !payload.companyType) reasons.push(v("company_type_required"));
}

function validateOnboardingStart(payload, reasons) {
  if (!payload.language) reasons.push(v("language_required"));
  if (!payload.country) reasons.push(v("country_required"));
  if (!payload.phone) reasons.push(v("phone_required"));
  if (!consent(payload.termsConsent)) reasons.push(v("terms_required"));
  if (!consent(payload.identityConsent)) reasons.push(v("identity_consent_required"));
  if (!consent(payload.documentsConsent)) reasons.push(v("documents_consent_required"));
}

function validateOnboardingAccount(payload, reasons) {
  if (!payload.userId) reasons.push(v("user_id_required"));
  if (!payload.firstName) reasons.push(v("first_name_required"));
  if (!payload.lastName) reasons.push(v("last_name_required"));
  if (!payload.email) reasons.push(v("email_required"));
  if (!payload.passwordMethod) reasons.push(v("password_method_required"));
  if (!payload.countryOfResidence) reasons.push(v("country_of_residence_required"));
  if (!payload.userType) reasons.push(v("user_type_required"));
}

function validateOnboardingIdentity(payload, reasons) {
  if (!payload.userId) reasons.push(v("user_id_required"));
  if (!payload.documentType) reasons.push(v("identity_document_required"));
  if (!payload.documentCountry) reasons.push(v("document_country_required"));
  if (!payload.documentExpiresAt) reasons.push(v("document_expiry_required"));
  if (!consent(payload.selfieConfirmed)) reasons.push(v("selfie_required"));
}

function validateAddVehicle(actor, payload, reasons) {
  if (!actor.companyId) reasons.push(v("carrier_company_required"));
  if (!payload.plate) reasons.push(v("vehicle_plate_required"));
}

function validateAddCompanyDriver(actor, payload, reasons) {
  if (!actor.companyId && !payload.companyId) reasons.push(v("carrier_company_required"));
  if (!payload.name && (!payload.firstName || !payload.lastName)) reasons.push(v("first_name_required"));
  if (!payload.phone && !payload.email) reasons.push(v("login_required"));
}

function consent(value) {
  return value === true || value === "true" || value === "on";
}

function yes(value) {
  return value === true || value === "true" || value === "on" || value === "yes" || value === "tak";
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizePlate(value = "") {
  return String(value).trim().toUpperCase();
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "";
}

function lastName(name = "") {
  return String(name).trim().split(/\s+/).slice(1).join(" ");
}

function driverRoleDocuments(payload) {
  return [
    "identity_document",
    "selfie",
    payload.licenseNumber ? "driving_license" : null,
    payload.licenseCategories ? `categories:${payload.licenseCategories}` : null,
    payload.driverCard ? "driver_card" : null,
    payload.adrCertificate ? "adr_certificate" : null
  ].filter(Boolean);
}

function createDriverMembership(userId, companyId, invitedBy) {
  const id = createId("ucr");
  return {
    id,
    userCompanyRole_id: id,
    userId,
    user_id: userId,
    companyId,
    company_id: companyId,
    roleId: `company_role_${CompanyRoleNames.EMPLOYEE}`,
    role_id: `company_role_${CompanyRoleNames.EMPLOYEE}`,
    roleName: CompanyRoleNames.EMPLOYEE,
    status: "active",
    permissions: [],
    deniedPermissions: [],
    invitedBy,
    invitedAt: nowIso(),
    acceptedAt: nowIso()
  };
}

function requireTransport(transport, reasons) {
  if (!transport) reasons.push(v("transport_not_found"));
}

function validatePublish(transport, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (![TransportStatuses.READY_TO_PUBLISH, TransportStatuses.PENDING_WAREHOUSE_PHOTO].includes(transport.status)) {
    reasons.push(v("transport_status_expected", { expected: "ready_to_publish", current: transport.status }));
  }
  if (!modules.gps.hasCoordinates(transport.pickup)) reasons.push(v("gps_point_required"));
  if (!modules.gps.hasCoordinates(transport.delivery)) reasons.push(v("gps_point_required"));
  if (!transport.cargo.prePublishPhotoId) reasons.push(v("load_photo_required"));
  if (!modules.wallets.getForCompany(transport.clientCompanyId)) {
    reasons.push(v("client_wallet_required"));
  }
}

function validateCarrierAccept(transport, payload, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (![TransportStatuses.PUBLISHED, TransportStatuses.CARRIER_OFFER_RECEIVED].includes(transport.status)) {
    reasons.push(v("transport_status_expected", { expected: "published", current: transport.status }));
  }
  if (!payload.carrierCompanyId) reasons.push(v("carrier_company_required"));
  if (payload.carrierCompanyId && modules.companies.trustScore(payload.carrierCompanyId) < 70) {
    reasons.push("carrier trust score below 70");
  }
  if (Number(transport.price || 0) > 0 && !modules.wallets.canReserve(transport.clientCompanyId, transport.price)) {
    reasons.push(v("secured_escrow_required"));
  }
}

function validateDriverAssignment(transport, payload, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (transport.status !== TransportStatuses.CARRIER_ACCEPTED) {
    reasons.push(v("transport_status_expected", { expected: "carrier_accepted", current: transport.status }));
  }
  if (!transport.carrierCompanyId) reasons.push(v("carrier_company_required"));
  const driver = modules.users.getById(payload.driverId);
  const vehicle = modules.state.vehicles.find((item) => item.id === payload.vehicleId);
  if (!driver) reasons.push(v("driver_required"));
  if (driver && driver.companyId !== transport.carrierCompanyId) reasons.push("driver must belong to assigned carrier");
  if (driver && !driver.documentsValid) reasons.push(v("driver_documents_invalid"));
  if (!vehicle) reasons.push(v("vehicle_required"));
  if (vehicle && vehicle.companyId !== transport.carrierCompanyId) reasons.push("vehicle must belong to assigned carrier");
  if (vehicle && !vehicle.documentsValid) reasons.push(v("vehicle_documents_invalid"));
  if (driver) {
    const driverTime = modules.driverTime.canAssign(driver.id);
    if (!driverTime.ok) reasons.push(driverTime.reason);
  }
}

function validateTransition(transport, actionType, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (actionType === ActionTypes.SELECT_PARKING) {
    if (transport.status !== TransportStatuses.IN_TRANSIT) reasons.push("parking can be selected only in transit");
    return;
  }
  if (actionType === ActionTypes.START_BREAK) {
    if (![TransportStatuses.IN_TRANSIT, TransportStatuses.PARKING_BREAK].includes(transport.status)) reasons.push("break requires in_transit or parking_break status");
    if (!transport.currentParkingId) reasons.push("parking must be selected before break");
    return;
  }
  if (actionType === ActionTypes.FINISH_BREAK) {
    if (transport.status !== TransportStatuses.PARKING_BREAK) reasons.push("break can finish only from parking_break");
    return;
  }
  const transition = nextStatusByAction[actionType];
  if (!transition) return;
  const [expectedStatus] = transition;
  if (transport.status !== expectedStatus) {
    reasons.push(`expected status ${expectedStatus}, current: ${transport.status}`);
  }
  if (actionType === ActionTypes.START_PICKUP_NAVIGATION) {
    if (!transport.driverId) reasons.push("driver is required before starting transport");
    if (!modules.gps.hasCoordinates(transport.pickup)) reasons.push("missing pickup GPS coordinates");
    if (transportRequiresEscrow(transport)) {
      const escrow = modules.escrow.getForTransport(transport.id);
      if (!escrow || escrow.status !== "reserved" || transport.paymentStatus !== PaymentStatuses.RESERVED) {
        reasons.push("secured escrow is required before transport activation");
      }
    }
  }
  if (actionType === ActionTypes.ARRIVE_DELIVERY || actionType === ActionTypes.START_UNLOADING) {
    if (!modules.gps.hasCoordinates(transport.delivery)) reasons.push("missing delivery GPS coordinates");
  }
  if (actionType === ActionTypes.START_LOADING && !modules.security.isCleared(transport.id, "pickup")) {
    reasons.push("pickup security check must be cleared before loading");
  }
  if (actionType === ActionTypes.START_UNLOADING && !modules.security.isCleared(transport.id, "delivery")) {
    reasons.push("delivery security check must be cleared before unloading");
  }
}

function transportRequiresEscrow(transport) {
  return Number(transport?.price || 0) > 0;
}

function validateCustomsTransition(transport, actionType, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (actionType === ActionTypes.MARK_CUSTOMS_REQUIRED) {
    if (![TransportStatuses.IN_TRANSIT, TransportStatuses.CONTINUE_ROAD_TRANSPORT, TransportStatuses.CUSTOMS_CLEARED].includes(transport.status)) {
      reasons.push(`customs can start only in active transport, current: ${transport.status}`);
    }
    return;
  }
  if (actionType === ActionTypes.SEND_TO_CUSTOMS) {
    if (transport.status !== TransportStatuses.CUSTOMS_REQUIRED) reasons.push(`expected status ${TransportStatuses.CUSTOMS_REQUIRED}, current: ${transport.status}`);
    return;
  }
  if (actionType === ActionTypes.START_CUSTOMS) {
    if (transport.status !== TransportStatuses.WAITING_FOR_CUSTOMS) reasons.push(`expected status ${TransportStatuses.WAITING_FOR_CUSTOMS}, current: ${transport.status}`);
    return;
  }
  if ([ActionTypes.CLEAR_CUSTOMS, ActionTypes.HOLD_CUSTOMS].includes(actionType)) {
    if (transport.status !== TransportStatuses.CUSTOMS_IN_PROGRESS) reasons.push(`expected status ${TransportStatuses.CUSTOMS_IN_PROGRESS}, current: ${transport.status}`);
    if (actionType === ActionTypes.CLEAR_CUSTOMS && !modules.documents.hasDocumentType(transport, "mrn")) reasons.push("MRN document is required before customs clearance");
  }
}

function validateAuthorityTransition(transport, actionType, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (actionType === ActionTypes.START_AUTHORITY_CONTROL) {
    if ([TransportStatuses.COMPLETED, TransportStatuses.CANCELLED].includes(transport.status)) {
      reasons.push(`authority control cannot start from ${transport.status}`);
    }
    return;
  }
  if (actionType === ActionTypes.RECORD_DOCUMENT_CHECK) {
    if (transport.status !== TransportStatuses.CONTROL_STARTED) reasons.push(`expected status ${TransportStatuses.CONTROL_STARTED}, current: ${transport.status}`);
    return;
  }
  if (actionType === ActionTypes.RECORD_ROAD_INSPECTION) {
    if (transport.status !== TransportStatuses.DOCUMENT_CHECK) reasons.push(`expected status ${TransportStatuses.DOCUMENT_CHECK}, current: ${transport.status}`);
    return;
  }
  if ([ActionTypes.PASS_AUTHORITY_CONTROL, ActionTypes.REPORT_AUTHORITY_ISSUE].includes(actionType)) {
    if (![TransportStatuses.DOCUMENT_CHECK, TransportStatuses.ROAD_INSPECTION].includes(transport.status)) {
      reasons.push(`expected status ${TransportStatuses.ROAD_INSPECTION}, current: ${transport.status}`);
    }
  }
}

function validateFerryTransition(transport, actionType, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  const hasDriverAndVehicle = Boolean(transport.driverId && transport.vehicleId);

  if (actionType !== ActionTypes.MARK_FERRY_REQUIRED && !hasDriverAndVehicle) {
    reasons.push("driver and vehicle are required before ferry step");
  }

  if (actionType === ActionTypes.MARK_FERRY_REQUIRED) {
    if (![
      TransportStatuses.PUBLISHED,
      TransportStatuses.CARRIER_ACCEPTED,
      TransportStatuses.DRIVER_ASSIGNED,
      TransportStatuses.IN_TRANSIT,
      TransportStatuses.PARKING_BREAK
    ].includes(transport.status)) {
      reasons.push(`ferry cannot be required from ${transport.status}`);
    }
    return;
  }

  if (actionType === ActionTypes.BOOK_FERRY) {
    if (![TransportStatuses.FERRY_REQUIRED, TransportStatuses.FERRY_BOOKED].includes(transport.status)) {
      reasons.push(`expected status ${TransportStatuses.FERRY_REQUIRED}, current: ${transport.status}`);
    }
    return;
  }

  if (actionType === ActionTypes.START_PORT_NAVIGATION) {
    if (transport.status !== TransportStatuses.FERRY_BOOKED) {
      reasons.push(`expected status ${TransportStatuses.FERRY_BOOKED}, current: ${transport.status}`);
    }
    return;
  }

  if (actionType === ActionTypes.CHECK_IN_FERRY) {
    if (![TransportStatuses.GOING_TO_PORT, TransportStatuses.WAITING_FOR_FERRY].includes(transport.status)) {
      reasons.push(`expected status ${TransportStatuses.GOING_TO_PORT}, current: ${transport.status}`);
    }
    return;
  }

  if (actionType === ActionTypes.BOARD_FERRY) {
    if (![TransportStatuses.CHECKED_IN_FERRY, TransportStatuses.BOARDING].includes(transport.status)) {
      reasons.push(`expected status ${TransportStatuses.CHECKED_IN_FERRY}, current: ${transport.status}`);
    }
    return;
  }

  if (actionType === ActionTypes.COMPLETE_FERRY && ![TransportStatuses.ON_FERRY, TransportStatuses.LEAVING_FERRY].includes(transport.status)) {
    reasons.push(`expected status ${TransportStatuses.ON_FERRY}, current: ${transport.status}`);
  }
}

function validateServiceAction(transport, actionType, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  const request = modules.service.getForTransport(transport.id);
  if (actionType === ActionTypes.REPORT_BREAKDOWN) {
    if (!transport.vehicleId) reasons.push("vehicle is required before service request");
    if (!transport.driverId) reasons.push("driver is required before service request");
    return;
  }
  if (actionType === ActionTypes.REQUEST_TECHNICAL_SERVICE) {
    if (!request) reasons.push("breakdown report is required before service selection");
    return;
  }
  if (actionType === ActionTypes.ACCEPT_SERVICE_JOB) {
    if (!request) reasons.push("service request not found");
    if (request && request.status !== "provider_selected") reasons.push(`expected service status provider_selected, current: ${request.status}`);
    return;
  }
  if (actionType === ActionTypes.COMPLETE_SERVICE_JOB) {
    if (!request) reasons.push("service request not found");
    if (request && request.status !== "accepted") reasons.push(`expected service status accepted, current: ${request.status}`);
  }
}

function validatePaymentRelease(transport, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (![TransportStatuses.DELIVERY_DOCUMENTS_UPLOADED, TransportStatuses.PAYMENT_PENDING].includes(transport.status)) {
    reasons.push("delivery documents and payment_pending status are required");
  }
  if (!modules.documents.hasDocumentType(transport, "delivery_confirmation")) {
    reasons.push("delivery confirmation document is required");
  }
  if (transport.paymentStatus === PaymentStatuses.BLOCKED) reasons.push("payment is blocked");
}

function statusEvent(modules, transport, actor, nextStatus, eventType, reason) {
  const previousState = transport.status;
  modules.transports.setStatus(transport, nextStatus, actor, reason);
  return {
    type: eventType,
    objectType: "transport",
    objectId: transport.id,
    previousState,
    newState: transport.status,
    reason
  };
}

function sessionEvent(type, newState, reason) {
  return {
    type,
    objectType: "session",
    objectId: "demo-session",
    previousState: null,
    newState,
    reason,
    source: SourceTypes.USER
  };
}
