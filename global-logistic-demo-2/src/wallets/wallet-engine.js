import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";
import { requireFinancialAuditService } from "../audit/financial-audit-service.js";

export class WalletEngine {
  constructor(state, auditService = null) {
    this.state = state;
    this.auditService = auditService;
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
    this.requireAuditService();
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
    const ledgerEntry = this.addLedger(wallet.id, transportId, "hold", -value, reason, {
      senderId: companyId,
      receiverId: escrowReceiverId(this.state, transportId),
      status: "Escrow",
      auditAction: EventTypes.WALLET_HOLD_CREATED,
      previousState,
      newState: walletSnapshot(wallet)
    });
    return {
      type: EventTypes.WALLET_HOLD_CREATED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason,
      auditLogId: ledgerEntry.auditLogId,
      audit_log_id: ledgerEntry.audit_log_id,
      walletLedgerId: ledgerEntry.id,
      walletTransactionId: ledgerEntry.walletTransactionId
    };
  }

  releaseHold(companyId, transportId, amount, reason) {
    const wallet = this.getForCompany(companyId);
    if (!wallet) return null;
    this.requireAuditService();
    const previousState = walletSnapshot(wallet);
    const value = Number(amount || 0);
    wallet.heldBalance = Math.max(0, Number(wallet.heldBalance || 0) - value);
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - value);
    const ledgerEntry = this.addLedger(wallet.id, transportId, "hold_release", value, reason, {
      senderId: escrowReceiverId(this.state, transportId),
      receiverId: companyId,
      status: "Released",
      auditAction: EventTypes.WALLET_HOLD_RELEASED,
      previousState,
      newState: walletSnapshot(wallet)
    });
    return {
      type: EventTypes.WALLET_HOLD_RELEASED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason,
      auditLogId: ledgerEntry.auditLogId,
      audit_log_id: ledgerEntry.audit_log_id,
      walletLedgerId: ledgerEntry.id,
      walletTransactionId: ledgerEntry.walletTransactionId
    };
  }

  credit(companyId, transportId, amount, reason, options = {}) {
    const wallet = this.getForCompany(companyId);
    if (!wallet) return null;
    this.requireAuditService();
    const previousState = walletSnapshot(wallet);
    const value = Number(amount || 0);
    wallet.balance = Number(wallet.balance || 0) + value;
    const ledgerEntry = this.addLedger(wallet.id, transportId, options.type || "credit", value, reason, {
      senderId: options.senderId || escrowReceiverId(this.state, transportId),
      receiverId: companyId,
      status: options.status || "Completed",
      auditAction: EventTypes.WALLET_CREDITED,
      previousState,
      newState: walletSnapshot(wallet)
    });
    return {
      type: EventTypes.WALLET_CREDITED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason,
      auditLogId: ledgerEntry.auditLogId,
      audit_log_id: ledgerEntry.audit_log_id,
      walletLedgerId: ledgerEntry.id,
      walletTransactionId: ledgerEntry.walletTransactionId
    };
  }

  creditPlatform(transportId, amount, reason) {
    const wallet = this.getPlatformWallet();
    if (!wallet || !amount) return null;
    this.requireAuditService();
    const previousState = walletSnapshot(wallet);
    const value = Number(amount || 0);
    wallet.balance = Number(wallet.balance || 0) + value;
    const ledgerEntry = this.addLedger(wallet.id, transportId, "platform_fee", value, reason, {
      senderId: escrowReceiverId(this.state, transportId),
      receiverId: "platform",
      status: "Completed",
      auditAction: EventTypes.WALLET_CREDITED,
      previousState,
      newState: walletSnapshot(wallet)
    });
    return {
      type: EventTypes.WALLET_CREDITED,
      objectType: "wallet",
      objectId: wallet.id,
      transportId,
      previousState,
      newState: walletSnapshot(wallet),
      reason,
      auditLogId: ledgerEntry.auditLogId,
      audit_log_id: ledgerEntry.audit_log_id,
      walletLedgerId: ledgerEntry.id,
      walletTransactionId: ledgerEntry.walletTransactionId
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
    const auditService = this.requireAuditService();
    const at = nowIso();
    const id = createId("ledger");
    const walletTransactionId = createId("gtx");
    const status = options.status || "Completed";
    const auditLogId = auditService.createRecord({
      action: options.auditAction || "WALLET_TRANSACTION_RECORDED",
      requestedAction: options.auditAction || "WALLET_TRANSACTION_RECORDED",
      objectType: "wallet_transaction",
      objectId: walletTransactionId,
      transportId,
      previousState: options.previousState || null,
      newState: {
        walletId,
        type,
        amount,
        status,
        ...(options.newState || {})
      },
      reason
    });
    const entry = {
      id,
      modelType: "WalletLedgerEntry",
      walletId,
      transportId,
      type,
      amount,
      currency: "EUR",
      reason,
      auditId: auditLogId,
      auditLogId,
      audit_log_id: auditLogId,
      walletTransactionId,
      at
    };
    this.state.walletLedger.unshift(entry);
    this.state.walletTransactions.unshift({
      id: walletTransactionId,
      modelType: "WalletTransaction",
      at,
      amount: Math.abs(Number(amount || 0)),
      currency: "EUR",
      senderId: options.senderId || "system",
      receiverId: options.receiverId || walletId,
      reason,
      status,
      hash: `hash-demo-${id}`,
      auditId: auditLogId,
      auditLogId,
      audit_log_id: auditLogId,
      transportId
    });
    return entry;
  }

  requireAuditService() {
    return requireFinancialAuditService(this.auditService);
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
