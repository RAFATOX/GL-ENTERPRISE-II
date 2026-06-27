import { SourceTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class FinancialAuditService {
  constructor(state) {
    this.state = state;
  }

  createRecord(input = {}) {
    if (!this.state || !Array.isArray(this.state.audit)) {
      throw new Error("Audit Service is required for financial operations");
    }
    if (!input.action || !input.objectType || !input.objectId) {
      throw new Error("Financial audit record requires action, objectType and objectId");
    }

    const auditLogId = input.auditLogId || input.audit_log_id || createId("audit");
    const existing = this.state.audit.find((row) => row.id === auditLogId || row.audit_log_id === auditLogId);
    if (existing) return existing.id;

    const actor = input.actor || {};
    const audit = {
      id: auditLogId,
      audit_log_id: auditLogId,
      eventId: input.eventId || null,
      at: input.at || nowIso(),
      actorId: input.actorId || actor.userId || "system",
      actorRole: input.actorRole || actor.role || "system",
      actorCompanyId: input.actorCompanyId ?? actor.companyId ?? null,
      actorCompanyRole: input.actorCompanyRole ?? actor.companyRole ?? null,
      actorContextType: input.actorContextType ?? actor.contextType ?? "system",
      objectType: input.objectType,
      objectId: input.objectId,
      transportId: input.transportId || null,
      action: input.action,
      requestedAction: input.requestedAction || input.action,
      result: input.result || "success",
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      device: input.device || "financial-engine",
      reason: input.reason || "financial operation audit",
      source: input.source || SourceTypes.SYSTEM,
      readOnly: true
    };

    this.state.audit.unshift(audit);
    if (audit.transportId) {
      const transport = this.state.transports?.find((item) => item.id === audit.transportId);
      if (transport) {
        transport.auditIds ||= [];
        if (!transport.auditIds.includes(audit.id)) transport.auditIds.unshift(audit.id);
      }
    }
    return auditLogId;
  }
}

export function requireFinancialAuditService(auditService) {
  if (!auditService || typeof auditService.createRecord !== "function") {
    throw new Error("Audit Service is required for financial operations");
  }
  if (!Array.isArray(auditService.state?.audit)) {
    throw new Error("Audit Service is required for financial operations");
  }
  return auditService;
}
