export class EventBus {
  constructor(state) {
    this.state = state;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  publish(event) {
    this.state.events.unshift(event);
    if (event.objectType === "transport" || event.transportId) {
      const transportId = event.objectType === "transport" ? event.objectId : event.transportId;
      const transport = this.state.transports.find((item) => item.id === transportId);
      if (transport) transport.eventIds.unshift(event.id);
    }
    this.listeners.forEach((listener) => {
      const result = listener(event);
      const auditLogId = typeof result === "string" ? result : result?.id || result?.auditLogId || result?.audit_log_id;
      if (auditLogId && !event.auditLogId) {
        event.auditLogId = auditLogId;
        event.audit_log_id = auditLogId;
      }
    });
    return event;
  }
}
