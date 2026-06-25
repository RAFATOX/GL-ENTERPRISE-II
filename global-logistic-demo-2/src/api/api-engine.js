import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class ApiEngine {
  constructor(state) {
    this.state = state;
  }

  getClient(apiClientId) {
    return this.state.apiClients.find((client) => client.id === apiClientId) || null;
  }

  simulateCall(actor, payload) {
    const client = this.getClient(payload.apiClientId || "api-erp-nord");
    const action = payload.apiAction || "CREATE_LOAD";
    const allowed = Boolean(client?.scopes.includes(action)) && client.status === "active";
    const overLimit = client ? client.usedToday + 1 > client.dailyLimit : false;
    if (client) client.usedToday += 1;

    const row = {
      id: createId("api_audit"),
      apiClientId: client?.id || "unknown",
      action,
      result: allowed && !overLimit ? "allowed" : "blocked",
      reason: overLimit ? "rate limit exceeded" : allowed ? "scope accepted" : "scope denied",
      actorId: actor.userId,
      at: nowIso()
    };
    this.state.apiAudit.unshift(row);

    return {
      row,
      event: {
        type: overLimit ? EventTypes.API_RATE_LIMIT_FLAGGED : EventTypes.API_CALL_RECORDED,
        objectType: "api_call",
        objectId: row.id,
        previousState: null,
        newState: row.result,
        reason: row.reason
      }
    };
  }
}
