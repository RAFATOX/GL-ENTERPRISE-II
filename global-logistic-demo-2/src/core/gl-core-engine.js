import {
  ActionTypes,
  EventTypes,
  PaymentStatuses,
  SourceTypes
} from "./constants.js";
import { clone, createId, nowIso } from "./id.js";
import { StateStore } from "./state-store.js";
import { AuditEngine } from "../audit/audit-engine.js";
import { ApiEngine } from "../api/api-engine.js";
import { AuthEngine } from "../auth/auth-engine.js";
import { AiControlAgent } from "../ai-control/ai-control-agent.js";
import { AuthorityAccessEngine } from "../authority/authority-access-engine.js";
import { CompanyEngine } from "../companies/company-engine.js";
import { ComplianceEngine } from "../compliance/compliance-engine.js";
import { CommunicationEngine } from "../communication/communication-engine.js";
import { CustomsEngine } from "../customs/customs-engine.js";
import { DigitalCmrEngine } from "../cmr/digital-cmr-engine.js";
import { DocumentEngine } from "../documents/document-engine.js";
import { DisputeEngine } from "../disputes/dispute-engine.js";
import { DriverTimeEngine } from "../driver-time/driver-time-engine.js";
import { EscrowEngine } from "../escrow/escrow-engine.js";
import { EventBus } from "../events/event-bus.js";
import { FerryEngine } from "../ferry/ferry-engine.js";
import { GlobalExpansionEngine } from "../global-expansion/global-expansion-engine.js";
import { GpsEngine } from "../gps/gps-engine.js";
import { InsuranceEngine } from "../insurance/insurance-engine.js";
import { IntegrationEngine } from "../integrations/integration-engine.js";
import { JobsEngine } from "../jobs/jobs-engine.js";
import { NotificationEngine } from "../notifications/notification-engine.js";
import { RegistrationOnboardingEngine } from "../onboarding/registration-onboarding-engine.js";
import { ParkingEngine } from "../parking/parking-engine.js";
import { PaymentEngine } from "../payments/payment-engine.js";
import { PlateToDriverEngine } from "../plate-to-driver/plate-to-driver-engine.js";
import { PermissionsEngine } from "../permissions/permissions-engine.js";
import { PhotoEngine } from "../photos/photo-engine.js";
import { RevenueEngine } from "../revenue/revenue-engine.js";
import { ResilienceEngine } from "../resilience/resilience-engine.js";
import { SecurityEngine } from "../security/security-engine.js";
import { ServiceEngine } from "../service/service-engine.js";
import { ShipmentEngine } from "../shipments/shipment-engine.js";
import { TranslationEngine } from "../translation/translation-engine.js";
import { TransportEngine } from "../transports/transport-engine.js";
import { TrustEngine } from "../trust/trust-engine.js";
import { UserEngine } from "../users/user-engine.js";
import { WalletEngine } from "../wallets/wallet-engine.js";
import { WorkflowEngine } from "../workflow/workflow-engine.js";

export class GLCoreEngine {
  constructor(options = {}) {
    this.store = options.store || new StateStore();
    this.state = options.state || this.store.load();
    this.subscribers = [];
    this.buildModules();
  }

  buildModules() {
    this.modules = {
      state: this.state,
      users: new UserEngine(this.state),
      companies: new CompanyEngine(this.state),
      api: new ApiEngine(this.state),
      auth: new AuthEngine(this.state),
      authority: new AuthorityAccessEngine(this.state),
      transports: new TransportEngine(this.state),
      shipments: new ShipmentEngine(this.state),
      customs: new CustomsEngine(this.state),
      ferry: new FerryEngine(this.state),
      gps: new GpsEngine(this.state),
      photos: new PhotoEngine(this.state),
      documents: new DocumentEngine(this.state),
      cmr: new DigitalCmrEngine(this.state),
      payments: new PaymentEngine(this.state),
      wallets: new WalletEngine(this.state),
      escrow: new EscrowEngine(this.state),
      revenue: new RevenueEngine(this.state),
      integrations: new IntegrationEngine(this.state),
      resilience: new ResilienceEngine(this.state),
      compliance: new ComplianceEngine(this.state),
      globalExpansion: new GlobalExpansionEngine(this.state),
      disputes: new DisputeEngine(this.state),
      insurance: new InsuranceEngine(this.state),
      trust: new TrustEngine(this.state),
      parking: new ParkingEngine(this.state),
      driverTime: new DriverTimeEngine(this.state),
      jobs: new JobsEngine(this.state),
      communication: new CommunicationEngine(this.state),
      translation: new TranslationEngine(this.state),
      plateToDriver: new PlateToDriverEngine(this.state),
      security: new SecurityEngine(this.state),
      service: new ServiceEngine(this.state),
      ai: new AiControlAgent(this.state),
      notifications: new NotificationEngine(this.state),
      onboarding: new RegistrationOnboardingEngine(this.state),
      permissions: new PermissionsEngine(),
      workflow: new WorkflowEngine()
    };
    this.eventBus = new EventBus(this.state);
    this.audit = new AuditEngine(this.state);
    this.eventBus.subscribe((event) => this.audit.handleEvent(event));
    this.eventBus.subscribe((event) => this.modules.notifications.handleEvent(event));
    this.eventBus.subscribe((event) => this.modules.compliance.handleEvent(event));
  }

  getSnapshot() {
    return this.modules.permissions.filterSnapshot(clone(this.state), this.getActor());
  }

  subscribe(listener) {
    this.subscribers.push(listener);
    return () => {
      this.subscribers = this.subscribers.filter((item) => item !== listener);
    };
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.subscribers.forEach((listener) => listener(snapshot));
  }

  getActor() {
    return this.modules.users.getActor(this.state.session);
  }

  explainAction(actionType, payload = {}) {
    const context = this.createContext(actionType, payload);
    const permission = this.modules.permissions.canPerformAction(context.actor, actionType, context);
    if (!permission.ok) return { ok: false, stage: "permission", reasons: [permission.reason] };
    const validation = this.modules.workflow.validate(context, this.modules);
    if (!validation.ok) return { ok: false, stage: "validation", reasons: validation.reasons };
    return { ok: true, stage: "ready", reasons: [] };
  }

  dispatchAction(actionType, payload = {}, meta = {}) {
    const context = this.createContext(actionType, payload, meta);
    if (meta.payloadError) {
      return this.error(context, [meta.payloadError], "payload");
    }

    const permission = this.modules.permissions.canPerformAction(context.actor, actionType, context);
    if (!permission.ok) {
      return this.block(context, [permission.reason], "permission");
    }

    if (actionType === ActionTypes.RESET_DEMO) {
      this.state = this.store.reset();
      this.buildModules();
      const event = this.makeEvent({
        type: EventTypes.DEMO_RESET,
        objectType: "system",
        objectId: "demo",
        previousState: null,
        newState: "reset",
        reason: "demo state reset"
      }, context);
      const events = this.publishEvents([event], context);
      this.finishDispatch({ ok: true, events });
      return { ok: true, events, reasons: [] };
    }

    const validation = this.modules.workflow.validate(context, this.modules);
    if (!validation.ok) {
      return this.block(context, validation.reasons, "validation");
    }

    const result = this.modules.workflow.apply(context, this.modules) || { events: [] };
    const events = (result.events || []).map((event) => this.makeEvent(event, context));
    const publishedEvents = this.publishEvents(events, context);
    this.finishDispatch({ ok: true, events: publishedEvents });
    return { ok: true, events: publishedEvents, reasons: [] };
  }

  createContext(actionType, payload, meta = {}) {
    return {
      actionType,
      payload,
      meta,
      state: this.state,
      actor: this.getActor()
    };
  }

  block(context, reasons, stage) {
    if (context.actionType === ActionTypes.SELECT_VIEW) {
      this.state.session.deniedView = context.payload.view || "unknown";
      this.state.session.deniedRoute = context.payload.route || null;
    }
    const objectType = context.payload.transportId || this.state.session.selectedTransportId
      ? "transport"
      : "system";
    const objectId = context.payload.transportId || this.state.session.selectedTransportId || "demo";
    const event = this.makeEvent({
      type: EventTypes.ACTION_BLOCKED,
      objectType,
      objectId,
      previousState: null,
      newState: "blocked",
      reason: `${stage}: ${reasons.join("; ")}`,
      result: "blocked"
    }, context);
    const events = this.publishEvents([event], context);
    this.finishDispatch({ ok: false, events, reasons });
    return { ok: false, events, reasons };
  }

  error(context, reasons, stage) {
    const objectType = context.payload.transportId || this.state.session.selectedTransportId
      ? "transport"
      : "system";
    const objectId = context.payload.transportId || this.state.session.selectedTransportId || "demo";
    const event = this.makeEvent({
      type: EventTypes.PAYLOAD_PARSE_ERROR,
      objectType,
      objectId,
      previousState: null,
      newState: "error",
      reason: `${stage}: ${reasons.join("; ")}`,
      result: "error"
    }, context);
    const events = this.publishEvents([event], context);
    this.finishDispatch({ ok: false, result: "error", events, reasons });
    return { ok: false, events, reasons };
  }

  publishEvents(initialEvents, context) {
    const queue = [...initialEvents];
    const published = [];
    let depth = 0;

    while (queue.length && depth < 40) {
      const event = queue.shift();
      this.eventBus.publish(event);
      published.push(event);
      const reactions = this.reactToEvent(event, context)
        .filter(Boolean)
        .map((partial) => this.makeEvent({ source: SourceTypes.SYSTEM, ...partial }, context));
      queue.push(...reactions);
      depth += 1;
    }

    return published;
  }

  reactToEvent(event) {
    const transportId = event.objectType === "transport" ? event.objectId : event.transportId;
    const transport = transportId ? this.modules.transports.getById(transportId) : null;
    const reactions = [];
    const add = (result) => {
      if (Array.isArray(result)) reactions.push(...result.filter(Boolean));
      else if (result) reactions.push(result);
    };

    if (event.type === EventTypes.MESSAGE_SENT) {
      add(this.modules.translation.translateMessage(
        this.modules.communication.getMessage(event.objectId),
        this.state.session.language || "pl"
      ));
      return reactions;
    }

    if (event.type === EventTypes.LICENSE_PLATE_IDENTIFIED) {
      const lookup = this.state.plateLookups.find((item) => item.id === event.objectId);
      add(this.modules.plateToDriver.createTemporaryChat(lookup, this.modules));
      return reactions;
    }

    if (!transport) return reactions;

    switch (event.type) {
      case EventTypes.LOAD_CREATED:
        add(this.modules.shipments.createFromTransport(transport));
        add(this.modules.revenue.recordTransportFee(transport));
        break;
      case EventTypes.LOAD_PHOTO_ADDED:
        add(this.modules.shipments.syncEvidence(transport, "shipment photos synced from Photo Proof Engine"));
        break;
      case EventTypes.DOCUMENT_UPLOADED:
        add(this.modules.shipments.syncEvidence(transport, "shipment documents synced from Document Engine"));
        add(this.modules.cmr.createOrUpdate(transport));
        add(this.modules.documents.confirmRequiredSet(transport));
        break;
      case EventTypes.DOCUMENT_CONFIRMED:
        add(this.modules.cmr.lockIfReady(transport));
        break;
      case EventTypes.CARRIER_ACCEPTED:
        this.modules.payments.setStatus(transport, PaymentStatuses.RESERVED);
        add(this.modules.escrow.reserve(transport));
        add(this.modules.wallets.hold(
          transport.clientCompanyId,
          transport.id,
          transport.price,
          "client wallet hold created for escrow"
        ));
        break;
      case EventTypes.DRIVER_ASSIGNED:
        add(this.modules.jobs.createForTransport(transport));
        break;
      case EventTypes.TRANSPORT_IN_TRANSIT:
        add(this.modules.shipments.setStatusForTransport(transport, "in_transit", "shipment moved into transit"));
        break;
      case EventTypes.CUSTOMS_REQUIRED_RECORDED:
      case EventTypes.CUSTOMS_WAITING:
      case EventTypes.CUSTOMS_STARTED:
        add(this.modules.shipments.setStatusForTransport(transport, "customs", "shipment connected to customs flow"));
        break;
      case EventTypes.CUSTOMS_CLEARED: {
        const customsCase = this.modules.customs.getForTransport(transport.id);
        add(this.modules.shipments.setStatusForTransport(transport, "in_transit", "shipment cleared by customs"));
        if (customsCase) add(withTransport(this.modules.trust.change(customsCase.agentCompanyId, 1, "customs clearance completed"), transport.id));
        break;
      }
      case EventTypes.CUSTOMS_HOLD_PLACED: {
        const customsCase = this.modules.customs.getForTransport(transport.id);
        this.modules.payments.setStatus(transport, PaymentStatuses.BLOCKED);
        add(this.modules.escrow.block(transport, event.reason || "customs hold"));
        add(this.modules.shipments.setStatusForTransport(transport, "blocked", "shipment blocked by customs hold"));
        if (customsCase) add(withTransport(this.modules.trust.change(customsCase.agentCompanyId, -2, "customs hold opened"), transport.id));
        break;
      }
      case EventTypes.AUTHORITY_CONTROL_STARTED:
      case EventTypes.AUTHORITY_DOCUMENT_CHECKED:
      case EventTypes.AUTHORITY_ROAD_INSPECTION_DONE:
        add(this.modules.shipments.setStatusForTransport(transport, "control", "shipment under authority control"));
        break;
      case EventTypes.AUTHORITY_CONTROL_PASSED:
        add(this.modules.shipments.setStatusForTransport(transport, "in_transit", "authority control passed"));
        break;
      case EventTypes.AUTHORITY_ISSUE_FOUND:
        this.modules.payments.setStatus(transport, PaymentStatuses.BLOCKED);
        add(this.modules.escrow.block(transport, event.reason || "authority control issue"));
        add(this.modules.shipments.setStatusForTransport(transport, "blocked", "shipment blocked by authority issue"));
        break;
      case EventTypes.FERRY_BOOKED:
        add(this.modules.shipments.setStatusForTransport(transport, "ferry_booked", "shipment connected to ferry booking"));
        break;
      case EventTypes.FERRY_ONBOARD:
        add(this.modules.shipments.setStatusForTransport(transport, "on_ferry", "shipment is on ferry leg"));
        break;
      case EventTypes.FERRY_COMPLETED: {
        const booking = this.modules.ferry.getForTransport(transport.id);
        add(this.modules.shipments.setStatusForTransport(transport, "in_transit", "shipment continues after ferry"));
        if (booking) add(withTransport(this.modules.trust.change(booking.operatorCompanyId, 1, "ferry leg completed"), transport.id));
        add(withTransport(this.modules.trust.change(transport.driverId, 1, "ferry rest completed"), transport.id));
        break;
      }
      case EventTypes.SERVICE_BREAKDOWN_REPORTED:
      case EventTypes.SERVICE_PROVIDER_SELECTED:
      case EventTypes.SERVICE_ACCEPTED:
        add(this.modules.shipments.setStatusForTransport(transport, "service", "shipment has active technical service"));
        break;
      case EventTypes.SERVICE_COMPLETED: {
        const request = this.state.serviceRequests.find((item) => item.transportId === transport.id && item.status === "completed");
        add(this.modules.shipments.setStatusForTransport(transport, "in_transit", "technical service completed"));
        if (request?.providerCompanyId) add(withTransport(this.modules.trust.change(request.providerCompanyId, request.rating >= 4 ? 1 : -2, "technical service completed"), transport.id));
        if (request?.insuranceRelevant) add(this.modules.insurance.closeRiskForTransport(transport));
        break;
      }
      case EventTypes.DELIVERY_CONFIRMED:
        add(this.modules.shipments.setStatusForTransport(transport, "delivered", "shipment delivery confirmed"));
        break;
      case EventTypes.DISPUTE_OPENED:
        add(this.modules.disputes.createEvidencePack(transport));
        this.modules.payments.setStatus(transport, PaymentStatuses.BLOCKED);
        add(this.modules.escrow.block(transport, event.reason || "dispute opened"));
        add(this.modules.shipments.setStatusForTransport(transport, "blocked", "shipment blocked by dispute"));
        break;
      case EventTypes.CLAIM_OPENED:
      case EventTypes.TRANSPORT_BLOCKED:
      case EventTypes.SECURITY_GATE_DENIED:
        this.modules.payments.setStatus(transport, PaymentStatuses.BLOCKED);
        add(this.modules.escrow.block(transport, event.reason || "risk event blocked escrow"));
        add(this.modules.shipments.setStatusForTransport(transport, "blocked", "shipment blocked by risk event"));
        break;
      case EventTypes.AI_ALERT_CREATED:
        this.modules.payments.setStatus(transport, PaymentStatuses.BLOCKED);
        add(this.modules.escrow.block(transport, `AI Control Agent: ${event.reason}`));
        break;
      case EventTypes.COMPLIANCE_CHECK_BLOCKED:
        transport.riskFlagged = true;
        add(this.modules.shipments.setStatusForTransport(transport, "blocked", "shipment blocked by compliance check"));
        break;
      case EventTypes.TRANSPORT_COMPLETED:
        add(this.modules.shipments.setStatusForTransport(transport, "completed", "shipment completed with transport"));
        add(this.modules.escrow.release(transport));
        add(this.modules.wallets.releaseToCarrier(transport, transport.price));
        add(this.modules.jobs.completeForTransport(transport));
        add(this.modules.documents.confirmRequiredSet(transport));
        add(this.modules.insurance.closeRiskForTransport(transport));
        add(withTransport(this.modules.trust.change(transport.clientCompanyId, 1, "completed transport"), transport.id));
        add(withTransport(this.modules.trust.change(transport.carrierCompanyId, 2, "completed transport"), transport.id));
        add(withTransport(this.modules.trust.change(transport.driverId, 2, "completed transport"), transport.id));
        add(withTransport(this.modules.trust.change(transport.warehouseWorkerId, 1, "completed transport"), transport.id));
        break;
      default:
        break;
    }

    return reactions;
  }

  finishDispatch(result) {
    this.state.revision += 1;
    this.state.session.lastResult = {
      ok: result.ok,
      result: result.result || (result.ok ? "success" : "blocked"),
      at: nowIso(),
      events: (result.events || []).map((event) => event.type),
      reasons: result.reasons || []
    };
    this.store.save(this.state);
    this.notify();
  }

  makeEvent(partial, context) {
    return {
      id: createId("event"),
      type: partial.type,
      requestedAction: context.actionType,
      at: nowIso(),
      actorId: context.actor.userId,
      actorRole: context.actor.role,
      objectType: partial.objectType || "system",
      objectId: partial.objectId || "demo",
      transportId: partial.transportId || (partial.objectType === "transport" ? partial.objectId : null),
      previousState: partial.previousState ?? null,
      newState: partial.newState ?? null,
      device: context.meta.device || "demo-browser",
      reason: partial.reason || "not provided",
      source: partial.source || SourceTypes.USER,
      result: partial.result || "success"
    };
  }
}

function withTransport(event, transportId) {
  if (!event) return null;
  return { ...event, transportId };
}
