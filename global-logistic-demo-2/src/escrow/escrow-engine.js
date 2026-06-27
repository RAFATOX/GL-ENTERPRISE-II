import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";
import { requireFinancialAuditService } from "../audit/financial-audit-service.js";

export class EscrowEngine {
  constructor(state, auditService = null) {
    this.state = state;
    this.auditService = auditService;
  }

  getForTransport(transportId) {
    return this.state.escrows.find((escrow) => escrow.transportId === transportId) || null;
  }

  reserve(transport) {
    if (!transport.carrierCompanyId) return null;
    const existing = this.getForTransport(transport.id);
    if (existing && existing.status === "reserved") return null;
    this.requireAuditService();
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
    const operation = this.recordOperation(escrow, "reserve", previousState, escrow.status, "client funds reserved in escrow after carrier acceptance");
    if (!existing) this.state.escrows.unshift(escrow);
    return {
      type: EventTypes.ESCROW_RESERVED,
      objectType: "escrow",
      objectId: escrow.id,
      transportId: transport.id,
      previousState,
      newState: escrow.status,
      reason: "client funds reserved in escrow after carrier acceptance",
      auditLogId: operation.auditLogId,
      audit_log_id: operation.audit_log_id,
      escrowOperationId: operation.id
    };
  }

  block(transport, reason) {
    const escrow = this.getForTransport(transport.id);
    if (!escrow || escrow.status === "released" || escrow.status === "blocked") return null;
    this.requireAuditService();
    const previousState = escrow.status;
    escrow.status = "blocked";
    const operation = this.recordOperation(escrow, "block", previousState, escrow.status, reason);
    return {
      type: EventTypes.ESCROW_BLOCKED,
      objectType: "escrow",
      objectId: escrow.id,
      transportId: transport.id,
      previousState,
      newState: escrow.status,
      reason,
      auditLogId: operation.auditLogId,
      audit_log_id: operation.audit_log_id,
      escrowOperationId: operation.id
    };
  }

  release(transport) {
    const escrow = this.getForTransport(transport.id);
    if (!escrow || escrow.status === "released") return null;
    this.requireAuditService();
    const previousState = escrow.status;
    escrow.status = "released";
    escrow.releasedAt = nowIso();
    const operation = this.recordOperation(escrow, "release", previousState, escrow.status, "escrow released after payment approval");
    return {
      type: EventTypes.ESCROW_RELEASED,
      objectType: "escrow",
      objectId: escrow.id,
      transportId: transport.id,
      previousState,
      newState: escrow.status,
      reason: "escrow released after payment approval",
      auditLogId: operation.auditLogId,
      audit_log_id: operation.audit_log_id,
      escrowOperationId: operation.id
    };
  }

  recordOperation(escrow, operationType, previousState, newState, reason) {
    const auditService = this.requireAuditService();
    const operationId = createId("escrow_op");
    const auditLogId = auditService.createRecord({
      action: escrowAuditAction(operationType),
      requestedAction: escrowAuditAction(operationType),
      objectType: "escrow_operation",
      objectId: operationId,
      transportId: escrow.transportId,
      previousState,
      newState,
      reason
    });
    const operation = {
      id: operationId,
      modelType: "EscrowOperation",
      escrowId: escrow.id,
      transportId: escrow.transportId,
      operationType,
      previousState,
      newState,
      amount: escrow.amount,
      currency: escrow.currency,
      reason,
      auditId: auditLogId,
      auditLogId,
      audit_log_id: auditLogId,
      at: nowIso()
    };
    this.state.escrowOperations ||= [];
    this.state.escrowOperations.unshift(operation);
    escrow.auditIds ||= [];
    escrow.auditIds.unshift(auditLogId);
    escrow.lastAuditLogId = auditLogId;
    escrow.lastAudit_log_id = auditLogId;
    return operation;
  }

  requireAuditService() {
    return requireFinancialAuditService(this.auditService);
  }
}

function escrowAuditAction(operationType) {
  if (operationType === "reserve") return EventTypes.ESCROW_RESERVED;
  if (operationType === "block") return EventTypes.ESCROW_BLOCKED;
  if (operationType === "release") return EventTypes.ESCROW_RELEASED;
  return `ESCROW_${String(operationType || "operation").toUpperCase()}`;
}
