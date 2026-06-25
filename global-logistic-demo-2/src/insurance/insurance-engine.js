import { EventTypes, TransportStatuses } from "../core/constants.js";
import { createId } from "../core/id.js";

export class InsuranceEngine {
  constructor(state) {
    this.state = state;
  }

  getById(policyId) {
    return this.state.insurancePolicies.find((policy) => policy.id === policyId) || null;
  }

  openClaim(transport, actor, payload) {
    const claim = {
      id: createId("claim"),
      transportId: transport.id,
      policyId: transport.insuranceId,
      status: "open",
      reason: payload.reason || "damage claim",
      createdBy: actor.userId,
      evidence: [...transport.photoIds, ...transport.documentIds]
    };
    this.state.claims.unshift(claim);
    transport.activeClaimId = claim.id;
    if (transport.insuranceId) {
      const policy = this.getById(transport.insuranceId);
      if (policy) policy.claimIds.push(claim.id);
    }
    return {
      claim,
      event: {
        type: EventTypes.CLAIM_OPENED,
        objectType: "transport",
        objectId: transport.id,
        previousState: transport.status,
        newState: TransportStatuses.CLAIM_OPENED,
        reason: "insurance claim connects transport, photos, GPS, documents and liability"
      }
    };
  }

  closeRiskForTransport(transport) {
    if (!transport.insuranceId) return null;
    const policy = this.getById(transport.insuranceId);
    if (!policy || policy.status === "closed_no_claim") return null;
    const previousState = policy.status;
    if (!transport.activeClaimId) {
      policy.status = "closed_no_claim";
    }
    return {
      type: EventTypes.INSURANCE_RISK_CLOSED,
      objectType: "insurance_policy",
      objectId: policy.id,
      transportId: transport.id,
      previousState,
      newState: policy.status,
      reason: "insurance risk closed after completed transport"
    };
  }
}
