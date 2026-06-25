import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class PlateToDriverEngine {
  constructor(state) {
    this.state = state;
  }

  scan(actor, payload) {
    const normalizedPlate = normalizePlate(payload.licensePlate);
    const vehicle = this.state.vehicles.find((item) => normalizePlate(item.plate) === normalizedPlate);
    const transport = vehicle
      ? this.state.transports.find((item) => item.vehicleId === vehicle.id && !["completed", "cancelled"].includes(item.status))
      : null;
    const driver = transport?.driverId
      ? this.state.users.find((user) => user.id === transport.driverId)
      : null;
    const lookup = {
      id: createId("plate"),
      licensePlate: payload.licensePlate,
      vehicleId: vehicle?.id || null,
      transportId: transport?.id || null,
      driverId: driver?.id || null,
      scannerUserId: actor.userId,
      reason: payload.reason || "manual plate lookup",
      status: transport ? "matched" : "not_found",
      createdAt: nowIso()
    };
    this.state.plateLookups.unshift(lookup);
    return {
      lookup,
      event: {
        type: EventTypes.LICENSE_PLATE_IDENTIFIED,
        objectType: "plate_lookup",
        objectId: lookup.id,
        transportId: transport?.id || null,
        previousState: null,
        newState: lookup.status,
        reason: transport
          ? "license plate matched active transport without exposing private phone"
          : "license plate lookup did not find active transport"
      }
    };
  }

  createTemporaryChat(lookup, modules) {
    if (!lookup.transportId || !lookup.driverId) return null;
    const transport = modules.transports.getById(lookup.transportId);
    if (!transport) return null;
    const thread = modules.communication.threadForTransport(transport);
    return {
      type: EventTypes.PLATE_CHAT_CREATED,
      objectType: "message_thread",
      objectId: thread.id,
      transportId: transport.id,
      previousState: null,
      newState: lookup.driverId,
      reason: "temporary plate-to-driver chat context created"
    };
  }
}

function normalizePlate(value = "") {
  return String(value).replace(/\s+/g, "").toUpperCase();
}
