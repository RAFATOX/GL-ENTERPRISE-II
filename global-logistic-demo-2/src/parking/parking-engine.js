import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class ParkingEngine {
  constructor(state) {
    this.state = state;
  }

  getById(parkingId) {
    return this.state.parking.find((parking) => parking.id === parkingId) || null;
  }

  report(parkingId, actor, payload) {
    const parking = this.getById(parkingId);
    if (!parking) return null;
    const report = {
      id: createId("parking_report"),
      at: nowIso(),
      driverId: actor.userId,
      freePlaces: Number(payload.freePlaces ?? parking.freePlaces),
      status: payload.status || "availability_confirmed",
      photoAdded: Boolean(payload.photoAdded),
      credible: payload.credible !== false
    };
    parking.freePlaces = report.freePlaces;
    parking.reports.unshift(report);
    return {
      parking,
      report,
      event: {
        type: EventTypes.PARKING_SELECTED,
        objectType: "parking",
        objectId: parking.id,
        reason: report.credible
          ? "driver parking availability report accepted"
          : "parking report marked as unreliable"
      }
    };
  }
}
