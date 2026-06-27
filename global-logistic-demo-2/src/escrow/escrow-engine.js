import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class EscrowEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return this.state.escrows.find((escrow) => escrow.transportId === transportId) || null;
  }

  reserve(transport) {
    if (!transport.carrierCompanyId) return null;
    const existing = this.getForTransport(transport.id);
    if (existing && existing.status === "reserved") return null;
    const previousState = existing?.status || null;
    const escrow = existing || {
      id: createId("escrow"),
      modelType: "TransportEscrow",
      ownerType: "transport_escrow",
      ownerId: transport.id,
      owner_type: "transport_escrow",
      owner_id: transport.id,
      transportId: transport.id,
      payerCompanyId: transport.clientCompanyId,
      payeeCompanyId: transport.carrierCompanyId,
      amount: transport.price,
      currency: "EUR",
      status: "created",
      createdAt: nowIso(),
      releasedAt: null
    };
    escrow.payerCompanyId = transport.clientCompanyId;
    escrow.payeeCompanyId = transport.carrierCompanyId;
    escrow.amount = transport.price;
    escrow.status = "reserved";
    if (!existing) this.state.escrows.unshift(escrow);
    return {
      type: EventTypes.ESCROW_RESERVED,
      objectType: "escrow",
      objectId: escrow.id,
      transportId: transport.id,
      previousState,
      newState: escrow.status,
      reason: "client funds reserved in escrow after carrier acceptance"
    };
  }

  block(transport, reason) {
    const escrow = this.getForTransport(transport.id);
    if (!escrow || escrow.status === "released" || escrow.status === "blocked") return null;
    const previousState = escrow.status;
    escrow.status = "blocked";
    return {
      type: EventTypes.ESCROW_BLOCKED,
      objectType: "escrow",
      objectId: escrow.id,
      transportId: transport.id,
      previousState,
      newState: escrow.status,
      reason
    };
  }

  release(transport) {
    const escrow = this.getForTransport(transport.id);
    if (!escrow || escrow.status === "released") return null;
    const previousState = escrow.status;
    escrow.status = "released";
    escrow.releasedAt = nowIso();
    return {
      type: EventTypes.ESCROW_RELEASED,
      objectType: "escrow",
      objectId: escrow.id,
      transportId: transport.id,
      previousState,
      newState: escrow.status,
      reason: "escrow released after payment approval"
    };
  }
}
