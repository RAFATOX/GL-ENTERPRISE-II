import { PaymentStatuses, TransportStatuses } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class TransportEngine {
  constructor(state) {
    this.state = state;
  }

  getById(transportId) {
    return this.state.transports.find((transport) => transport.id === transportId) || null;
  }

  selected() {
    return this.getById(this.state.session.selectedTransportId) || this.state.transports[0];
  }

  setStatus(transport, nextStatus, actor, reason) {
    const previousStatus = transport.status;
    transport.status = nextStatus;
    transport.statusHistory.push({
      at: nowIso(),
      from: previousStatus,
      to: nextStatus,
      by: actor.userId,
      role: actor.role,
      reason
    });
    return previousStatus;
  }

  createDraft(actor, payload) {
    const id = createId("tr");
    const transport = {
      id,
      number: `GL2-${Math.floor(2000 + Math.random() * 7000)}`,
      clientCompanyId: actor.companyId || payload.clientCompanyId,
      carrierCompanyId: null,
      driverId: null,
      warehouseWorkerId: payload.warehouseWorkerId || null,
      vehicleId: null,
      pickup: {
        address: payload.pickupAddress || "New pickup point",
        gps: payload.pickupGps || null
      },
      delivery: {
        address: payload.deliveryAddress || "New delivery point",
        gps: payload.deliveryGps || null
      },
      cargo: {
        description: payload.description || "Nowy ladunek demo",
        weightKg: payload.weightKg || 1200,
        dimensions: payload.dimensions || "4 palety",
        prePublishPhotoId: null
      },
      price: payload.price || 1400,
      status: TransportStatuses.PENDING_WAREHOUSE_PHOTO,
      paymentStatus: PaymentStatuses.PENDING,
      insuranceId: null,
      shipmentIds: [],
      documentIds: [],
      photoIds: [],
      routeDeviation: false,
      activeDisputeId: null,
      activeClaimId: null,
      activeAiAlertId: null,
      riskFlagged: false,
      statusHistory: [],
      eventIds: [],
      auditIds: [],
      requiredDocumentTypes: ["cmr", "delivery_confirmation"]
    };

    transport.statusHistory.push({
      at: nowIso(),
      from: null,
      to: transport.status,
      by: actor.userId,
      role: actor.role,
      reason: "load created"
    });

    this.state.transports.unshift(transport);
    this.state.session.selectedTransportId = transport.id;
    this.state.payments.push({
      id: createId("pay"),
      transportId: transport.id,
      status: PaymentStatuses.PENDING,
      amount: transport.price,
      currency: "EUR",
      updatedAt: nowIso()
    });
    return transport;
  }
}
