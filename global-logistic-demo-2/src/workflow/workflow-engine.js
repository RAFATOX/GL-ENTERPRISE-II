import {
  ActionTypes,
  AccountStatuses,
  CriticalTransportActions,
  EventTypes,
  PaymentStatuses,
  SourceTypes,
  TransportStatuses
} from "../core/constants.js";

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

export class WorkflowEngine {
  validate(context, modules) {
    const { actionType, payload, state, actor } = context;
    const reasons = [];
    const selectedTransport = modules.transports.getById(payload.transportId || state.session.selectedTransportId);

    if (actor.accountStatus && actor.accountStatus !== AccountStatuses.VERIFIED && !sessionOnly(actionType)) {
      reasons.push(`account status is ${actor.accountStatus}`);
    }

    if (CriticalTransportActions.has(actionType) && selectedTransport) {
      if (selectedTransport.activeDisputeId) reasons.push("active dispute blocks the next workflow step");
      if (selectedTransport.riskFlagged) reasons.push("AI Control Agent marked transport as risk_flagged");
    }

    switch (actionType) {
      case ActionTypes.SELECT_ROLE:
        if (!payload.role) reasons.push("missing target role");
        break;
      case ActionTypes.SELECT_VIEW:
        if (!payload.view) reasons.push("missing target view");
        break;
      case ActionTypes.SELECT_TRANSPORT:
        if (!modules.transports.getById(payload.transportId)) reasons.push("transport not found");
        break;
      case ActionTypes.REGISTER_USER:
        if (!payload.phone) reasons.push("phone number is required");
        if (!payload.role) reasons.push("role is required");
        break;
      case ActionTypes.VERIFY_ACCOUNT:
      case ActionTypes.CHANGE_PHONE:
        if (!payload.userId) reasons.push("user id is required");
        if (actionType === ActionTypes.CHANGE_PHONE && !payload.phone) reasons.push("new phone is required");
        break;
      case ActionTypes.CREATE_LOAD:
        if (!actor.companyId && !payload.clientCompanyId) reasons.push("client company is required");
        if (!payload.description) reasons.push("load description is required");
        if (!payload.pickupAddress) reasons.push("pickup address is required");
        if (!payload.deliveryAddress) reasons.push("delivery address is required");
        break;
      case ActionTypes.ADD_LOAD_PHOTO:
        requireTransport(selectedTransport, reasons);
        break;
      case ActionTypes.CONFIRM_GPS:
        requireTransport(selectedTransport, reasons);
        if (!payload.pickupGps && !payload.deliveryGps) reasons.push("at least one GPS point is required");
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
          reasons.push("pickup confirmation document is required before transit");
        }
        break;
      case ActionTypes.RELEASE_PAYMENT:
        validatePaymentRelease(selectedTransport, modules, reasons);
        break;
      case ActionTypes.SEND_MESSAGE:
        requireTransport(selectedTransport, reasons);
        if (!payload.body) reasons.push("message body is required");
        break;
      case ActionTypes.REQUEST_TRANSLATION:
        if (!payload.messageId) reasons.push("message id is required");
        if (payload.messageId && !modules.communication.getMessage(payload.messageId)) reasons.push("message not found");
        break;
      case ActionTypes.SCAN_LICENSE_PLATE:
        if (!payload.licensePlate) reasons.push("license plate is required");
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
      case ActionTypes.SELECT_ROLE:
        return this.selectRole(state, modules, payload);
      case ActionTypes.SELECT_VIEW:
        state.session.view = payload.view;
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
        const paymentEvent = modules.payments.release(transport);
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
        modules.payments.setStatus(transport, PaymentStatuses.BLOCKED);
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

  selectRole(state, modules, payload) {
    const demoUser = modules.users.findDemoUserForRole(payload.role);
    state.session.role = payload.role;
    state.session.userId = demoUser.id;
    state.session.deniedView = null;
    state.session.deniedRoute = null;
    return {
      events: [{
        type: EventTypes.SESSION_ROLE_CHANGED,
        objectType: "session",
        objectId: "demo-session",
        previousState: null,
        newState: payload.role,
        reason: "demo role switcher selected"
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

function sessionOnly(actionType) {
  return [ActionTypes.SELECT_ROLE, ActionTypes.SELECT_VIEW, ActionTypes.SELECT_TRANSPORT].includes(actionType);
}

function requireTransport(transport, reasons) {
  if (!transport) reasons.push("transport not found");
}

function validatePublish(transport, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (![TransportStatuses.READY_TO_PUBLISH, TransportStatuses.PENDING_WAREHOUSE_PHOTO].includes(transport.status)) {
    reasons.push(`transport status must be ready_to_publish, current: ${transport.status}`);
  }
  if (!modules.gps.hasCoordinates(transport.pickup)) reasons.push("missing pickup GPS coordinates");
  if (!modules.gps.hasCoordinates(transport.delivery)) reasons.push("missing delivery GPS coordinates");
  if (!transport.cargo.prePublishPhotoId) reasons.push("missing load photo before publication");
}

function validateCarrierAccept(transport, payload, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (![TransportStatuses.PUBLISHED, TransportStatuses.CARRIER_OFFER_RECEIVED].includes(transport.status)) {
    reasons.push(`transport must be published before carrier acceptance, current: ${transport.status}`);
  }
  if (!payload.carrierCompanyId) reasons.push("carrier company is required");
  if (payload.carrierCompanyId && modules.companies.trustScore(payload.carrierCompanyId) < 70) {
    reasons.push("carrier trust score below 70");
  }
  if (Number(transport.price || 0) > 0 && !modules.wallets.canReserve(transport.clientCompanyId, transport.price)) {
    reasons.push("client wallet must secure funds before carrier acceptance");
  }
}

function validateDriverAssignment(transport, payload, modules, reasons) {
  requireTransport(transport, reasons);
  if (!transport) return;
  if (transport.status !== TransportStatuses.CARRIER_ACCEPTED) {
    reasons.push(`transport must be carrier_accepted before driver assignment, current: ${transport.status}`);
  }
  if (!transport.carrierCompanyId) reasons.push("carrier is not assigned");
  const driver = modules.users.getById(payload.driverId);
  const vehicle = modules.state.vehicles.find((item) => item.id === payload.vehicleId);
  if (!driver) reasons.push("driver is required");
  if (driver && driver.companyId !== transport.carrierCompanyId) reasons.push("driver must belong to assigned carrier");
  if (driver && !driver.documentsValid) reasons.push("driver documents are not valid");
  if (!vehicle) reasons.push("vehicle is required");
  if (vehicle && vehicle.companyId !== transport.carrierCompanyId) reasons.push("vehicle must belong to assigned carrier");
  if (vehicle && !vehicle.documentsValid) reasons.push("vehicle documents are not valid");
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
