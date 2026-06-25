import { CustomsDocumentTypes, EventTypes, Roles, TransportStatuses } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class CustomsEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return (this.state.customsCases || []).find((item) => item.transportId === transportId) || null;
  }

  markRequired(transport, actor, payload, modules) {
    const customsCase = this.ensureCase(transport, actor, payload);
    transport.customsCaseId = customsCase.id;
    transport.requiredDocumentTypes = unique([...(transport.requiredDocumentTypes || []), ...CustomsDocumentTypes]);
    return {
      customsCase,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.CUSTOMS_REQUIRED,
          EventTypes.CUSTOMS_REQUIRED_RECORDED,
          "transport wymaga odprawy celnej"
        )
      ]
    };
  }

  sendToCustoms(transport, actor, payload, modules) {
    const customsCase = this.ensureCase(transport, actor, payload);
    customsCase.status = "WAITING_FOR_CUSTOMS";
    customsCase.updatedAt = nowIso();
    return {
      customsCase,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.WAITING_FOR_CUSTOMS,
          EventTypes.CUSTOMS_WAITING,
          "dokumenty przekazane do agencji celnej"
        )
      ]
    };
  }

  start(transport, actor, payload, modules) {
    const customsCase = this.ensureCase(transport, actor, payload);
    customsCase.status = "CUSTOMS_IN_PROGRESS";
    customsCase.agentUserId = actor.role === Roles.CUSTOMS_AGENT ? actor.userId : customsCase.agentUserId;
    customsCase.updatedAt = nowIso();
    const events = [
      this.statusEvent(
        modules,
        transport,
        actor,
        TransportStatuses.CUSTOMS_IN_PROGRESS,
        EventTypes.CUSTOMS_STARTED,
        "odprawa celna rozpoczęta"
      )
    ];
    events.push(...this.ensureDemoDocuments(transport, actor, modules));
    return { customsCase, events };
  }

  clear(transport, actor, payload, modules) {
    const customsCase = this.ensureCase(transport, actor, payload);
    customsCase.status = "CUSTOMS_CLEARED";
    customsCase.mrn = payload.mrn || customsCase.mrn || `MRN-${transport.number}`;
    customsCase.clearedAt = nowIso();
    customsCase.updatedAt = nowIso();
    const events = [
      this.statusEvent(
        modules,
        transport,
        actor,
        TransportStatuses.CUSTOMS_CLEARED,
        EventTypes.CUSTOMS_CLEARED,
        "odprawa celna zakończona"
      )
    ];
    const paymentEvent = this.simulatePayment(transport, customsCase, payload);
    if (paymentEvent) events.push(paymentEvent);
    if (!this.walletCreditAlreadyExists(customsCase)) {
      const walletEvent = modules.wallets.credit(
        customsCase.agentCompanyId,
        transport.id,
        customsCase.fee,
        `opłata za odprawę celną ${customsCase.mrn}`
      );
      if (walletEvent) events.push(walletEvent);
    }
    return { customsCase, events };
  }

  hold(transport, actor, payload, modules) {
    const customsCase = this.ensureCase(transport, actor, payload);
    customsCase.status = "CUSTOMS_HOLD";
    customsCase.holdReason = payload.reason || "brak wymaganego dokumentu celnego";
    customsCase.updatedAt = nowIso();
    transport.riskFlagged = true;
    return {
      customsCase,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.CUSTOMS_HOLD,
          EventTypes.CUSTOMS_HOLD_PLACED,
          customsCase.holdReason
        )
      ]
    };
  }

  ensureCase(transport, actor, payload = {}) {
    this.state.customsCases ||= [];
    let customsCase = this.getForTransport(transport.id);
    if (customsCase) return customsCase;
    customsCase = {
      id: createId("customs"),
      transportId: transport.id,
      agentCompanyId: payload.agentCompanyId || actor.companyId || "co-customs-a",
      agentUserId: payload.agentUserId || (actor.role === Roles.CUSTOMS_AGENT ? actor.userId : "u-customs"),
      status: payload.status || "CUSTOMS_REQUIRED",
      borderPoint: payload.borderPoint || "Calais / Dover border",
      mrn: payload.mrn || null,
      requiredDocumentTypes: [...CustomsDocumentTypes],
      checkedDocumentIds: [],
      fee: payload.fee || 180,
      currency: payload.currency || "EUR",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      clearedAt: null,
      holdReason: null
    };
    this.state.customsCases.unshift(customsCase);
    return customsCase;
  }

  ensureDemoDocuments(transport, actor, modules) {
    const docsToCreate = [
      ["mrn", `MRN ${transport.number}`],
      ["commercial_invoice", `Faktura handlowa ${transport.number}`],
      ["packing_list", `Packing list ${transport.number}`],
      ["certificate_of_origin", `Certyfikat pochodzenia ${transport.number}`]
    ];
    const events = [];
    docsToCreate.forEach(([type, label]) => {
      if (modules.documents.hasDocumentType(transport, type)) return;
      const result = modules.documents.upload(transport, actor, {
        type,
        label,
        visibleToRoles: [
          Roles.PLATFORM_OWNER,
          Roles.ADMIN,
          Roles.CLIENT_OWNER,
          Roles.CARRIER_OWNER,
          Roles.CUSTOMS_AGENT
        ]
      });
      events.push({
        ...result.event,
        type: EventTypes.CUSTOMS_DOCUMENT_RECEIVED,
        reason: `${label} dodany do odprawy celnej`
      });
    });
    return events;
  }

  simulatePayment(transport, customsCase, payload = {}) {
    this.state.customsPayments ||= [];
    const exists = this.state.customsPayments.some((payment) => payment.customsCaseId === customsCase.id);
    if (exists) return null;
    const payment = {
      id: createId("cpay"),
      customsCaseId: customsCase.id,
      transportId: transport.id,
      agentCompanyId: customsCase.agentCompanyId,
      amount: payload.fee || customsCase.fee,
      currency: customsCase.currency,
      status: "simulated_paid",
      createdAt: nowIso()
    };
    this.state.customsPayments.unshift(payment);
    return {
      type: EventTypes.CUSTOMS_PAYMENT_SIMULATED,
      objectType: "transport",
      objectId: transport.id,
      previousState: null,
      newState: payment.status,
      reason: `opłata celna demo ${payment.amount} ${payment.currency}`
    };
  }

  walletCreditAlreadyExists(customsCase) {
    const wallet = this.state.wallets.find((item) => item.ownerCompanyId === customsCase.agentCompanyId);
    if (!wallet) return false;
    return this.state.walletLedger.some((entry) => (
      entry.walletId === wallet.id
      && entry.transportId === customsCase.transportId
      && entry.type === "credit"
      && entry.reason.includes("odpraw")
    ));
  }

  statusEvent(modules, transport, actor, nextStatus, eventType, reason) {
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
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
