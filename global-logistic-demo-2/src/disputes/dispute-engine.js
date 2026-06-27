import { EventTypes, PaymentStatuses, TransportStatuses } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";
import { requireFinancialAuditService } from "../audit/financial-audit-service.js";

export class DisputeEngine {
  constructor(state, auditService = null) {
    this.state = state;
    this.auditService = auditService;
  }

  open(transport, actor, payload, modules) {
    const auditService = this.requireAuditService();
    const disputeId = createId("dispute");
    const auditLogId = auditService.createRecord({
      action: EventTypes.DISPUTE_OPENED,
      requestedAction: EventTypes.DISPUTE_OPENED,
      objectType: "dispute",
      objectId: disputeId,
      transportId: transport.id,
      previousState: null,
      newState: "open",
      reason: payload.reason || "manual dispute opened",
      actor
    });
    const dispute = {
      id: disputeId,
      transportId: transport.id,
      status: "open",
      reason: payload.reason || "manual dispute opened",
      createdBy: actor.userId,
      createdAt: nowIso(),
      auditId: auditLogId,
      auditLogId,
      audit_log_id: auditLogId,
      auditIds: [auditLogId]
    };
    this.state.disputes.unshift(dispute);
    modules.payments.setStatus(transport, PaymentStatuses.BLOCKED, {
      actor,
      reason: dispute.reason
    });
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
        reason: dispute.reason,
        auditLogId,
        audit_log_id: auditLogId
      }]
    };
  }

  createEvidencePack(transport) {
    const dispute = this.state.disputes.find((item) => item.id === transport.activeDisputeId);
    if (!dispute) return null;
    const existing = this.state.disputeEvidencePacks.find((pack) => pack.disputeId === dispute.id);
    if (existing) return null;
    const auditService = this.requireAuditService();
    const messageIds = this.state.messages
      .filter((message) => message.transportId === transport.id)
      .map((message) => message.id);
    const packId = createId("evidence");
    const auditLogId = auditService.createRecord({
      action: EventTypes.DISPUTE_EVIDENCE_PACK_CREATED,
      requestedAction: EventTypes.DISPUTE_EVIDENCE_PACK_CREATED,
      objectType: "dispute_evidence_pack",
      objectId: packId,
      transportId: transport.id,
      previousState: null,
      newState: "locked",
      reason: "dispute evidence pack locked from photos, documents, GPS and messages"
    });
    const pack = {
      id: packId,
      disputeId: dispute.id,
      transportId: transport.id,
      photoIds: [...transport.photoIds],
      documentIds: [...transport.documentIds],
      messageIds,
      createdAt: nowIso(),
      locked: true,
      auditId: auditLogId,
      auditLogId,
      audit_log_id: auditLogId
    };
    this.state.disputeEvidencePacks.unshift(pack);
    return {
      type: EventTypes.DISPUTE_EVIDENCE_PACK_CREATED,
      objectType: "dispute_evidence_pack",
      objectId: pack.id,
      transportId: transport.id,
      previousState: null,
      newState: "locked",
      reason: "dispute evidence pack locked from photos, documents, GPS and messages",
      auditLogId,
      audit_log_id: auditLogId
    };
  }

  resolve(transport, actor, payload, modules) {
    const target = this.state.disputes.find((item) => item.id === transport.activeDisputeId);
    const auditService = this.requireAuditService();
    const auditLogId = auditService.createRecord({
      action: EventTypes.DISPUTE_RESOLVED,
      requestedAction: EventTypes.DISPUTE_RESOLVED,
      objectType: "dispute_decision",
      objectId: target?.id || transport.id,
      transportId: transport.id,
      previousState: target?.status || null,
      newState: payload.decision || "resolved",
      reason: payload.reason || "admin resolved dispute; payment can continue",
      actor
    });
    if (target) {
      target.status = "resolved";
      target.resolvedBy = actor.userId;
      target.resolvedAt = nowIso();
      target.decision = payload.decision || "release";
      target.decisionAuditLogId = auditLogId;
      target.decisionAudit_log_id = auditLogId;
      target.auditId ||= auditLogId;
      target.auditLogId ||= auditLogId;
      target.audit_log_id ||= auditLogId;
      target.auditIds ||= [];
      if (!target.auditIds.includes(auditLogId)) target.auditIds.unshift(auditLogId);
    }
    transport.activeDisputeId = null;
    transport.riskFlagged = false;
    modules.payments.setStatus(transport, PaymentStatuses.PENDING, {
      actor,
      reason: payload.reason || "admin resolved dispute; payment can continue"
    });
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
        reason: payload.reason || "admin resolved dispute; payment can continue",
        auditLogId,
        audit_log_id: auditLogId
      }]
    };
  }

  requireAuditService() {
    return requireFinancialAuditService(this.auditService);
  }
}
