import { EventTypes, Roles, TransportStatuses } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class FerryEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return (this.state.ferryBookings || []).find((booking) => booking.transportId === transportId) || null;
  }

  markRequired(transport, actor, payload, modules) {
    transport.transportMode = payload.transportMode || "INTERMODAL";
    transport.requiredDocumentTypes = unique([...(transport.requiredDocumentTypes || []), "ferry_ticket"]);
    return {
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.FERRY_REQUIRED,
          EventTypes.FERRY_REQUIRED_RECORDED,
          "transport wymaga przeprawy promowej"
        )
      ]
    };
  }

  book(transport, actor, payload, modules) {
    const booking = this.ensureBooking(transport, actor, payload);
    booking.status = "FERRY_BOOKED";
    booking.updatedAt = nowIso();
    transport.transportMode = "FERRY";
    transport.ferryBookingId = booking.id;
    transport.vehicleStatus = "FERRY_BOOKED";
    transport.eta = booking.etaAfterFerry;
    transport.requiredDocumentTypes = unique([...(transport.requiredDocumentTypes || []), "ferry_ticket"]);

    const events = [
      this.statusEvent(
        modules,
        transport,
        actor,
        TransportStatuses.FERRY_BOOKED,
        EventTypes.FERRY_BOOKED,
        `prom ${booking.departurePort}-${booking.arrivalPort} zarezerwowany`
      )
    ];

    const paymentEvent = this.simulatePayment(transport, booking, modules);
    if (paymentEvent) events.push(paymentEvent);

    if (!this.walletCreditAlreadyExists(booking)) {
      const walletEvent = modules.wallets.credit(
        booking.operatorCompanyId,
        transport.id,
        booking.cost,
        `symulowana platnosc promowa ${booking.departurePort}-${booking.arrivalPort}`
      );
      if (walletEvent) events.push(walletEvent);
    }

    if (!modules.documents.hasDocumentType(transport, "ferry_ticket")) {
      const documentResult = modules.documents.upload(transport, actor, {
        type: "ferry_ticket",
        label: `Bilet promowy ${booking.departurePort}-${booking.arrivalPort}`,
        visibleToRoles: [
          Roles.PLATFORM_OWNER,
          Roles.ADMIN,
          Roles.CLIENT_OWNER,
          Roles.CARRIER_OWNER,
          Roles.DRIVER,
          Roles.FERRY_OPERATOR
        ]
      });
      events.push(documentResult.event);
    }

    return { booking, events };
  }

  startPortNavigation(transport, actor, payload, modules) {
    const booking = this.ensureBooking(transport, actor, payload);
    booking.status = "GOING_TO_PORT";
    booking.updatedAt = nowIso();
    transport.transportMode = "FERRY";
    transport.vehicleStatus = "GOING_TO_PORT";
    return {
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.GOING_TO_PORT,
          EventTypes.FERRY_GOING_TO_PORT,
          "kierowca jedzie do portu promowego"
        )
      ]
    };
  }

  checkIn(transport, actor, payload, modules) {
    const booking = this.ensureBooking(transport, actor, payload);
    if (transport.status === TransportStatuses.GOING_TO_PORT) {
      booking.status = "WAITING_FOR_FERRY";
      booking.updatedAt = nowIso();
      transport.vehicleStatus = "WAITING_FOR_FERRY";
      return {
        events: [
          this.statusEvent(
            modules,
            transport,
            actor,
            TransportStatuses.WAITING_FOR_FERRY,
            EventTypes.FERRY_GOING_TO_PORT,
            "pojazd czeka w porcie na odprawe promowa"
          )
        ]
      };
    }

    booking.status = "CHECKED_IN_FERRY";
    booking.updatedAt = nowIso();
    transport.vehicleStatus = "CHECKED_IN_FERRY";
    return {
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.CHECKED_IN_FERRY,
          EventTypes.FERRY_CHECKED_IN,
          "odprawa promowa potwierdzona"
        )
      ]
    };
  }

  board(transport, actor, payload, modules) {
    const booking = this.ensureBooking(transport, actor, payload);

    if (transport.status === TransportStatuses.CHECKED_IN_FERRY) {
      booking.status = "BOARDING";
      booking.updatedAt = nowIso();
      transport.vehicleStatus = "BOARDING";
      return {
        events: [
          this.statusEvent(
            modules,
            transport,
            actor,
            TransportStatuses.BOARDING,
            EventTypes.FERRY_BOARDING,
            "pojazd wjezdza na prom"
          )
        ]
      };
    }

    booking.status = "ON_FERRY";
    booking.updatedAt = nowIso();
    transport.transportMode = "FERRY";
    transport.vehicleStatus = "ON_FERRY";
    transport.eta = payload.etaAfterFerry || booking.etaAfterFerry;
    modules.driverTime.recordFerryRest(transport.driverId, payload.restHours || booking.restHours || 1.5);

    return {
      events: [
        this.statusEvent(
          modules,
          transport,
          actor,
          TransportStatuses.ON_FERRY,
          EventTypes.FERRY_ONBOARD,
          "pojazd jest na promie, kierowca ma odpoczynek promowy"
        ),
        {
          type: EventTypes.FERRY_ETA_UPDATED,
          objectType: "transport",
          objectId: transport.id,
          previousState: null,
          newState: transport.eta,
          reason: "ETA przeliczona po wejściu na prom"
        }
      ]
    };
  }

  complete(transport, actor, payload, modules) {
    const booking = this.ensureBooking(transport, actor, payload);
    const previousState = transport.status;
    modules.transports.setStatus(transport, TransportStatuses.LEAVING_FERRY, actor, "zjazd z promu");
    modules.transports.setStatus(transport, TransportStatuses.FERRY_COMPLETED, actor, "przeprawa promowa zakonczona");
    modules.transports.setStatus(transport, TransportStatuses.CONTINUE_ROAD_TRANSPORT, actor, "kontynuacja transportu drogowego");
    booking.status = "FERRY_COMPLETED";
    booking.updatedAt = nowIso();
    transport.transportMode = "ROAD";
    transport.vehicleStatus = "ROAD";
    transport.eta = payload.etaAfterFerry || booking.etaAfterFerry;

    return {
      events: [
        {
          type: EventTypes.FERRY_COMPLETED,
          objectType: "transport",
          objectId: transport.id,
          previousState,
          newState: transport.status,
          reason: "prom zakonczony, transport wraca na droge"
        },
        {
          type: EventTypes.FERRY_ETA_UPDATED,
          objectType: "transport",
          objectId: transport.id,
          previousState: null,
          newState: transport.eta,
          reason: "ETA po zjezdzie z promu"
        }
      ]
    };
  }

  ensureBooking(transport, actor, payload = {}) {
    this.state.ferryBookings ||= [];
    let booking = this.getForTransport(transport.id);
    if (booking) return booking;

    const operatorCompanyId = payload.operatorCompanyId
      || (actor.role === Roles.FERRY_OPERATOR ? actor.companyId : null)
      || "co-ferry-dfds";
    booking = {
      id: createId("ferry"),
      ferry_booking_id: payload.ferryBookingId || payload.ferry_booking_id || `DFDS-${transport.number}`,
      transportId: transport.id,
      operatorCompanyId,
      departurePort: payload.departurePort || "Calais",
      arrivalPort: payload.arrivalPort || "Dover",
      departureAt: payload.departureAt || "2026-05-28T08:30:00.000Z",
      arrivalAt: payload.arrivalAt || "2026-05-28T10:00:00.000Z",
      checkInDeadlineAt: payload.checkInDeadlineAt || "2026-05-28T07:45:00.000Z",
      vehicleId: payload.vehicleId || transport.vehicleId,
      driverId: payload.driverId || transport.driverId,
      status: payload.status || "FERRY_REQUIRED",
      cost: payload.cost || 430,
      currency: payload.currency || "EUR",
      etaAfterFerry: payload.etaAfterFerry || transport.eta || "2026-05-28T14:30:00.000Z",
      restHours: payload.restHours || 1.5,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.state.ferryBookings.unshift(booking);
    return booking;
  }

  simulatePayment(transport, booking) {
    this.state.ferryPayments ||= [];
    const exists = this.state.ferryPayments.some((payment) => (
      payment.bookingId === booking.id
      || payment.ferry_booking_id === booking.ferry_booking_id
    ));
    if (exists) return null;

    const payment = {
      id: createId("fpay"),
      bookingId: booking.id,
      ferry_booking_id: booking.ferry_booking_id,
      transportId: transport.id,
      operatorCompanyId: booking.operatorCompanyId,
      amount: booking.cost,
      currency: booking.currency,
      status: "simulated_paid",
      createdAt: nowIso()
    };
    this.state.ferryPayments.unshift(payment);
    return {
      type: EventTypes.FERRY_PAYMENT_SIMULATED,
      objectType: "transport",
      objectId: transport.id,
      previousState: null,
      newState: payment.status,
      reason: `symulowana platnosc promowa ${booking.cost} ${booking.currency}`
    };
  }

  walletCreditAlreadyExists(booking) {
    const wallet = this.state.wallets.find((item) => item.ownerCompanyId === booking.operatorCompanyId);
    if (!wallet) return false;
    return this.state.walletLedger.some((entry) => (
      entry.walletId === wallet.id
      && entry.type === "credit"
      && entry.transportId === booking.transportId
      && entry.reason.includes(booking.departurePort)
      && entry.reason.includes(booking.arrivalPort)
    ));
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
