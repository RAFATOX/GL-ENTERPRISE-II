import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class ResilienceEngine {
  constructor(state) {
    this.state = state;
  }

  runCheck() {
    const degraded = this.state.serviceHealth.filter((service) => service.status !== "healthy");
    const snapshot = {
      id: createId("resilience"),
      checkedAt: nowIso(),
      degradedServiceIds: degraded.map((service) => service.id),
      backupOk: this.state.backupSnapshots.every((backup) => backup.status === "ok"),
      emergencyModeReady: true
    };
    this.state.resilienceChecks = this.state.resilienceChecks || [];
    this.state.resilienceChecks.unshift(snapshot);
    this.state.emergencyMode.lastCheckedAt = snapshot.checkedAt;
    return {
      snapshot,
      events: [{
        type: EventTypes.RESILIENCE_CHECK_COMPLETED,
        objectType: "resilience_check",
        objectId: snapshot.id,
        previousState: null,
        newState: degraded.length ? "degraded" : "healthy",
        reason: degraded.length
          ? `${degraded.length} degraded service(s), emergency mode ready`
          : "all critical demo services healthy"
      }, {
        type: EventTypes.EMERGENCY_MODE_READY,
        objectType: "system",
        objectId: "emergency-mode",
        previousState: this.state.emergencyMode.enabled,
        newState: snapshot.emergencyModeReady,
        reason: "transport, documents and communication remain critical services"
      }]
    };
  }
}
