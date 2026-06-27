import { EventTypes, PaymentStatuses } from "../core/constants.js";
import { nowIso } from "../core/id.js";
import { requireFinancialAuditService } from "../audit/financial-audit-service.js";

export class PaymentEngine {
  constructor(state, auditService = null) {
    this.state = state;
    this.auditService = auditService;
  }

  getForTransport(transportId) {
    return this.state.payments.find((payment) => payment.transportId === transportId) || null;
  }

  setStatus(transport, status, options = {}) {
    const auditService = this.requireAuditService();
    const payment = this.getForTransport(transport.id);
    const previousState = payment?.status || transport.paymentStatus || null;
    const auditLogId = auditService.createRecord({
      action: options.auditAction || "PAYMENT_STATUS_CHANGED",
      requestedAction: options.auditAction || "PAYMENT_STATUS_CHANGED",
      objectType: "payment",
      objectId: payment?.id || transport.id,
      transportId: transport.id,
      previousState,
      newState: status,
      reason: options.reason || `payment status changed to ${status}`,
      actor: options.actor
    });
    if (payment) {
      payment.status = status;
      payment.updatedAt = nowIso();
      payment.auditId = auditLogId;
      payment.auditLogId = auditLogId;
      payment.audit_log_id = auditLogId;
      payment.auditIds ||= [];
      if (!payment.auditIds.includes(auditLogId)) payment.auditIds.unshift(auditLogId);
    }
    transport.paymentStatus = status;
    return payment;
  }

  release(transport, options = {}) {
    const payment = this.setStatus(transport, PaymentStatuses.RELEASED, {
      ...options,
      auditAction: EventTypes.PAYMENT_RELEASED,
      reason: options.reason || "payment released after delivery proof and document validation"
    });
    const auditLogId = payment?.audit_log_id || payment?.auditLogId || payment?.auditId || null;
    return {
      type: EventTypes.PAYMENT_RELEASED,
      objectType: "transport",
      objectId: transport.id,
      transportId: transport.id,
      reason: "payment released after delivery proof and document validation",
      auditLogId,
      audit_log_id: auditLogId,
      paymentId: payment?.id || null
    };
  }

  requireAuditService() {
    return requireFinancialAuditService(this.auditService);
  }
}
