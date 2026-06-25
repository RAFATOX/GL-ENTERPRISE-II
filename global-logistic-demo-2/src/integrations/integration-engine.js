import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class IntegrationEngine {
  constructor(state) {
    this.state = state;
  }

  getById(integrationId) {
    return this.state.integrations.find((integration) => integration.id === integrationId) || null;
  }

  sync(actor, payload) {
    const integration = this.getById(payload.integrationId || "int-erp-1");
    const blocked = !integration || integration.status === "blocked";
    const previousState = integration?.lastRunAt || null;
    const run = {
      id: createId("integration_run"),
      integrationId: integration?.id || "unknown",
      type: integration?.type || "unknown",
      status: blocked ? "blocked" : "completed",
      actorId: actor.userId,
      summary: blocked ? "integration unavailable" : `${integration.type} sync completed in demo mode`,
      at: nowIso()
    };
    this.state.integrationRuns.unshift(run);
    if (integration && !blocked) {
      integration.lastRunAt = run.at;
    }
    return {
      run,
      event: {
        type: blocked ? EventTypes.INTEGRATION_SYNC_BLOCKED : EventTypes.INTEGRATION_SYNC_COMPLETED,
        objectType: "integration_run",
        objectId: run.id,
        previousState,
        newState: run.status,
        reason: run.summary
      }
    };
  }
}
