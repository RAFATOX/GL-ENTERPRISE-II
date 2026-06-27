import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";
import { requireFinancialAuditService } from "../audit/financial-audit-service.js";

export class RevenueEngine {
  constructor(state, auditService = null) {
    this.state = state;
    this.auditService = auditService;
  }

  recordTransportFee(transport, reason = "platform transport fee recorded") {
    const exists = this.state.revenueLedger.some((entry) => (
      entry.transportId === transport.id
      && entry.type === "transport_fee"
    ));
    if (exists) return null;
    const auditService = this.requireAuditService();
    const rowId = createId("revenue");
    const auditLogId = auditService.createRecord({
      action: EventTypes.PLATFORM_FEE_RECORDED,
      requestedAction: EventTypes.PLATFORM_FEE_RECORDED,
      objectType: "revenue",
      objectId: rowId,
      transportId: transport.id,
      previousState: null,
      newState: "1 EUR",
      reason
    });
    const row = {
      id: rowId,
      transportId: transport.id,
      type: "transport_fee",
      amount: 1,
      currency: "EUR",
      reason,
      auditId: auditLogId,
      auditLogId,
      audit_log_id: auditLogId,
      at: nowIso()
    };
    this.state.revenueLedger.unshift(row);
    return {
      type: EventTypes.PLATFORM_FEE_RECORDED,
      objectType: "revenue",
      objectId: row.id,
      transportId: transport.id,
      previousState: null,
      newState: `${row.amount} ${row.currency}`,
      reason,
      auditLogId,
      audit_log_id: auditLogId,
      revenueLedgerId: row.id
    };
  }

  requireAuditService() {
    return requireFinancialAuditService(this.auditService);
  }
}
