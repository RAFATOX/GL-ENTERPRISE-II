import { EventTypes, PaymentStatuses, TransportStatuses } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class DisputeEngine {
  constructor(state) {
    this.state = state;
  }

  open(transport, actor, payload, modules) {
    const dispute = {
      id: createId("dispute"),
      transportId: transport.id,
      status: "open",
      reason: payload.reason || "manual dispute opened",
      createdBy: actor.userId,
      createdAt: nowIso()
    };
    this.state.disputes.unshift(dispute);
    modules.payments.setStatus(transport, PaymentStatuses.BLOCKED);
    transport.activeDisputeId = dispute.id;
    modules.transports.setStatus(transport, TransportStatuses.DISPUTE_OPENED, actor, dispute.reason);
    return {
      dispute,
      events: [{
        type: EventTypes.DISPUTE_OPENED,
        objectType: "transport",
        objectId: transport.id,
        previousState: null,
        newState: transport.status,
        reason: dispute.reason
      }]
    };
  }

  createEvidencePack(transport) {
    const dispute = this.state.disputes.find((item) => item.id === transport.activeDisputeId);
    if (!dispute) return null;
    const existing = this.state.disputeEvidencePacks.find((pack) => pack.disputeId === dispute.id);
    if (existing) return null;
    const messageIds = this.state.messages
      .filter((message) => message.transportId === transport.id)
      .map((message) => message.id);
    const pack = {
      id: createId("evidence"),
      disputeId: dispute.id,
      transportId: transport.id,
      photoIds: [...transport.photoIds],
      documentIds: [...transport.documentIds],
      messageIds,
      createdAt: nowIso(),
      locked: true
    };
    this.state.disputeEvidencePacks.unshift(pack);
    return {
      type: EventTypes.DISPUTE_EVIDENCE_PACK_CREATED,
      objectType: "dispute_evidence_pack",
      objectId: pack.id,
      transportId: transport.id,
      previousState: null,
      newState: "locked",
      reason: "dispute evidence pack locked from photos, documents, GPS and messages"
    };
  }

  resolve(transport, actor, payload, modules) {
    const target = this.state.disputes.find((item) => item.id === transport.activeDisputeId);
    if (target) {
      target.status = "resolved";
      target.resolvedBy = actor.userId;
      target.resolvedAt = nowIso();
    }
    transport.activeDisputeId = null;
    transport.riskFlagged = false;
    modules.payments.setStatus(transport, PaymentStatuses.PENDING);
    const previousState = transport.status;
    modules.transports.setStatus(
      transport,
      TransportStatuses.PAYMENT_PENDING,
      actor,
      payload.reason || "admin resolved dispute; payment can continue"
    );
    return {
      events: [{
        type: EventTypes.DISPUTE_RESOLVED,
        objectType: "transport",
        objectId: transport.id,
        previousState,
        newState: transport.status,
        reason: payload.reason || "admin resolved dispute; payment can continue"
      }]
    };
  }
}
