import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class WalletEngine {
  constructor(state) {
    this.state = state;
  }

  getForCompany(companyId) {
    return this.state.wallets.find((wallet) => wallet.ownerCompanyId === companyId) || null;
  }

  hold(companyId, transportId, amount, reason) {
    const wallet = this.getForCompany(companyId);
    if (!wallet) return null;
    const alreadyHeld = this.state.walletLedger.some((entry) => (
      entry.walletId === wallet.id
      && entry.transportId === transportId
      && entry.type === "hold"
    ));
    if (alreadyHeld) return null;
    const previousState = wallet.heldBalance;
    wallet.heldBalance += amount;
    this.addLedger(wallet.id, transportId, "hold", -amount, reason);
    return {
      type: EventTypes.WALLET_HOLD_CREATED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: wallet.heldBalance,
      reason
    };
  }

  releaseHold(companyId, transportId, amount, reason) {
    const wallet = this.getForCompany(companyId);
    if (!wallet) return null;
    const previousState = wallet.heldBalance;
    wallet.heldBalance = Math.max(0, wallet.heldBalance - amount);
    this.addLedger(wallet.id, transportId, "hold_release", amount, reason);
    return {
      type: EventTypes.WALLET_HOLD_RELEASED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: wallet.heldBalance,
      reason
    };
  }

  credit(companyId, transportId, amount, reason) {
    const wallet = this.getForCompany(companyId);
    if (!wallet) return null;
    const previousState = wallet.balance;
    wallet.balance += amount;
    this.addLedger(wallet.id, transportId, "credit", amount, reason);
    return {
      type: EventTypes.WALLET_CREDITED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: wallet.balance,
      reason
    };
  }

  releaseToCarrier(transport, amount) {
    return [
      this.releaseHold(transport.clientCompanyId, transport.id, amount, "escrow hold released after transport completion"),
      this.credit(transport.carrierCompanyId, transport.id, amount, "carrier wallet credited from escrow")
    ].filter(Boolean);
  }

  addLedger(walletId, transportId, type, amount, reason) {
    this.state.walletLedger.unshift({
      id: createId("ledger"),
      walletId,
      transportId,
      type,
      amount,
      currency: "EUR",
      reason,
      at: nowIso()
    });
  }
}
