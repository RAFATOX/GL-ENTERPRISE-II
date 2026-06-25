import { EventTypes } from "../core/constants.js";
import { nowIso } from "../core/id.js";

export class TrustEngine {
  constructor(state) {
    this.state = state;
  }

  get(subjectId) {
    return this.state.trustRecords.find((record) => record.subjectId === subjectId) || null;
  }

  score(subjectId) {
    return this.get(subjectId)?.score ?? 0;
  }

  change(subjectId, delta, reason) {
    const record = this.get(subjectId);
    if (!record) return null;
    const previous = record.score;
    record.score = Math.max(0, Math.min(100, record.score + delta));
    record.history.unshift({ at: nowIso(), delta, reason });
    const company = this.state.companies.find((item) => item.id === subjectId);
    if (company) company.trustScore = record.score;
    return {
      type: EventTypes.TRUST_SCORE_CHANGED,
      objectType: record.subjectType,
      objectId: subjectId,
      previousState: previous,
      newState: record.score,
      reason
    };
  }
}
