import { ActionTypes, Roles, TransportStatuses } from "../core/constants.js";

const platformActions = Object.values(ActionTypes);

const rolePermissions = {
  [Roles.PLATFORM_OWNER]: platformActions,
  [Roles.SUPER_ADMIN]: platformActions.filter((action) => action !== ActionTypes.RESET_DEMO),
  [Roles.ADMIN]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.RECORD_SECURITY_CHECK,
    ActionTypes.SIMULATE_API_CALL,
    ActionTypes.RUN_INTEGRATION_SYNC,
    ActionTypes.RUN_RESILIENCE_CHECK,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.AI_RUN_CHECK,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.START_CUSTOMS,
    ActionTypes.CLEAR_CUSTOMS,
    ActionTypes.HOLD_CUSTOMS,
    ActionTypes.START_AUTHORITY_CONTROL,
    ActionTypes.RECORD_DOCUMENT_CHECK,
    ActionTypes.RECORD_ROAD_INSPECTION,
    ActionTypes.PASS_AUTHORITY_CONTROL,
    ActionTypes.REPORT_AUTHORITY_ISSUE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.START_PORT_NAVIGATION,
    ActionTypes.CHECK_IN_FERRY,
    ActionTypes.BOARD_FERRY,
    ActionTypes.COMPLETE_FERRY,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.ADMIN_BLOCK_TRANSPORT,
    ActionTypes.ADMIN_RESOLVE_DISPUTE,
    ActionTypes.ADMIN_BLOCK_ACCOUNT,
    ActionTypes.OPEN_DISPUTE,
    ActionTypes.UPLOAD_DOCUMENT
  ],
  [Roles.CLIENT_OWNER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.CREATE_LOAD,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.CONFIRM_GPS,
    ActionTypes.PUBLISH_LOAD,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.OPEN_DISPUTE
  ],
  [Roles.CLIENT_DISPATCHER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.CREATE_LOAD,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.CONFIRM_GPS,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.OPEN_DISPUTE
  ],
  [Roles.WAREHOUSE_WORKER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.CONFIRM_LOADING,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK
  ],
  [Roles.CARRIER_OWNER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_CARRIER,
    ActionTypes.ASSIGN_DRIVER,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE,
    ActionTypes.RUN_COMPLIANCE_CHECK
  ],
  [Roles.CARRIER_DISPATCHER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_CARRIER,
    ActionTypes.ASSIGN_DRIVER,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.MARK_FERRY_REQUIRED,
    ActionTypes.BOOK_FERRY,
    ActionTypes.MARK_CUSTOMS_REQUIRED,
    ActionTypes.SEND_TO_CUSTOMS,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.REQUEST_TECHNICAL_SERVICE
  ],
  [Roles.DRIVER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.START_PICKUP_NAVIGATION,
    ActionTypes.ARRIVE_PICKUP,
    ActionTypes.START_LOADING,
    ActionTypes.CONFIRM_LOADING,
    ActionTypes.START_TRANSIT,
    ActionTypes.SELECT_PARKING,
    ActionTypes.START_BREAK,
    ActionTypes.FINISH_BREAK,
    ActionTypes.ARRIVE_DELIVERY,
    ActionTypes.START_UNLOADING,
    ActionTypes.CONFIRM_DELIVERY,
    ActionTypes.ADD_LOAD_PHOTO,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.START_PORT_NAVIGATION,
    ActionTypes.BOARD_FERRY,
    ActionTypes.REPORT_BREAKDOWN,
    ActionTypes.PARKING_REPORT
  ],
  [Roles.INSURANCE_PARTNER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.OPEN_CLAIM,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.PAYMENT_OPERATOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.RELEASE_PAYMENT
  ],
  [Roles.SECURITY_GUARD]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.RECORD_SECURITY_CHECK,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.CUSTOMS_AGENT]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.START_CUSTOMS,
    ActionTypes.CLEAR_CUSTOMS,
    ActionTypes.HOLD_CUSTOMS,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.AUTHORITY_USER]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.START_AUTHORITY_CONTROL,
    ActionTypes.RECORD_DOCUMENT_CHECK,
    ActionTypes.RECORD_ROAD_INSPECTION,
    ActionTypes.PASS_AUTHORITY_CONTROL,
    ActionTypes.REPORT_AUTHORITY_ISSUE,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.FERRY_OPERATOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.BOOK_FERRY,
    ActionTypes.START_PORT_NAVIGATION,
    ActionTypes.CHECK_IN_FERRY,
    ActionTypes.BOARD_FERRY,
    ActionTypes.COMPLETE_FERRY,
    ActionTypes.UPLOAD_DOCUMENT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.RAIL_OPERATOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE
  ],
  [Roles.WORKSHOP]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.MOBILE_SERVICE]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.ROADSIDE_ASSISTANCE]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.ACCEPT_SERVICE_JOB,
    ActionTypes.COMPLETE_SERVICE_JOB,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION
  ],
  [Roles.SUPPORT_AGENT]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT,
    ActionTypes.OPEN_DISPUTE,
    ActionTypes.SEND_MESSAGE,
    ActionTypes.REQUEST_TRANSLATION,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.AI_RUN_CHECK
  ],
  [Roles.READONLY_AUDITOR]: [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.SELECT_TRANSPORT
  ]
};

export class PermissionsEngine {
  can(actionType, context) {
    const allowed = rolePermissions[context.actor.role] || [];
    if (!allowed.includes(actionType)) {
      return {
        ok: false,
        reason: `${context.actor.role} has no permission for ${actionType}`
      };
    }
    const entityAccess = this.checkEntityAccess(actionType, context);
    if (!entityAccess.ok) return entityAccess;
    return { ok: true, reason: "permission granted" };
  }

  listForRole(role) {
    return rolePermissions[role] || [];
  }

  checkEntityAccess(actionType, context) {
    const transport = transportForContext(context);
    if (!transport) return { ok: true, reason: "no transport scope" };
    const actor = context.actor;

    if (!canViewTransport(actor, transport, context.state)) {
      return {
        ok: false,
        reason: `${actor.role} has no access to transport ${transport.id}`
      };
    }

    if (
      actionType === ActionTypes.ACCEPT_CARRIER
      && carrierScoped(actor)
      && context.payload.carrierCompanyId !== actor.companyId
    ) {
      return {
        ok: false,
        reason: "carrier can accept only for own company_id"
      };
    }

    return { ok: true, reason: "entity access granted" };
  }

  filterSnapshot(snapshot, actor) {
    const visibleTransportIds = new Set(
      snapshot.transports
        .filter((transport) => canViewTransport(actor, transport, snapshot))
        .map((transport) => transport.id)
    );

    snapshot.transports = snapshot.transports.filter((transport) => visibleTransportIds.has(transport.id));
    if (!visibleTransportIds.has(snapshot.session.selectedTransportId)) {
      snapshot.session.selectedTransportId = snapshot.transports[0]?.id || null;
    }

    snapshot.shipments = snapshot.shipments.filter((shipment) => visibleTransportIds.has(shipment.transportId));
    snapshot.documents = snapshot.documents.filter((doc) => (
      visibleTransportIds.has(doc.transportId)
      && (privileged(actor) || doc.visibleToRoles.includes(actor.role))
    ));
    snapshot.photos = snapshot.photos.filter((photo) => visibleTransportIds.has(photo.transportId));
    snapshot.jobs = snapshot.jobs.filter((job) => visibleTransportIds.has(job.transportId));
    snapshot.messages = snapshot.messages.filter((message) => visibleTransportIds.has(message.transportId));
    const visibleMessageIds = new Set(snapshot.messages.map((message) => message.id));
    snapshot.translations = snapshot.translations.filter((translation) => visibleMessageIds.has(translation.messageId));
    snapshot.messageThreads = snapshot.messageThreads.filter((thread) => visibleTransportIds.has(thread.transportId));
    snapshot.securityChecks = snapshot.securityChecks.filter((check) => visibleTransportIds.has(check.transportId));
    snapshot.disputeEvidencePacks = snapshot.disputeEvidencePacks.filter((pack) => visibleTransportIds.has(pack.transportId));
    snapshot.digitalCmrs = snapshot.digitalCmrs.filter((cmr) => visibleTransportIds.has(cmr.transportId));
    snapshot.customsCases = (snapshot.customsCases || []).filter((customsCase) => (
      visibleTransportIds.has(customsCase.transportId)
      && (privileged(actor) || actor.role === Roles.CUSTOMS_AGENT || actor.companyId === customsCase.agentCompanyId)
    ));
    snapshot.customsPayments = (snapshot.customsPayments || []).filter((payment) => (
      visibleTransportIds.has(payment.transportId)
      && (privileged(actor) || actor.role === Roles.CUSTOMS_AGENT || actor.role === Roles.PAYMENT_OPERATOR)
    ));
    snapshot.authorityControls = (snapshot.authorityControls || []).filter((control) => (
      visibleTransportIds.has(control.transportId)
      && (privileged(actor) || actor.role === Roles.AUTHORITY_USER)
    ));
    snapshot.authorityControlHistory = (snapshot.authorityControlHistory || []).filter((history) => (
      visibleTransportIds.has(history.transportId)
      && (privileged(actor) || actor.role === Roles.AUTHORITY_USER)
    ));
    snapshot.ferryBookings = (snapshot.ferryBookings || []).filter((booking) => visibleTransportIds.has(booking.transportId));
    snapshot.ferryPayments = (snapshot.ferryPayments || []).filter((payment) => (
      visibleTransportIds.has(payment.transportId)
      && (privileged(actor) || actor.role === Roles.FERRY_OPERATOR || actor.role === Roles.PAYMENT_OPERATOR)
    ));
    snapshot.serviceRequests = (snapshot.serviceRequests || []).filter((request) => (
      visibleTransportIds.has(request.transportId)
      && (
        privileged(actor)
        || actor.role === Roles.DRIVER
        || carrierScoped(actor)
        || serviceScoped(actor, request)
      )
    ));
    snapshot.servicePayments = (snapshot.servicePayments || []).filter((payment) => (
      visibleTransportIds.has(payment.transportId)
      && (privileged(actor) || actor.role === Roles.PAYMENT_OPERATOR || payment.providerCompanyId === actor.companyId)
    ));
    snapshot.serviceProviders = (snapshot.serviceProviders || []).filter((provider) => (
      privileged(actor)
      || [Roles.DRIVER, Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(actor.role)
      || provider.companyId === actor.companyId
    ));
    snapshot.companyComplianceEntries = (snapshot.companyComplianceEntries || []).filter((entry) => (
      privileged(actor) || entry.companyId === actor.companyId || actor.role === Roles.AUTHORITY_USER
    ));
    snapshot.complianceChecks = snapshot.complianceChecks.filter((check) => visibleTransportIds.has(check.transportId));
    snapshot.crewPlans = snapshot.crewPlans.filter((plan) => visibleTransportIds.has(plan.transportId));
    const visibleDriverIds = new Set(snapshot.transports
      .flatMap((transport) => [transport.driverId, ...(snapshot.crewPlans.find((plan) => plan.transportId === transport.id)?.driverIds || [])])
      .filter(Boolean));
    snapshot.tachographImports = snapshot.tachographImports.filter((row) => (
      privileged(actor) || visibleDriverIds.has(row.driverId) || row.driverId === actor.userId
    ));
    snapshot.plateLookups = snapshot.plateLookups.filter((lookup) => (
      lookup.scannerUserId === actor.userId
      || (lookup.transportId && visibleTransportIds.has(lookup.transportId))
      || privileged(actor)
    ));

    if (actor.role === Roles.AUTHORITY_USER) {
      snapshot.transports = snapshot.transports.map(sanitizeAuthorityTransport);
      snapshot.messages = [];
      snapshot.messageThreads = [];
      snapshot.translations = [];
      snapshot.photos = [];
      snapshot.disputes = [];
      snapshot.disputeEvidencePacks = [];
      snapshot.ferryPayments = [];
      snapshot.customsPayments = [];
      snapshot.servicePayments = [];
    }

    if (serviceRole(actor.role)) {
      snapshot.transports = snapshot.transports.map(sanitizeServiceTransport);
      snapshot.messages = snapshot.messages.filter((message) => message.authorId === actor.userId);
      const visibleThreadIds = new Set(snapshot.messages.map((message) => message.threadId));
      snapshot.messageThreads = snapshot.messageThreads.filter((thread) => visibleThreadIds.has(thread.id));
      snapshot.translations = snapshot.translations.filter((translation) => (
        snapshot.messages.some((message) => message.id === translation.messageId)
      ));
      snapshot.photos = [];
      snapshot.disputes = [];
      snapshot.disputeEvidencePacks = [];
    }

    if (!privileged(actor)) {
      snapshot.apiClients = [];
      snapshot.apiAudit = [];
      snapshot.integrations = [];
      snapshot.integrationRuns = [];
      snapshot.serviceHealth = [];
      snapshot.backupSnapshots = [];
      snapshot.resilienceChecks = [];
    }

    const financeScope = financialScope(actor);
    snapshot.access = {
      canViewFinancials: financeScope !== "none",
      financialScope,
      privateContactsVisible: privileged(actor)
    };

    if (financeScope === "none") {
      snapshot.payments = [];
      snapshot.wallets = [];
      snapshot.walletLedger = [];
      snapshot.escrows = [];
      snapshot.revenueLedger = [];
    } else if (financeScope !== "all") {
      const companyId = actor.companyId;
      const financialTransportIds = new Set(snapshot.transports
        .filter((transport) => transport.clientCompanyId === companyId || transport.carrierCompanyId === companyId)
        .map((transport) => transport.id));
      snapshot.payments = snapshot.payments.filter((payment) => financialTransportIds.has(payment.transportId));
      snapshot.escrows = snapshot.escrows.filter((escrow) => (
        escrow.payerCompanyId === companyId || escrow.payeeCompanyId === companyId
      ));
      snapshot.wallets = snapshot.wallets.filter((wallet) => wallet.ownerCompanyId === companyId);
      const walletIds = new Set(snapshot.wallets.map((wallet) => wallet.id));
      snapshot.walletLedger = snapshot.walletLedger.filter((entry) => walletIds.has(entry.walletId));
      snapshot.revenueLedger = [];
    }

    if (!privileged(actor)) {
      snapshot.users = snapshot.users.map((user) => ({
        ...user,
        phone: user.id === actor.userId || user.companyId === actor.companyId ? user.phone : "restricted"
      }));
    }

    return snapshot;
  }
}

function transportForContext(context) {
  const nonTransportActions = [
    ActionTypes.SELECT_ROLE,
    ActionTypes.SELECT_VIEW,
    ActionTypes.REGISTER_USER,
    ActionTypes.VERIFY_ACCOUNT,
    ActionTypes.CHANGE_PHONE,
    ActionTypes.CREATE_LOAD,
    ActionTypes.ADMIN_BLOCK_ACCOUNT,
    ActionTypes.PARKING_REPORT,
    ActionTypes.SCAN_LICENSE_PLATE,
    ActionTypes.SIMULATE_API_CALL,
    ActionTypes.RUN_INTEGRATION_SYNC,
    ActionTypes.RUN_RESILIENCE_CHECK,
    ActionTypes.RUN_COMPLIANCE_CHECK,
    ActionTypes.RESET_DEMO
  ];
  if (!context.payload.transportId && nonTransportActions.includes(context.actionType)) return null;
  const transportId = context.payload.transportId || context.state.session.selectedTransportId;
  if (!transportId) return null;
  return context.state.transports.find((transport) => transport.id === transportId) || null;
}

function privileged(actor) {
  return [
    Roles.PLATFORM_OWNER,
    Roles.SUPER_ADMIN,
    Roles.ADMIN
  ].includes(actor.role);
}

function carrierScoped(actor) {
  return [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(actor.role);
}

function serviceRole(role) {
  return [Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE].includes(role);
}

function serviceScoped(actor, request) {
  return serviceRole(actor.role) && (
    request.providerCompanyId === actor.companyId || request.status === "breakdown_reported"
  );
}

function canViewTransport(actor, transport, state) {
  if (privileged(actor)) return true;
  if ([Roles.SUPPORT_AGENT, Roles.READONLY_AUDITOR, Roles.PAYMENT_OPERATOR, Roles.SECURITY_GUARD].includes(actor.role)) return true;
  if (actor.role === Roles.AUTHORITY_USER) {
    return ![TransportStatuses.COMPLETED, TransportStatuses.CANCELLED].includes(transport.status);
  }
  if (actor.role === Roles.CUSTOMS_AGENT) {
    return (state.customsCases || []).some((customsCase) => (
      customsCase.transportId === transport.id && customsCase.agentCompanyId === actor.companyId
    )) || [
      TransportStatuses.CUSTOMS_REQUIRED,
      TransportStatuses.WAITING_FOR_CUSTOMS,
      TransportStatuses.CUSTOMS_IN_PROGRESS,
      TransportStatuses.CUSTOMS_CLEARED,
      TransportStatuses.CUSTOMS_HOLD
    ].includes(transport.status);
  }
  if (serviceRole(actor.role)) {
    return (state.serviceRequests || []).some((request) => (
      request.transportId === transport.id
      && (request.providerCompanyId === actor.companyId || request.status === "breakdown_reported")
    ));
  }
  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(actor.role)) {
    return transport.clientCompanyId === actor.companyId;
  }
  if (actor.role === Roles.WAREHOUSE_WORKER) {
    return transport.warehouseWorkerId === actor.userId || transport.clientCompanyId === actor.companyId;
  }
  if (carrierScoped(actor)) {
    return transport.carrierCompanyId === actor.companyId
      || (!transport.carrierCompanyId && [
        TransportStatuses.PUBLISHED,
        TransportStatuses.CARRIER_OFFER_RECEIVED
      ].includes(transport.status));
  }
  if (actor.role === Roles.DRIVER) {
    return transport.driverId === actor.userId;
  }
  if (actor.role === Roles.INSURANCE_PARTNER) {
    const policy = state.insurancePolicies.find((item) => item.id === transport.insuranceId);
    return Boolean(policy || transport.activeClaimId || transport.riskFlagged);
  }
  if (actor.role === Roles.FERRY_OPERATOR) {
    return (state.ferryBookings || []).some((booking) => (
      booking.transportId === transport.id && booking.operatorCompanyId === actor.companyId
    )) || ["FERRY", "INTERMODAL"].includes(transport.transportMode);
  }
  if (actor.role === Roles.RAIL_OPERATOR) {
    return ["TRAIN", "INTERMODAL"].includes(transport.transportMode);
  }
  return false;
}

function financialScope(actor) {
  if ([Roles.PLATFORM_OWNER, Roles.SUPER_ADMIN, Roles.ADMIN, Roles.PAYMENT_OPERATOR].includes(actor.role)) return "all";
  if ([Roles.CLIENT_OWNER, Roles.CARRIER_OWNER].includes(actor.role)) return "company";
  return "none";
}

function sanitizeAuthorityTransport(transport) {
  return {
    ...transport,
    clientCompanyId: null,
    warehouseWorkerId: null,
    driverId: null,
    cargo: {
      description: "dane ograniczone do kontroli",
      weightKg: null,
      dimensions: "ograniczone",
      prePublishPhotoId: null
    },
    price: null,
    paymentStatus: "restricted",
    photoIds: [],
    activeDisputeId: null,
    activeClaimId: null,
    legalStatus: transport.riskFlagged ? "do sprawdzenia" : "brak blokady prawnej"
  };
}

function sanitizeServiceTransport(transport) {
  return {
    ...transport,
    clientCompanyId: null,
    warehouseWorkerId: null,
    cargo: {
      description: "dane niedostępne dla serwisu",
      weightKg: null,
      dimensions: "ograniczone",
      prePublishPhotoId: null
    },
    price: null,
    paymentStatus: "restricted",
    documentIds: [],
    photoIds: [],
    activeDisputeId: null,
    activeClaimId: null,
    riskFlagged: false
  };
}
