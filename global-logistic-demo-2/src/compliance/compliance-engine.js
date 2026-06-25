import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class ComplianceEngine {
  constructor(state) {
    this.state = state;
  }

  runDriverCheck(transport, modules) {
    const driverIds = new Set([transport.driverId].filter(Boolean));
    const crewPlan = this.state.crewPlans.find((plan) => plan.transportId === transport.id);
    (crewPlan?.driverIds || []).forEach((driverId) => driverIds.add(driverId));

    const violations = [];
    driverIds.forEach((driverId) => {
      const driverTime = modules.driverTime.get(driverId);
      const tachograph = this.state.tachographImports.find((item) => item.driverId === driverId);
      if (!driverTime) violations.push(`${driverId}: missing driver time`);
      if (!tachograph) violations.push(`${driverId}: missing tachograph import`);
      if (driverTime && !driverTime.legalToComplete) violations.push(`${driverId}: legal time blocked`);
      if (tachograph?.status === "violation") violations.push(`${driverId}: tachograph violation`);
    });

    if (crewPlan?.doubleCrew && driverIds.size < 2) {
      violations.push("double crew plan requires two drivers");
    }

    const check = {
      id: createId("compliance"),
      transportId: transport.id,
      driverIds: [...driverIds],
      status: violations.length ? "blocked" : "passed",
      violations,
      doubleCrew: Boolean(crewPlan?.doubleCrew),
      ferryRailAllowance: Boolean(crewPlan?.ferryRailAllowance),
      checkedAt: nowIso()
    };
    this.state.complianceChecks.unshift(check);
    return {
      check,
      event: {
        type: violations.length ? EventTypes.COMPLIANCE_CHECK_BLOCKED : EventTypes.COMPLIANCE_CHECK_COMPLETED,
        objectType: "compliance_check",
        objectId: check.id,
        transportId: transport.id,
        previousState: null,
        newState: check.status,
        reason: violations.length ? violations.join("; ") : "driver time, tachograph and crew plan passed"
      }
    };
  }

  addCompanyComplianceEntry(actor, payload) {
    this.state.companyComplianceEntries ||= [];
    const entry = {
      id: createId("company_compliance"),
      companyId: payload.companyId,
      transportId: payload.transportId || null,
      authoritySubtype: payload.authoritySubtype || null,
      type: payload.type || "authority_note",
      amount: payload.amount || null,
      currency: payload.currency || "EUR",
      reason: payload.reason || "wpis zgodności firmy",
      createdBy: actor.userId,
      createdAt: nowIso()
    };
    this.state.companyComplianceEntries.unshift(entry);
    return entry;
  }
}
