import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class SecurityEngine {
  constructor(state) {
    this.state = state;
  }

  checksForTransport(transportId) {
    return this.state.securityChecks.filter((check) => check.transportId === transportId);
  }

  isCleared(transportId, checkpoint) {
    const latest = this.checksForTransport(transportId)
      .filter((check) => check.checkpoint === checkpoint)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    return latest?.status === "cleared";
  }

  record(transport, actor, payload) {
    const status = payload.status || (payload.cleared === false ? "blocked" : "cleared");
    const check = {
      id: createId("security"),
      transportId: transport.id,
      checkpoint: payload.checkpoint || "pickup",
      status,
      officerId: actor.userId,
      reason: payload.reason || (status === "cleared" ? "gate check cleared" : "gate check blocked"),
      createdAt: nowIso()
    };
    this.state.securityChecks.unshift(check);
    if (status !== "cleared") {
      transport.riskFlagged = true;
    }
    return {
      check,
      event: {
        type: status === "cleared" ? EventTypes.SECURITY_CHECK_RECORDED : EventTypes.SECURITY_GATE_DENIED,
        objectType: "security_check",
        objectId: check.id,
        transportId: transport.id,
        previousState: null,
        newState: check.status,
        reason: check.reason
      }
    };
  }
}
