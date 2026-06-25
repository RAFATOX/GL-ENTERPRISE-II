import { EventTypes, PaymentStatuses } from "../core/constants.js";
import { nowIso } from "../core/id.js";

export class PaymentEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return this.state.payments.find((payment) => payment.transportId === transportId) || null;
  }

  setStatus(transport, status) {
    const payment = this.getForTransport(transport.id);
    if (payment) {
      payment.status = status;
      payment.updatedAt = nowIso();
    }
    transport.paymentStatus = status;
    return payment;
  }

  release(transport) {
    this.setStatus(transport, PaymentStatuses.RELEASED);
    return {
      type: EventTypes.PAYMENT_RELEASED,
      objectType: "transport",
      objectId: transport.id,
      reason: "payment released after delivery proof and document validation"
    };
  }
}
