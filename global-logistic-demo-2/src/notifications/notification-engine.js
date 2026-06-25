import { EventTypes, Roles } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

const routeByEvent = {
  [EventTypes.LOAD_PUBLISHED]: [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER],
  [EventTypes.CARRIER_ACCEPTED]: [Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER],
  [EventTypes.DRIVER_ASSIGNED]: [Roles.DRIVER, Roles.CARRIER_OWNER],
  [EventTypes.LOAD_PHOTO_ADDED]: [Roles.CLIENT_OWNER, Roles.ADMIN],
  [EventTypes.AI_ALERT_CREATED]: [Roles.ADMIN, Roles.SUPPORT_AGENT],
  [EventTypes.DISPUTE_OPENED]: [Roles.ADMIN, Roles.SUPPORT_AGENT],
  [EventTypes.CLAIM_OPENED]: [Roles.INSURANCE_PARTNER, Roles.ADMIN],
  [EventTypes.PAYMENT_RELEASED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.PAYMENT_OPERATOR],
  [EventTypes.TRANSPORT_COMPLETED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.PAYMENT_OPERATOR],
  [EventTypes.ESCROW_RESERVED]: [Roles.CLIENT_OWNER, Roles.PAYMENT_OPERATOR],
  [EventTypes.ESCROW_BLOCKED]: [Roles.ADMIN, Roles.PAYMENT_OPERATOR, Roles.SUPPORT_AGENT],
  [EventTypes.ESCROW_RELEASED]: [Roles.CARRIER_OWNER, Roles.PAYMENT_OPERATOR],
  [EventTypes.SECURITY_CHECK_RECORDED]: [Roles.DRIVER, Roles.CARRIER_OWNER],
  [EventTypes.SECURITY_GATE_DENIED]: [Roles.ADMIN, Roles.SUPPORT_AGENT, Roles.SECURITY_GUARD],
  [EventTypes.CUSTOMS_REQUIRED_RECORDED]: [Roles.CUSTOMS_AGENT, Roles.CLIENT_OWNER, Roles.CARRIER_OWNER],
  [EventTypes.CUSTOMS_WAITING]: [Roles.CUSTOMS_AGENT, Roles.CARRIER_OWNER],
  [EventTypes.CUSTOMS_STARTED]: [Roles.CUSTOMS_AGENT, Roles.CARRIER_OWNER],
  [EventTypes.CUSTOMS_CLEARED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.CUSTOMS_AGENT],
  [EventTypes.CUSTOMS_HOLD_PLACED]: [Roles.ADMIN, Roles.SUPPORT_AGENT, Roles.CUSTOMS_AGENT, Roles.CARRIER_OWNER],
  [EventTypes.CUSTOMS_PAYMENT_SIMULATED]: [Roles.CUSTOMS_AGENT, Roles.PAYMENT_OPERATOR],
  [EventTypes.AUTHORITY_CONTROL_STARTED]: [Roles.AUTHORITY_USER, Roles.CARRIER_OWNER, Roles.ADMIN],
  [EventTypes.AUTHORITY_DOCUMENT_CHECKED]: [Roles.AUTHORITY_USER, Roles.CARRIER_OWNER],
  [EventTypes.AUTHORITY_ROAD_INSPECTION_DONE]: [Roles.AUTHORITY_USER, Roles.CARRIER_OWNER],
  [EventTypes.AUTHORITY_CONTROL_PASSED]: [Roles.AUTHORITY_USER, Roles.CARRIER_OWNER],
  [EventTypes.AUTHORITY_ISSUE_FOUND]: [Roles.AUTHORITY_USER, Roles.CARRIER_OWNER, Roles.ADMIN, Roles.SUPPORT_AGENT],
  [EventTypes.AUTHORITY_ACCESS_RECORDED]: [Roles.ADMIN, Roles.AUTHORITY_USER],
  [EventTypes.FERRY_REQUIRED_RECORDED]: [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER, Roles.FERRY_OPERATOR],
  [EventTypes.FERRY_BOOKED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER, Roles.FERRY_OPERATOR],
  [EventTypes.FERRY_GOING_TO_PORT]: [Roles.CARRIER_OWNER, Roles.DRIVER, Roles.FERRY_OPERATOR],
  [EventTypes.FERRY_CHECKED_IN]: [Roles.CARRIER_OWNER, Roles.DRIVER, Roles.FERRY_OPERATOR],
  [EventTypes.FERRY_BOARDING]: [Roles.CARRIER_OWNER, Roles.DRIVER, Roles.FERRY_OPERATOR],
  [EventTypes.FERRY_ONBOARD]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER, Roles.FERRY_OPERATOR],
  [EventTypes.FERRY_COMPLETED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER, Roles.FERRY_OPERATOR],
  [EventTypes.FERRY_ETA_UPDATED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER],
  [EventTypes.FERRY_PAYMENT_SIMULATED]: [Roles.FERRY_OPERATOR, Roles.PAYMENT_OPERATOR],
  [EventTypes.SERVICE_BREAKDOWN_REPORTED]: [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER, Roles.MOBILE_SERVICE, Roles.WORKSHOP, Roles.ROADSIDE_ASSISTANCE],
  [EventTypes.SERVICE_PROVIDER_SELECTED]: [Roles.CARRIER_OWNER, Roles.DRIVER, Roles.MOBILE_SERVICE, Roles.WORKSHOP, Roles.ROADSIDE_ASSISTANCE],
  [EventTypes.SERVICE_ACCEPTED]: [Roles.CARRIER_OWNER, Roles.DRIVER, Roles.CLIENT_OWNER],
  [EventTypes.SERVICE_COMPLETED]: [Roles.CARRIER_OWNER, Roles.DRIVER, Roles.CLIENT_OWNER, Roles.INSURANCE_PARTNER],
  [EventTypes.SERVICE_ETA_UPDATED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER],
  [EventTypes.SERVICE_PAYMENT_SIMULATED]: [Roles.PAYMENT_OPERATOR, Roles.CARRIER_OWNER],
  [EventTypes.MESSAGE_SENT]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER, Roles.SUPPORT_AGENT],
  [EventTypes.MESSAGE_TRANSLATED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER],
  [EventTypes.LICENSE_PLATE_IDENTIFIED]: [Roles.SECURITY_GUARD, Roles.DRIVER, Roles.CARRIER_OWNER],
  [EventTypes.PLATE_CHAT_CREATED]: [Roles.SECURITY_GUARD, Roles.DRIVER],
  [EventTypes.JOB_CREATED]: [Roles.DRIVER, Roles.CARRIER_OWNER],
  [EventTypes.JOB_COMPLETED]: [Roles.DRIVER, Roles.CARRIER_OWNER],
  [EventTypes.DISPUTE_EVIDENCE_PACK_CREATED]: [Roles.ADMIN, Roles.SUPPORT_AGENT, Roles.INSURANCE_PARTNER],
  [EventTypes.DIGITAL_CMR_LOCKED]: [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER],
  [EventTypes.PLATFORM_FEE_RECORDED]: [Roles.PLATFORM_OWNER, Roles.PAYMENT_OPERATOR],
  [EventTypes.API_CALL_RECORDED]: [Roles.PLATFORM_OWNER, Roles.ADMIN],
  [EventTypes.API_RATE_LIMIT_FLAGGED]: [Roles.PLATFORM_OWNER, Roles.ADMIN],
  [EventTypes.INTEGRATION_SYNC_COMPLETED]: [Roles.PLATFORM_OWNER, Roles.ADMIN],
  [EventTypes.INTEGRATION_SYNC_BLOCKED]: [Roles.PLATFORM_OWNER, Roles.ADMIN],
  [EventTypes.RESILIENCE_CHECK_COMPLETED]: [Roles.PLATFORM_OWNER, Roles.ADMIN],
  [EventTypes.EMERGENCY_MODE_READY]: [Roles.PLATFORM_OWNER, Roles.ADMIN],
  [EventTypes.COMPLIANCE_CHECK_COMPLETED]: [Roles.ADMIN, Roles.CARRIER_OWNER],
  [EventTypes.COMPLIANCE_CHECK_BLOCKED]: [Roles.ADMIN, Roles.CARRIER_OWNER]
};

export class NotificationEngine {
  constructor(state) {
    this.state = state;
  }

  handleEvent(event) {
    const roles = routeByEvent[event.type] || [];
    roles.forEach((role) => {
      this.state.notifications.unshift({
        id: createId("ntf"),
        at: nowIso(),
        role,
        eventId: event.id,
        objectType: event.objectType,
        objectId: event.objectId,
        message: this.messageFor(event, role),
        read: false
      });
    });
  }

  messageFor(event, role) {
    if (event.type === EventTypes.AI_ALERT_CREATED) return "AI Control Agent oznaczyl ryzyko";
    if (event.type === EventTypes.LOAD_PUBLISHED) return "Nowy ladunek dostepny dla przewoznika";
    if (event.type === EventTypes.DRIVER_ASSIGNED) return "Kierowca przypisany do transportu";
    if (event.type === EventTypes.PAYMENT_RELEASED) return "Platnosc demo zwolniona";
    if (event.type === EventTypes.ESCROW_RESERVED) return "Srodki demo zablokowane w escrow";
    if (event.type === EventTypes.SECURITY_GATE_DENIED) return "Ochrona zatrzymala proces na bramie";
    if (event.type === EventTypes.MESSAGE_SENT) return "Nowa wiadomosc w watku transportu";
    if (event.type === EventTypes.LICENSE_PLATE_IDENTIFIED) return "Tablica pojazdu polaczona z transportem";
    if (event.type === EventTypes.CUSTOMS_CLEARED) return "Odprawa celna zakonczona";
    if (event.type === EventTypes.CUSTOMS_HOLD_PLACED) return "Odprawa celna zatrzymala transport";
    if (event.type === EventTypes.AUTHORITY_CONTROL_STARTED) return "Organ kontrolny rozpoczal kontrole";
    if (event.type === EventTypes.AUTHORITY_ISSUE_FOUND) return "Kontrola drogowa wykryla problem";
    if (event.type === EventTypes.FERRY_REQUIRED_RECORDED) return "Transport wymaga przeprawy promowej";
    if (event.type === EventTypes.FERRY_BOOKED) return "Prom zostal zarezerwowany";
    if (event.type === EventTypes.FERRY_ONBOARD) return "Pojazd jest na promie";
    if (event.type === EventTypes.FERRY_COMPLETED) return "Przeprawa promowa zakonczona";
    if (event.type === EventTypes.FERRY_PAYMENT_SIMULATED) return "Platnosc promowa demo zapisana";
    if (event.type === EventTypes.SERVICE_BREAKDOWN_REPORTED) return "Kierowca zglosil awarie pojazdu";
    if (event.type === EventTypes.SERVICE_ACCEPTED) return "Serwis techniczny przyjal zgloszenie";
    if (event.type === EventTypes.SERVICE_COMPLETED) return "Serwis techniczny zakonczyl obsluge";
    if (event.type === EventTypes.DISPUTE_EVIDENCE_PACK_CREATED) return "Paczka dowodowa sporu zostala zablokowana";
    if (event.type === EventTypes.API_RATE_LIMIT_FLAGGED) return "API rate limit wymaga kontroli";
    if (event.type === EventTypes.COMPLIANCE_CHECK_BLOCKED) return "Compliance zablokowal kierowce lub zaloge";
    return `${role}: ${event.type}`;
  }
}
