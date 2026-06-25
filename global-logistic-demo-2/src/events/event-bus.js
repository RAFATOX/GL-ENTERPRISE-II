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
    this.listeners.forEach((listener) => listener(event));
  }
}
