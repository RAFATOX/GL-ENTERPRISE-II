import { EventTypes } from "../core/constants.js";

export class GpsEngine {
  constructor(state) {
    this.state = state;
  }

  hasCoordinates(point) {
    return Number.isFinite(point?.gps?.lat) && Number.isFinite(point?.gps?.lng);
  }

  transportHasCoordinates(transport) {
    return this.hasCoordinates(transport.pickup) && this.hasCoordinates(transport.delivery);
  }

  confirmCoordinates(transport, payload) {
    if (payload.pickupGps) transport.pickup.gps = payload.pickupGps;
    if (payload.deliveryGps) transport.delivery.gps = payload.deliveryGps;
    return {
      type: EventTypes.GPS_COORDINATES_CONFIRMED,
      objectType: "transport",
      objectId: transport.id,
      reason: "pickup and delivery GPS coordinates confirmed"
    };
  }
}
