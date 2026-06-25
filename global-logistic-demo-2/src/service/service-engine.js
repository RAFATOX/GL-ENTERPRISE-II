import { EventTypes, Roles } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

const ServiceRoleByType = {
  workshop: Roles.WORKSHOP,
  mobile_service: Roles.MOBILE_SERVICE,
  roadside_assistance: Roles.ROADSIDE_ASSISTANCE
};

export class ServiceEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return (this.state.serviceRequests || []).find((request) => (
      request.transportId === transportId && request.status !== "completed"
    )) || null;
  }

  reportBreakdown(transport, actor, payload) {
    this.state.serviceRequests ||= [];
    let request = this.getForTransport(transport.id);
    if (!request) {
      request = {
        id: createId("srv"),
        transportId: transport.id,
        transportNumber: transport.number,
        vehicleId: transport.vehicleId,
        driverId: transport.driverId,
        carrierCompanyId: transport.carrierCompanyId,
        reportedBy: actor.userId,
        faultType: payload.faultType || "awaria pojazdu",
        description: payload.description || "kierowca zgłasza awarię na trasie",
        gps: payload.gps || transport.pickup?.gps || null,
        status: "breakdown_reported",
        providerCompanyId: null,
        providerType: null,
        responseMinutes: null,
        cost: null,
        currency: "EUR",
        rating: null,
        documentId: null,
        etaBefore: transport.eta || null,
        etaAfter: payload.etaAfter || addMinutesIso(transport.eta, 45),
        insuranceRelevant: Boolean(payload.insuranceRelevant),
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      this.state.serviceRequests.unshift(request);
    }
    transport.activeServiceRequestId = request.id;
    transport.eta = request.etaAfter || transport.eta;
    return {
      request,
      events: [
        {
          type: EventTypes.SERVICE_BREAKDOWN_REPORTED,
          objectType: "service_request",
          objectId: request.id,
          transportId: transport.id,
          previousState: null,
          newState: request.status,
          reason: `${request.faultType}: ${request.description}`
        },
        {
          type: EventTypes.SERVICE_ETA_UPDATED,
          objectType: "transport",
          objectId: transport.id,
          previousState: request.etaBefore,
          newState: request.etaAfter,
          reason: "AI zaktualizowało ETA po zgłoszeniu awarii"
        }
      ]
    };
  }

  requestService(transport, actor, payload) {
    const request = this.getForTransport(transport.id) || this.reportBreakdown(transport, actor, payload).request;
    const provider = this.findProvider(payload.providerCompanyId, payload.providerType, request.gps);
    if (provider) {
      request.providerCompanyId = provider.companyId;
      request.providerType = provider.type;
      request.responseMinutes = provider.responseMinutes;
      request.cost = payload.cost || provider.baseCost;
    }
    request.status = "provider_selected";
    request.updatedAt = nowIso();
    return {
      request,
      events: [
        {
          type: EventTypes.SERVICE_PROVIDER_SELECTED,
          objectType: "service_request",
          objectId: request.id,
          transportId: transport.id,
          previousState: "breakdown_reported",
          newState: request.status,
          reason: provider ? `wybrano ${provider.name}` : "wybrano serwis techniczny"
        }
      ]
    };
  }

  acceptService(transport, actor, payload) {
    const request = this.getForTransport(transport.id) || this.requestService(transport, actor, payload).request;
    request.providerCompanyId = request.providerCompanyId || actor.companyId || payload.providerCompanyId;
    request.status = "accepted";
    request.acceptedAt = nowIso();
    request.updatedAt = nowIso();
    return {
      request,
      events: [
        {
          type: EventTypes.SERVICE_ACCEPTED,
          objectType: "service_request",
          objectId: request.id,
          transportId: transport.id,
          previousState: "provider_selected",
          newState: request.status,
          reason: "serwis potwierdził przyjęcie zgłoszenia"
        }
      ]
    };
  }

  completeService(transport, actor, payload, modules) {
    const request = this.getForTransport(transport.id) || this.acceptService(transport, actor, payload).request;
    request.status = "completed";
    request.completedAt = nowIso();
    request.updatedAt = nowIso();
    request.cost = payload.cost || request.cost || 280;
    request.rating = payload.rating || 5;
    request.etaAfter = payload.etaAfter || request.etaAfter || transport.eta;
    transport.eta = request.etaAfter || transport.eta;
    transport.activeServiceRequestId = null;

    const events = [
      {
        type: EventTypes.SERVICE_COMPLETED,
        objectType: "service_request",
        objectId: request.id,
        transportId: transport.id,
        previousState: "accepted",
        newState: request.status,
        reason: "serwis zakończył obsługę awarii"
      }
    ];

    if (!modules.documents.hasDocumentType(transport, "service_report")) {
      const documentResult = modules.documents.upload(transport, actor, {
        type: "service_report",
        label: `Raport serwisowy ${transport.number}`,
        visibleToRoles: [
          Roles.PLATFORM_OWNER,
          Roles.ADMIN,
          Roles.CARRIER_OWNER,
          Roles.DRIVER,
          Roles.INSURANCE_PARTNER,
          Roles.WORKSHOP,
          Roles.MOBILE_SERVICE,
          Roles.ROADSIDE_ASSISTANCE
        ]
      });
      request.documentId = documentResult.document.id;
      events.push(documentResult.event);
    }

    const paymentEvent = this.simulatePayment(transport, request);
    if (paymentEvent) events.push(paymentEvent);
    if (request.providerCompanyId && !this.walletCreditAlreadyExists(request)) {
      const walletEvent = modules.wallets.credit(
        request.providerCompanyId,
        transport.id,
        request.cost,
        `opłata za serwis techniczny ${request.id}`
      );
      if (walletEvent) events.push(walletEvent);
    }

    events.push({
      type: EventTypes.SERVICE_ETA_UPDATED,
      objectType: "transport",
      objectId: transport.id,
      previousState: request.etaBefore,
      newState: request.etaAfter,
      reason: "ETA po zakończeniu serwisu przekazane klientowi i magazynowi"
    });

    return { request, events };
  }

  findProvider(providerCompanyId, providerType, gps) {
    const providers = this.state.serviceProviders || [];
    if (providerCompanyId) return providers.find((provider) => provider.companyId === providerCompanyId) || null;
    const candidates = providers.filter((provider) => !providerType || provider.type === providerType);
    if (!candidates.length) return null;
    if (!gps) return candidates[0];
    return candidates
      .map((provider) => ({ provider, distance: distance(gps, provider.gps) }))
      .sort((a, b) => a.distance - b.distance)[0].provider;
  }

  simulatePayment(transport, request) {
    this.state.servicePayments ||= [];
    const exists = this.state.servicePayments.some((payment) => payment.serviceRequestId === request.id);
    if (exists) return null;
    const payment = {
      id: createId("spay"),
      serviceRequestId: request.id,
      transportId: transport.id,
      providerCompanyId: request.providerCompanyId,
      amount: request.cost || 0,
      currency: request.currency || "EUR",
      status: "simulated_paid",
      createdAt: nowIso()
    };
    this.state.servicePayments.unshift(payment);
    return {
      type: EventTypes.SERVICE_PAYMENT_SIMULATED,
      objectType: "service_request",
      objectId: request.id,
      transportId: transport.id,
      previousState: null,
      newState: payment.status,
      reason: `płatność demo za serwis ${payment.amount} ${payment.currency}`
    };
  }

  walletCreditAlreadyExists(request) {
    const wallet = this.state.wallets.find((item) => item.ownerCompanyId === request.providerCompanyId);
    if (!wallet) return false;
    return this.state.walletLedger.some((entry) => (
      entry.walletId === wallet.id
      && entry.transportId === request.transportId
      && entry.type === "credit"
      && entry.reason.includes(request.id)
    ));
  }
}

function addMinutesIso(value, minutes) {
  if (!value) return null;
  return new Date(Date.parse(value) + minutes * 60000).toISOString();
}

function distance(a, b) {
  const lat = Number(a.lat) - Number(b.lat);
  const lng = Number(a.lng) - Number(b.lng);
  return Math.sqrt(lat * lat + lng * lng);
}

export function serviceRoleForType(type) {
  return ServiceRoleByType[type] || Roles.WORKSHOP;
}
