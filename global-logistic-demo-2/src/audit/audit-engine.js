import { createId } from "../core/id.js";

export class AuditEngine {
  constructor(state) {
    this.state = state;
  }

  handleEvent(event) {
    const auditLogId = event.auditLogId || event.audit_log_id || createId("audit");
    const existing = this.state.audit.find((row) => row.id === auditLogId || row.audit_log_id === auditLogId);
    if (existing) {
      existing.eventId ||= event.id;
      existing.requestedAction ||= event.requestedAction || event.type;
      existing.transportId ||= event.transportId || null;
      event.auditLogId = existing.id;
      event.audit_log_id = existing.id;
      return existing.id;
    }

    const record = {
      id: auditLogId,
      audit_log_id: auditLogId,
      eventId: event.id,
      at: event.at,
      actorId: event.actorId,
      actorRole: event.actorRole,
      actorCompanyId: event.actorCompanyId || null,
      actorCompanyRole: event.actorCompanyRole || null,
      actorContextType: event.actorContextType || null,
      objectType: event.objectType,
      objectId: event.objectId,
      transportId: event.transportId || null,
      action: event.type,
      requestedAction: event.requestedAction || event.type,
      result: event.result || (event.type === "ACTION_BLOCKED" ? "blocked" : "success"),
      previousState: event.previousState ?? null,
      newState: event.newState ?? null,
      device: event.device || "demo-browser",
      reason: event.reason || "not provided",
      source: event.source,
      readOnly: true
    };

    event.auditLogId = auditLogId;
    event.audit_log_id = auditLogId;
    this.state.audit.unshift(record);

    if (event.objectType === "transport" || event.transportId) {
      const transportId = event.objectType === "transport" ? event.objectId : event.transportId;
      const transport = this.state.transports.find((item) => item.id === transportId);
      if (transport) transport.auditIds.unshift(record.id);
    }

    return auditLogId;
  }
}
