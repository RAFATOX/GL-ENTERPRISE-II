import { AuthorityDocumentTypes, AuthoritySubtypes, EventTypes, Roles, TransportStatuses } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class AuthorityAccessEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return (this.state.authorityControls || []).find((item) => (
      item.transportId === transportId && !["CONTROL_PASSED", "CONTROL_ISSUE_FOUND"].includes(item.status)
    )) || null;
  }

  start(transport, actor, payload, modules) {
    const control = this.ensureControl(transport, actor, payload);
    control.status = "CONTROL_STARTED";
    control.updatedAt = nowIso();
    const history = this.recordHistory(control, transport, actor, payload, "rozpoczęcie kontroli", "w toku");
    return {
      control,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.CONTROL_STARTED,
          EventTypes.AUTHORITY_CONTROL_STARTED,
          "organ kontrolny rozpoczął kontrolowany dostęp"
        ),
        this.accessEvent(transport, history, "wejście organu kontrolnego zapisane w historii kontroli")
      ]
    };
  }

  documentCheck(transport, actor, payload, modules) {
    const control = this.ensureControl(transport, actor, payload);
    control.status = "DOCUMENT_CHECK";
    control.checkedDocumentTypes = payload.checkedDocumentTypes || this.defaultDocumentTypes(transport);
    control.updatedAt = nowIso();
    const history = this.recordHistory(control, transport, actor, payload, "sprawdzenie dokumentów", "w toku");
    return {
      control,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.DOCUMENT_CHECK,
          EventTypes.AUTHORITY_DOCUMENT_CHECKED,
          `sprawdzone dokumenty: ${control.checkedDocumentTypes.join(", ")}`
        ),
        this.accessEvent(transport, history, "sprawdzenie dokumentów zapisane w historii kontroli")
      ]
    };
  }

  roadInspection(transport, actor, payload, modules) {
    const control = this.ensureControl(transport, actor, payload);
    control.status = "ROAD_INSPECTION";
    control.updatedAt = nowIso();
    const history = this.recordHistory(control, transport, actor, payload, "kontrola drogowa", "w toku");
    return {
      control,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.ROAD_INSPECTION,
          EventTypes.AUTHORITY_ROAD_INSPECTION_DONE,
          "sprawdzenie pojazdu i legalności przewozu"
        ),
        this.accessEvent(transport, history, "kontrola drogowa zapisana w historii")
      ]
    };
  }

  pass(transport, actor, payload, modules) {
    const control = this.ensureControl(transport, actor, payload);
    control.status = "CONTROL_PASSED";
    control.result = "passed";
    control.updatedAt = nowIso();
    const history = this.recordHistory(control, transport, actor, payload, "wynik kontroli", "pozytywny");
    return {
      control,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.CONTROL_PASSED,
          EventTypes.AUTHORITY_CONTROL_PASSED,
          "kontrola drogowa zakończona pozytywnie"
        ),
        this.accessEvent(transport, history, "pozytywny wynik kontroli zapisany w historii")
      ]
    };
  }

  issue(transport, actor, payload, modules) {
    const control = this.ensureControl(transport, actor, payload);
    control.status = "CONTROL_ISSUE_FOUND";
    control.result = "issue_found";
    control.issue = payload.issue || "brak wymaganego pozwolenia";
    control.updatedAt = nowIso();
    transport.riskFlagged = true;
    const history = this.recordHistory(control, transport, actor, payload, "wynik kontroli", control.issue);
    return {
      control,
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.CONTROL_ISSUE_FOUND,
          EventTypes.AUTHORITY_ISSUE_FOUND,
          control.issue
        ),
        this.accessEvent(transport, history, "problem kontroli zapisany w historii")
      ]
    };
  }

  ensureControl(transport, actor, payload = {}) {
    this.state.authorityControls ||= [];
    let control = this.getForTransport(transport.id);
    if (control) return control;
    control = {
      id: createId("authctrl"),
      transportId: transport.id,
      authorityUserId: actor.role === Roles.AUTHORITY_USER ? actor.userId : payload.authorityUserId || "u-authority-police",
      authoritySubtype: payload.authoritySubtype || actor.authoritySubtype || AuthoritySubtypes.POLICE,
      place: payload.place || transport.pickup?.address || "kontrola drogowa",
      vehicleId: transport.vehicleId,
      carrierCompanyId: transport.carrierCompanyId,
      status: "CONTROL_STARTED",
      result: "in_progress",
      issue: null,
      checkedDocumentTypes: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.state.authorityControls.unshift(control);
    return control;
  }

  recordHistory(control, transport, actor, payload, controlType, result) {
    this.state.authorityControlHistory ||= [];
    const history = {
      id: createId("authhist"),
      controlId: control.id,
      authorityUserId: control.authorityUserId,
      authoritySubtype: control.authoritySubtype,
      checkedAt: nowIso(),
      place: payload.place || control.place,
      vehicleId: transport.vehicleId,
      transportId: transport.id,
      controlType,
      result,
      checkedDocumentTypes: control.checkedDocumentTypes || [],
      recordedBy: actor.userId
    };
    this.state.authorityControlHistory.unshift(history);
    return history;
  }

  defaultDocumentTypes(transport) {
    const visibleDocs = this.state.documents.filter((doc) => (
      doc.transportId === transport.id && AuthorityDocumentTypes.includes(doc.type)
    ));
    return visibleDocs.length ? visibleDocs.map((doc) => doc.type) : ["cmr"];
  }

  accessEvent(transport, history, reason) {
    return {
      type: EventTypes.AUTHORITY_ACCESS_RECORDED,
      objectType: "authority_control",
      objectId: history.controlId,
      transportId: transport.id,
      previousState: null,
      newState: history.result,
      reason
    };
  }

  statusEvent(modules, transport, actor, nextStatus, eventType, reason) {
    const previousState = transport.status;
    modules.transports.setStatus(transport, nextStatus, actor, reason);
    return {
      type: eventType,
      objectType: "transport",
      objectId: transport.id,
      previousState,
      newState: transport.status,
      reason
    };
  }
}
