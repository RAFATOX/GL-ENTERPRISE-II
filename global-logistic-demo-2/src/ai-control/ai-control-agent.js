import { EventTypes, PaymentStatuses } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class AiControlAgent {
  constructor(state) {
    this.state = state;
  }

  inspectTransport(transport, modules) {
    const reasons = [];

    if (!modules.gps.transportHasCoordinates(transport)) {
      reasons.push("missing GPS coordinates");
    }
    if (!transport.cargo.prePublishPhotoId) {
      reasons.push("missing pre-publication load photo");
    }
    if (transport.carrierCompanyId && modules.companies.trustScore(transport.carrierCompanyId) < 70) {
      reasons.push("carrier trust score below threshold");
    }
    if (transport.driverId && !modules.driverTime.canAssign(transport.driverId).ok) {
      reasons.push("driver time violation risk");
    }
    if (transport.activeDisputeId) {
      reasons.push("active dispute");
    }
    const customsCase = this.state.customsCases?.find((item) => item.transportId === transport.id);
    if (customsCase?.status === "CUSTOMS_HOLD") {
      reasons.push(`customs hold: ${customsCase.holdReason || "manual customs hold"}`);
    }
    if (customsCase && !modules.documents.hasDocumentType(transport, "mrn")) {
      reasons.push("missing MRN customs document");
    }
    const authorityControl = this.state.authorityControls?.find((item) => item.transportId === transport.id && item.result === "issue_found");
    if (authorityControl) {
      reasons.push(`authority control issue: ${authorityControl.issue || "issue found"}`);
    }
    const serviceRequest = this.state.serviceRequests?.find((item) => item.transportId === transport.id && item.status !== "completed");
    if (serviceRequest) {
      reasons.push(`technical service active: ${serviceRequest.faultType}`);
    }
    const ferryBooking = this.state.ferryBookings?.find((item) => item.transportId === transport.id);
    if (ferryBooking?.status === "DELAYED") {
      reasons.push("ferry delay affects ETA");
    }
    if (transport.eta && Date.parse(transport.eta) < Date.now()) {
      reasons.push("ETA requires refresh");
    }
    if (transport.paymentStatus === PaymentStatuses.BLOCKED) {
      reasons.push("payment already blocked");
    }

    if (!reasons.length) {
      return {
        alert: null,
        events: [],
        reason: "AI check passed"
      };
    }

    const alert = {
      id: createId("ai"),
      transportId: transport.id,
      severity: reasons.length > 1 ? "high" : "medium",
      reason: reasons.join("; "),
      status: "open",
      createdAt: nowIso()
    };
    this.state.aiAlerts.unshift(alert);
    transport.activeAiAlertId = alert.id;
    transport.riskFlagged = true;

    const events = [{
      type: EventTypes.AI_ALERT_CREATED,
      objectType: "transport",
      objectId: transport.id,
      reason: alert.reason,
      source: "AI"
    }];

    if (transport.carrierCompanyId) {
      const trustEvent = modules.trust.change(transport.carrierCompanyId, -3, `AI risk: ${alert.reason}`);
      if (trustEvent) events.push({ ...trustEvent, source: "AI" });
    }

    return { alert, events, reason: alert.reason };
  }
}
