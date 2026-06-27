import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class ComplianceEngine {
  constructor(state) {
    this.state = state;
  }

  handleEvent(event) {
    if (!shouldRecordEvent(event)) return;
    this.state.complianceFindings ||= [];
    this.state.complianceFindings.unshift({
      id: createId("compliance_signal"),
      eventId: event.id,
      userId: event.actorId || event.objectId || null,
      objectType: event.objectType,
      objectId: event.objectId,
      transportId: event.transportId || null,
      type: complianceType(event),
      severity: event.type === EventTypes.ACTION_BLOCKED ? "medium" : "info",
      reason: event.reason || "sygnal zgodnosci",
      createdAt: nowIso()
    });
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

function complianceType(event) {
  if (event.type === EventTypes.ACTION_BLOCKED) return "proba_obejscia_weryfikacji";
  if (event.type === EventTypes.COMPLIANCE_SIGNAL_RECORDED) return event.newState || "sygnal_compliance";
  if (event.type === EventTypes.DOCUMENT_REJECTED) return "odrzucony_dokument";
  if (event.type === EventTypes.ONBOARDING_REJECTED) return "odrzucone_konto";
  return "onboarding_compliance";
}

function shouldRecordEvent(event) {
  if (!event) return false;
  if ([EventTypes.COMPLIANCE_SIGNAL_RECORDED, EventTypes.DOCUMENT_REJECTED, EventTypes.ONBOARDING_REJECTED].includes(event.type)) {
    return true;
  }
  if (event.type !== EventTypes.ACTION_BLOCKED) return false;
  const reason = String(event.reason || "").toLowerCase();
  return [
    "weryfik",
    "verification",
    "dokument",
    "document",
    "wallet",
    "portfel",
    "escrow",
    "konto",
    "account",
    "onboarding"
  ].some((word) => reason.includes(word));
}
