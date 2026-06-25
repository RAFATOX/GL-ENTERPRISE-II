import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class DigitalCmrEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return this.state.digitalCmrs.find((cmr) => cmr.transportId === transportId) || null;
  }

  createOrUpdate(transport) {
    let cmr = this.getForTransport(transport.id);
    if (!cmr) {
      cmr = {
        id: createId("cmr"),
        transportId: transport.id,
        status: "draft",
        documentIds: [...transport.documentIds],
        signatures: [],
        createdAt: nowIso(),
        lockedAt: null
      };
      this.state.digitalCmrs.unshift(cmr);
      return {
        type: EventTypes.DIGITAL_CMR_CREATED,
        objectType: "digital_cmr",
        objectId: cmr.id,
        transportId: transport.id,
        previousState: null,
        newState: cmr.status,
        reason: "digital CMR draft generated from transport data"
      };
    }
    cmr.documentIds = [...new Set([...cmr.documentIds, ...transport.documentIds])];
    return null;
  }

  lockIfReady(transport) {
    const cmr = this.getForTransport(transport.id);
    if (!cmr || cmr.status === "locked") return null;
    const previousState = cmr.status;
    cmr.status = "locked";
    cmr.lockedAt = nowIso();
    cmr.signatures = [...new Set([...cmr.signatures, "warehouse", "driver", "receiver"])];
    return {
      type: EventTypes.DIGITAL_CMR_LOCKED,
      objectType: "digital_cmr",
      objectId: cmr.id,
      transportId: transport.id,
      previousState,
      newState: cmr.status,
      reason: "digital CMR locked after required document confirmation"
    };
  }
}
