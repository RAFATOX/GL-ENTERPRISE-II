import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class RevenueEngine {
  constructor(state) {
    this.state = state;
  }

  recordTransportFee(transport, reason = "platform transport fee recorded") {
    const exists = this.state.revenueLedger.some((entry) => (
      entry.transportId === transport.id
      && entry.type === "transport_fee"
    ));
    if (exists) return null;
    const row = {
      id: createId("revenue"),
      transportId: transport.id,
      type: "transport_fee",
      amount: 1,
      currency: "EUR",
      reason,
      at: nowIso()
    };
    this.state.revenueLedger.unshift(row);
    return {
      type: EventTypes.PLATFORM_FEE_RECORDED,
      objectType: "revenue",
      objectId: row.id,
      transportId: transport.id,
      previousState: null,
      newState: `${row.amount} ${row.currency}`,
      reason
    };
  }
}
