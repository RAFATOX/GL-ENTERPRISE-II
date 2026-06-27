import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class WalletEngine {
  constructor(state) {
    this.state = state;
  }

  getForCompany(companyId) {
    return this.state.wallets.find((wallet) => (
      wallet.ownerCompanyId === companyId
      && ["company", "partner"].includes(wallet.ownerType || wallet.owner_type || "company")
    )) || null;
  }

  getPlatformWallet() {
    return this.state.wallets.find((wallet) => (
      (wallet.ownerType || wallet.owner_type) === "platform"
      && (wallet.ownerId || wallet.owner_id) === "platform"
    )) || null;
  }

  canReserve(companyId, amount) {
    const wallet = this.getForCompany(companyId);
    return Boolean(wallet && Number(wallet.balance || 0) >= Number(amount || 0));
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
    const previousState = walletSnapshot(wallet);
    const value = Number(amount || 0);
    wallet.balance = Math.max(0, Number(wallet.balance || 0) - value);
    wallet.heldBalance = Number(wallet.heldBalance || 0) + value;
    wallet.escrowBalance = Number(wallet.escrowBalance || 0) + value;
    this.addLedger(wallet.id, transportId, "hold", -value, reason, {
      senderId: companyId,
      receiverId: escrowReceiverId(this.state, transportId),
      status: "Escrow"
    });
    return {
      type: EventTypes.WALLET_HOLD_CREATED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason
    };
  }

  releaseHold(companyId, transportId, amount, reason) {
    const wallet = this.getForCompany(companyId);
    if (!wallet) return null;
    const previousState = walletSnapshot(wallet);
    const value = Number(amount || 0);
    wallet.heldBalance = Math.max(0, Number(wallet.heldBalance || 0) - value);
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - value);
    this.addLedger(wallet.id, transportId, "hold_release", value, reason, {
      senderId: escrowReceiverId(this.state, transportId),
      receiverId: companyId,
      status: "Released"
    });
    return {
      type: EventTypes.WALLET_HOLD_RELEASED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason
    };
  }

  credit(companyId, transportId, amount, reason, options = {}) {
    const wallet = this.getForCompany(companyId);
    if (!wallet) return null;
    const previousState = walletSnapshot(wallet);
    const value = Number(amount || 0);
    wallet.balance = Number(wallet.balance || 0) + value;
    this.addLedger(wallet.id, transportId, options.type || "credit", value, reason, {
      senderId: options.senderId || escrowReceiverId(this.state, transportId),
      receiverId: companyId,
      status: options.status || "Completed"
    });
    return {
      type: EventTypes.WALLET_CREDITED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason
    };
  }

  creditPlatform(transportId, amount, reason) {
    const wallet = this.getPlatformWallet();
    if (!wallet || !amount) return null;
    const previousState = walletSnapshot(wallet);
    const value = Number(amount || 0);
    wallet.balance = Number(wallet.balance || 0) + value;
    this.addLedger(wallet.id, transportId, "platform_fee", value, reason, {
      senderId: escrowReceiverId(this.state, transportId),
      receiverId: "platform",
      status: "Completed"
    });
    return {
      type: EventTypes.WALLET_CREDITED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason
    };
  }

  releaseToCarrier(transport, amount) {
    const fee = calculatePlatformFee(amount);
    const policy = this.state.insurancePolicies.find((item) => item.id === transport.insuranceId);
    const insuranceCompanyId = policy ? insuranceCompanyForPolicy(this.state, policy) : null;
    return [
      this.releaseHold(transport.clientCompanyId, transport.id, amount, "escrow hold released after transport completion"),
      this.credit(transport.carrierCompanyId, transport.id, fee.carrierAmount, "carrier wallet credited from escrow after GL fee", {
        type: "settlement_credit",
        status: "Completed"
      }),
      this.creditPlatform(transport.id, fee.feeGross, "GL fee credited to PlatformWallet"),
      insuranceCompanyId ? this.credit(insuranceCompanyId, transport.id, policy.cost, "insurance premium settled from transport escrow", {
        type: "insurance_premium",
        status: "Completed"
      }) : null
    ].filter(Boolean);
  }

  addLedger(walletId, transportId, type, amount, reason, options = {}) {
    const at = nowIso();
    const id = createId("ledger");
    const auditId = createId("audit-link");
    const entry = {
      id,
      modelType: "WalletLedgerEntry",
      walletId,
      transportId,
      type,
      amount,
      currency: "EUR",
      reason,
      auditId,
      at
    };
    this.state.walletLedger.unshift(entry);
    this.state.walletTransactions.unshift({
      id: createId("gtx"),
      modelType: "WalletTransaction",
      at,
      amount: Math.abs(Number(amount || 0)),
      currency: "EUR",
      senderId: options.senderId || "system",
      receiverId: options.receiverId || walletId,
      reason,
      status: options.status || "Completed",
      hash: `hash-demo-${id}`,
      auditId,
      transportId
    });
    return entry;
  }
}

function walletSnapshot(wallet) {
  return {
    balance: wallet.balance,
    heldBalance: wallet.heldBalance,
    escrowBalance: wallet.escrowBalance,
    pendingBalance: wallet.pendingBalance,
    ownerType: wallet.ownerType,
    ownerId: wallet.ownerId
  };
}

function escrowReceiverId(state, transportId) {
  const escrow = state.escrows.find((item) => item.transportId === transportId);
  return `escrow:${escrow?.id || transportId}`;
}

function calculatePlatformFee(amount) {
  const gross = Number(amount || 0);
  const feeGross = Math.round(gross * 0.03 * 100) / 100;
  return {
    feeGross,
    carrierAmount: Math.max(0, Math.round((gross - feeGross) * 100) / 100)
  };
}

function insuranceCompanyForPolicy(state, policy) {
  return state.companies.find((company) => (
    company.type === "insurance"
    && (policy.partner.includes(company.name.split(" ")[0]) || company.name.includes(policy.partner))
  ))?.id || state.companies.find((company) => company.type === "insurance")?.id || null;
}
