import { createId } from "../core/id.js";

export class AuditEngine {
  constructor(state) {
    this.state = state;
  }

  handleEvent(event) {
    const record = {
      id: createId("audit"),
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

    this.state.audit.unshift(record);

    if (event.objectType === "transport" || event.transportId) {
      const transportId = event.objectType === "transport" ? event.objectId : event.transportId;
      const transport = this.state.transports.find((item) => item.id === transportId);
      if (transport) transport.auditIds.unshift(record.id);
    }
  }
}
