import { EventTypes } from "../core/constants.js";
import { createId } from "../core/id.js";

export class ShipmentEngine {
  constructor(state) {
    this.state = state;
  }

  getById(shipmentId) {
    return this.state.shipments.find((shipment) => shipment.id === shipmentId) || null;
  }

  getByTransportId(transportId) {
    return this.state.shipments.find((shipment) => shipment.transportId === transportId) || null;
  }

  createFromTransport(transport) {
    if (this.getByTransportId(transport.id)) return null;
    const shipment = {
      id: createId("shipment"),
      transportId: transport.id,
      clientCompanyId: transport.clientCompanyId,
      cargo: {
        description: transport.cargo.description,
        weightKg: transport.cargo.weightKg
      },
      status: "created",
      photoIds: [...transport.photoIds],
      documentIds: [...transport.documentIds],
      requiredProofs: ["pre_publish_load", "pickup_confirmation", "delivery_confirmation"]
    };
    this.state.shipments.unshift(shipment);
    transport.shipmentIds = transport.shipmentIds || [];
    transport.shipmentIds.unshift(shipment.id);
    return {
      type: EventTypes.SHIPMENT_CREATED,
      objectType: "shipment",
      objectId: shipment.id,
      transportId: transport.id,
      previousState: null,
      newState: shipment.status,
      reason: "shipment identity created from transport load"
    };
  }

  syncEvidence(transport, reason) {
    const shipment = this.getByTransportId(transport.id);
    if (!shipment) return null;
    shipment.photoIds = [...transport.photoIds];
    shipment.documentIds = [...transport.documentIds];
    return {
      type: EventTypes.SHIPMENT_UPDATED,
      objectType: "shipment",
      objectId: shipment.id,
      transportId: transport.id,
      previousState: shipment.status,
      newState: shipment.status,
      reason
    };
  }

  setStatusForTransport(transport, status, reason) {
    const shipment = this.getByTransportId(transport.id);
    if (!shipment || shipment.status === status) return null;
    const previousState = shipment.status;
    shipment.status = status;
    return {
      type: EventTypes.SHIPMENT_UPDATED,
      objectType: "shipment",
      objectId: shipment.id,
      transportId: transport.id,
      previousState,
      newState: shipment.status,
      reason
    };
  }
}
