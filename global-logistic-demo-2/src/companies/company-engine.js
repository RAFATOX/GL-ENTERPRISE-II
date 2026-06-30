import {
  AccountStatuses,
  CompanyRoleLabels,
  CompanyRoleNames,
  CompanyTypes,
  CompanyVerificationStatuses,
  EventTypes,
  Roles
} from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";
import {
  CompanyPermissions,
  CompanyRolePermissionMap,
  CompanyTypePermissionMap,
  DriverPermissions,
  FinancePermissions,
  LoadPermissions,
  ModulePermissions,
  PlatformRolePermissionMap,
  PrivateContextPermissions,
  PrivateRolePermissionMap,
  VehiclePermissions
} from "../core/modules-config.js";

export class CompanyEngine {
  constructor(state) {
    this.state = state;
    ensureCompanyAccessState(this.state);
  }

  getById(companyId) {
    return this.state.companies.find((company) => company.id === companyId) || null;
  }

  byType(type) {
    return this.state.companies.filter((company) => normalizeCompanyType(company.type) === normalizeCompanyType(type));
  }

  userBelongsToCompany(userId, companyId) {
    return this.userCompanyRoles(userId).some((membership) => (
      membership.companyId === companyId && membership.status === "active"
    ));
  }

  trustScore(companyId) {
    return this.getById(companyId)?.trustScore ?? 0;
  }

  actorForSession(user, session) {
    ensureCompanyAccessState(this.state);
    if (!user) return systemActor(session);

    const contexts = this.contextsForUser(user.id);
    const role = this.roleForSession(user, session, contexts);
    const defaultContext = defaultContextForUser(user, contexts, role);
    const requestedContext = session.contextType || defaultContext.contextType;
    const requestedCompanyId = session.companyId || user.companyId || null;
    const requestedCompanyRoleId = session.companyRoleId || null;
    const platformPermissions = PlatformRolePermissionMap[role] || [];
    const platformContext = requestedContext === "platform" && platformPermissions.length
      ? platformActor(user, session, contexts, role, platformPermissions)
      : null;
    if (platformContext) return platformContext;

    const membership = contexts.find((context) => (
      context.contextType === "company"
      && context.companyId === requestedCompanyId
      && (!requestedCompanyRoleId || context.userCompanyRoleId === requestedCompanyRoleId)
      && context.compatibleRoles.includes(role)
    )) || contexts.find((context) => (
      context.contextType === "company"
      && context.companyId === requestedCompanyId
      && context.compatibleRoles.includes(role)
    )) || contexts.find((context) => (
      context.contextType === "company"
      && context.companyId === user.companyId
      && context.compatibleRoles.includes(role)
    )) || defaultContext;

    if (membership?.contextType === "company") {
      return companyActor(user, session, contexts, role, membership);
    }

    return privateActor(user, session, contexts, role);
  }

  contextsForUser(userId) {
    ensureCompanyAccessState(this.state);
    const user = this.state.users.find((item) => item.id === userId);
    const memberships = this.userCompanyRoles(userId)
      .filter((membership) => membership.status === "active")
      .map((membership) => {
        const company = this.getById(membership.companyId);
        const compatibleRoles = compatibleRolesForCompanyContext(user, membership, company);
        return {
          contextType: "company",
          id: membership.id,
          userCompanyRoleId: membership.id,
          companyId: membership.companyId,
          companyName: company?.name || membership.companyId,
          companyType: normalizeCompanyType(company?.type),
          companyRole: membership.roleName,
          companyRoleId: membership.roleId,
          verificationStatus: verificationStatus(company),
          permissions: this.permissionsForMembership(membership, company),
          compatibleRoles,
          label: `${company?.name || membership.companyId} / ${CompanyRoleLabels[membership.roleName] || membership.roleName}`
        };
      });

    const privateRoles = privateRolesForUser(user);
    const privatePermissions = unique(privateRoles.flatMap((role) => PrivateRolePermissionMap[role] || PrivateContextPermissions));
    const privateContext = {
      contextType: "private",
      id: "private",
      companyId: null,
      companyName: null,
      companyType: null,
      companyRole: null,
      companyRoleId: null,
      verificationStatus: user?.accountStatus || AccountStatuses.DRAFT,
      permissions: [...privatePermissions],
      compatibleRoles: privateRoles,
      label: "Osoba prywatna"
    };

    const platformRoles = platformRolesForUser(user);
    const platformPermissions = unique(platformRoles.flatMap((role) => PlatformRolePermissionMap[role] || []));
    const platformContext = platformRoles.length ? [{
      contextType: "platform",
      id: "platform",
      companyId: null,
      companyName: "GL Enterprise",
      companyType: "platform",
      companyRole: platformRoles[0],
      companyRoleId: "platform",
      verificationStatus: CompanyVerificationStatuses.VERIFIED,
      permissions: [...platformPermissions],
      compatibleRoles: platformRoles,
      label: "Operator GL"
    }] : [];

    return [privateContext, ...memberships, ...platformContext];
  }

  roleForSession(user, session, contexts = user ? this.contextsForUser(user.id) : []) {
    if (!user) return Roles.READONLY_AUDITOR;
    const roles = this.availableRolesForUser(user.id, contexts);
    return [session.role, user.selectedRole, ...(user.roles || [])].find((role) => roles.includes(role))
      || roles[0]
      || Roles.READONLY_AUDITOR;
  }

  availableRolesForUser(userId, contexts = this.contextsForUser(userId)) {
    const user = this.state.users.find((item) => item.id === userId);
    return unique([
      ...(user?.roles || []),
      ...contexts.flatMap((context) => context.compatibleRoles || [])
    ]);
  }

  contextForRole(userId, role, preferred = {}) {
    const user = this.state.users.find((item) => item.id === userId);
    const contexts = this.contextsForUser(userId);
    const preferredContext = contexts.find((context) => (
      context.contextType === preferred.contextType
      && (context.companyId || null) === (preferred.companyId || null)
      && (!preferred.userCompanyRoleId || context.userCompanyRoleId === preferred.userCompanyRoleId)
      && context.compatibleRoles.includes(role)
    ));
    return preferredContext || defaultContextForUser(user, contexts, role);
  }

  userCompanyRoles(userId) {
    ensureCompanyAccessState(this.state);
    return this.state.userCompanyRoles.filter((membership) => membership.userId === userId);
  }

  permissionsForMembership(membership, company) {
    const companyType = normalizeCompanyType(company?.type);
    const rolePermissions = companyTypeFilteredRolePermissions(CompanyRolePermissionMap[membership.roleName] || [], companyType);
    const typePermissions = CompanyTypePermissionMap[companyType] || [];
    const user = this.state.users.find((item) => item.id === membership.userId);
    const driverPersonalWalletPermissions = membership.roleName === CompanyRoleNames.EMPLOYEE && user?.roles?.includes(Roles.DRIVER)
      ? [ModulePermissions.WALLET, FinancePermissions.WALLET_OWN_READ]
      : [];
    return unique([
      ...rolePermissions,
      ...typePermissions,
      ...driverPersonalWalletPermissions,
      ...(membership.permissions || []),
      ...(membership.deniedPermissions || []).map((permission) => `!${permission}`)
    ]).filter((permission) => !String(permission).startsWith("!"))
      .filter((permission) => !(membership.deniedPermissions || []).includes(permission));
  }

  defaultContextForUser(user, role = null) {
    return defaultContextForUser(user, this.contextsForUser(user.id), role);
  }

  canUseCompany(actor, companyId) {
    if (!companyId) return false;
    if (hasPermission(actor, CompanyPermissions.MANAGE) && actor.companyId === companyId) return true;
    return actor.companyId === companyId && this.userBelongsToCompany(actor.userId, companyId);
  }

  isVerified(companyId) {
    return [CompanyVerificationStatuses.VERIFIED, CompanyVerificationStatuses.LIMITED].includes(
      verificationStatus(this.getById(companyId))
    );
  }

  createCompany(actor, payload) {
    ensureCompanyAccessState(this.state);
    const id = payload.companyId || createId("company");
    const company = {
      id,
      company_id: id,
      name: payload.name || payload.companyName,
      country: payload.country || "PL",
      vatEu: payload.vatEu || payload.vat || null,
      vat: payload.vat || payload.vatEu || null,
      address: payload.address || "adres demo",
      type: normalizeCompanyType(payload.type || payload.companyType),
      companyType: normalizeCompanyType(payload.type || payload.companyType),
      status: CompanyVerificationStatuses.PENDING,
      verificationStatus: CompanyVerificationStatuses.PENDING,
      trustScore: Number(payload.trustScore || 70),
      people: [actor.userId],
      ownerUserIds: [actor.userId],
      invitedUserIds: [],
      documentIds: [],
      auditIds: []
    };
    this.state.companies.unshift(company);
    this.state.companyVerifications.unshift({
      id: createId("company_verification"),
      companyId: id,
      status: CompanyVerificationStatuses.PENDING,
      submittedBy: actor.userId,
      submittedAt: nowIso(),
      reason: "firma utworzona w demo"
    });
    this.state.userCompanyRoles.unshift(companyMembership({
      userId: actor.userId,
      companyId: id,
      roleName: CompanyRoleNames.OWNER,
      status: "active",
      invitedBy: actor.userId,
      acceptedAt: nowIso()
    }));

    return {
      company,
      events: [{
        type: EventTypes.COMPANY_CREATED,
        objectType: "company",
        objectId: id,
        previousState: null,
        newState: company.status,
        reason: "firma utworzona przez Company Engine"
      }]
    };
  }

  updateCompany(actor, payload) {
    const company = this.getById(payload.companyId || actor.companyId);
    const previous = { ...company };
    ["name", "country", "vatEu", "vat", "address", "type"].forEach((field) => {
      if (payload[field]) company[field] = payload[field];
    });
    company.companyType = normalizeCompanyType(company.type);
    return {
      events: [{
        type: EventTypes.COMPANY_UPDATED,
        objectType: "company",
        objectId: company.id,
        previousState: previous,
        newState: company,
        reason: "dane firmy zmienione"
      }]
    };
  }

  uploadCompanyDocument(actor, payload) {
    const companyId = payload.companyId || actor.companyId;
    const company = this.getById(companyId);
    const document = {
      id: createId("company_doc"),
      companyId,
      document_id: null,
      type: payload.type || "company_document",
      label: payload.label || "Dokument firmy demo",
      status: "uploaded",
      uploadedBy: actor.userId,
      uploadedAt: nowIso()
    };
    document.document_id = document.id;
    this.state.companyDocuments.unshift(document);
    company.documentIds ||= [];
    company.documentIds.unshift(document.id);
    return {
      document,
      events: [{
        type: EventTypes.COMPANY_DOCUMENT_UPLOADED,
        objectType: "company",
        objectId: companyId,
        previousState: null,
        newState: document.id,
        reason: "dokument firmy dodany"
      }]
    };
  }

  inviteUser(actor, payload) {
    const companyId = payload.companyId || actor.companyId;
    const invitation = companyMembership({
      userId: payload.userId,
      companyId,
      roleName: payload.roleName || CompanyRoleNames.EMPLOYEE,
      status: "invited",
      invitedBy: actor.userId
    });
    this.state.userCompanyRoles.unshift(invitation);
    const company = this.getById(companyId);
    company.invitedUserIds ||= [];
    if (!company.invitedUserIds.includes(payload.userId)) company.invitedUserIds.push(payload.userId);
    return {
      invitation,
      events: [{
        type: EventTypes.COMPANY_USER_INVITED,
        objectType: "company",
        objectId: companyId,
        previousState: null,
        newState: payload.userId,
        reason: `zaproszenie uzytkownika jako ${invitation.roleName}`
      }]
    };
  }

  acceptInvitation(actor, payload) {
    const membership = this.findMembership(payload.userCompanyRoleId, payload.userId || actor.userId, payload.companyId);
    const previous = membership.status;
    membership.status = "active";
    membership.acceptedAt = nowIso();
    const company = this.getById(membership.companyId);
    company.people ||= [];
    if (!company.people.includes(membership.userId)) company.people.push(membership.userId);
    return {
      events: [{
        type: EventTypes.COMPANY_INVITATION_ACCEPTED,
        objectType: "company",
        objectId: membership.companyId,
        previousState: previous,
        newState: "active",
        reason: "uzytkownik przyjal zaproszenie do firmy"
      }]
    };
  }

  changeUserRole(actor, payload) {
    const membership = this.findMembership(payload.userCompanyRoleId, payload.userId, payload.companyId || actor.companyId);
    const previous = membership.roleName;
    membership.roleName = payload.roleName;
    membership.roleId = roleId(payload.roleName);
    return {
      events: [{
        type: EventTypes.COMPANY_USER_ROLE_CHANGED,
        objectType: "user_company_role",
        objectId: membership.id,
        previousState: previous,
        newState: membership.roleName,
        reason: "zmiana roli uzytkownika w firmie"
      }]
    };
  }

  changeUserPermissions(actor, payload) {
    const membership = this.findMembership(payload.userCompanyRoleId, payload.userId, payload.companyId || actor.companyId);
    const previous = [...(membership.permissions || [])];
    membership.permissions = normalizePermissionList(payload.permissions);
    membership.deniedPermissions = normalizePermissionList(payload.deniedPermissions);
    return {
      events: [{
        type: EventTypes.COMPANY_USER_PERMISSIONS_CHANGED,
        objectType: "user_company_role",
        objectId: membership.id,
        previousState: previous.join(","),
        newState: membership.permissions.join(","),
        reason: "zmiana uprawnien uzytkownika w firmie"
      }]
    };
  }

  removeUser(actor, payload) {
    const membership = this.findMembership(payload.userCompanyRoleId, payload.userId, payload.companyId || actor.companyId);
    const previous = membership.status;
    membership.status = "removed";
    const company = this.getById(membership.companyId);
    company.people = (company.people || []).filter((userId) => userId !== membership.userId);
    return {
      events: [{
        type: EventTypes.COMPANY_USER_REMOVED,
        objectType: "company",
        objectId: membership.companyId,
        previousState: previous,
        newState: "removed",
        reason: "uzytkownik usuniety z firmy"
      }]
    };
  }

  verifyCompany(actor, payload) {
    return this.setVerificationStatus(payload.companyId, CompanyVerificationStatuses.VERIFIED, EventTypes.COMPANY_VERIFIED, payload.reason || "firma zweryfikowana");
  }

  rejectCompany(actor, payload) {
    return this.setVerificationStatus(payload.companyId, CompanyVerificationStatuses.REJECTED, EventTypes.COMPANY_VERIFICATION_REJECTED, payload.reason || "weryfikacja firmy odrzucona");
  }

  suspendCompany(actor, payload) {
    return this.setVerificationStatus(payload.companyId, CompanyVerificationStatuses.SUSPENDED, EventTypes.COMPANY_SUSPENDED, payload.reason || "firma zawieszona");
  }

  setVerificationStatus(companyId, status, eventType, reason) {
    const company = this.getById(companyId);
    const previous = verificationStatus(company);
    company.status = status;
    company.verificationStatus = status;
    this.state.companyVerifications.unshift({
      id: createId("company_verification"),
      companyId,
      status,
      decidedAt: nowIso(),
      reason
    });
    return {
      events: [{
        type: eventType,
        objectType: "company",
        objectId: companyId,
        previousState: previous,
        newState: status,
        reason
      }]
    };
  }

  findMembership(id, userId, companyId) {
    const membership = this.state.userCompanyRoles.find((item) => (
      (id && item.id === id)
      || (userId && companyId && item.userId === userId && item.companyId === companyId)
    ));
    if (!membership) throw new Error("user company role not found");
    return membership;
  }
}

export function ensureCompanyAccessState(state) {
  state.permissions ||= permissionCatalog();
  state.roles ||= companyRoleCatalog();
  state.rolePermissions ||= rolePermissionRecords();
  state.userCompanyRoles ||= [];
  state.companyVerifications ||= buildCompanyVerifications(state);
  state.companyDocuments ||= [];
  state.companies.forEach((company) => normalizeCompany(company));
}

export function buildCompanyAccessSeed(state) {
  if (!Array.isArray(state.userCompanyRoles) || state.userCompanyRoles.length === 0) {
    state.userCompanyRoles = buildMembershipsFromCompanies(state);
  }
  ensureCompanyAccessState(state);
  return state;
}

function systemActor(session) {
  return {
    userId: "system",
    name: "System",
    role: session.role || Roles.READONLY_AUDITOR,
    companyId: null,
    contextType: "private",
    permissions: [],
    permissionsSource: "company_engine",
    accountStatus: AccountStatuses.DRAFT,
    verificationStatus: AccountStatuses.DRAFT,
    contextOptions: []
  };
}

function platformActor(user, session, contexts, role, permissions) {
  return {
    ...baseActor(user, session, contexts),
    role,
    companyId: null,
    companyName: "GL Enterprise",
    companyType: "platform",
    companyRole: "platform_operator",
    contextType: "platform",
    permissions: unique(permissions),
    permissionsSource: "company_engine",
    companyVerificationStatus: CompanyVerificationStatuses.VERIFIED
  };
}

function companyActor(user, session, contexts, role, context) {
  return {
    ...baseActor(user, session, contexts),
    role,
    companyId: context.companyId,
    companyName: context.companyName,
    companyType: context.companyType,
    companyRole: context.companyRole,
    userCompanyRoleId: context.userCompanyRoleId,
    contextType: "company",
    permissions: unique(context.permissions),
    permissionsSource: "company_engine",
    companyVerificationStatus: context.verificationStatus
  };
}

function privateActor(user, session, contexts, role) {
  return {
    ...baseActor(user, session, contexts),
    role,
    companyId: null,
    companyName: null,
    companyType: null,
    companyRole: null,
    contextType: "private",
    permissions: unique(PrivateRolePermissionMap[role] || PrivateContextPermissions),
    permissionsSource: "company_engine",
    companyVerificationStatus: null
  };
}

function baseActor(user, session, contexts) {
  const roleOptions = unique([
    ...(user.roles || []),
    ...contexts.flatMap((context) => context.compatibleRoles || [])
  ]);
  return {
    userId: user.id,
    name: user.name,
    role: session.role || user.selectedRole || user.roles?.[0],
    accountStatus: user.accountStatus || AccountStatuses.DRAFT,
    verificationStatus: user.verificationStatus || user.accountStatus || AccountStatuses.DRAFT,
    phoneVerified: Boolean(user.phoneVerified),
    documentVerified: Boolean(user.documentVerified),
    faceVerified: Boolean(user.faceVerified),
    documentsValid: Boolean(user.documentsValid),
    selectedRole: user.selectedRole || null,
    roleVerificationStatus: user.roleVerificationStatus || {},
    roleOptions,
    contextOptions: contexts.map(({ permissions, ...context }) => context)
  };
}

function defaultContextForUser(user, contexts, role = null) {
  const activeRole = role || user?.selectedRole || user?.roles?.[0];
  const platform = contexts.find((context) => context.contextType === "platform" && context.compatibleRoles.includes(activeRole));
  if (platform) return platform;
  return contexts.find((context) => (
    context.contextType === "company"
    && context.companyId === user?.companyId
    && context.compatibleRoles.includes(activeRole)
  )) || contexts.find((context) => context.contextType === "company" && context.compatibleRoles.includes(activeRole))
    || contexts.find((context) => context.compatibleRoles.includes(activeRole))
    || contexts[0];
}

function buildMembershipsFromCompanies(state) {
  const memberships = [];
  state.companies.forEach((company) => {
    normalizeCompany(company);
    (company.people || []).forEach((userId) => {
      const user = state.users.find((item) => item.id === userId);
      memberships.push(companyMembership({
        userId,
        companyId: company.id,
        roleName: roleNameForUserCompany(user, company),
        status: "active",
        invitedBy: company.ownerUserIds?.[0] || userId,
        acceptedAt: nowIso()
      }));
    });
  });
  return memberships;
}

function buildCompanyVerifications(state) {
  return state.companies.map((company) => ({
    id: `company_verification_${company.id}`,
    companyId: company.id,
    status: verificationStatus(company),
    submittedBy: company.ownerUserIds?.[0] || "seed",
    decidedAt: nowIso(),
    reason: "demo seed"
  }));
}

function rolePermissionRecords() {
  return Object.entries(CompanyRolePermissionMap).flatMap(([roleName, permissions]) => (
    permissions.map((permission) => ({
      id: `role_permission_${roleName}_${safe(permission)}`,
      roleId: roleId(roleName),
      roleName,
      permission
    }))
  ));
}

function companyRoleCatalog() {
  return Object.values(CompanyRoleNames).map((name) => ({
    id: roleId(name),
    name,
    scope: "company"
  }));
}

function permissionCatalog() {
  const permissions = unique([
    ...Object.values(PrivateContextPermissions),
    ...Object.values(CompanyPermissions),
    ...Object.values(CompanyRolePermissionMap).flat(),
    ...Object.values(CompanyTypePermissionMap).flat(),
    ...Object.values(PlatformRolePermissionMap).flat()
  ]);
  return permissions.map((key) => ({ id: `permission_${safe(key)}`, key }));
}

function companyMembership(input) {
  const id = input.id || createId("ucr");
  return {
    id,
    userCompanyRole_id: id,
    userId: input.userId,
    user_id: input.userId,
    companyId: input.companyId,
    company_id: input.companyId,
    roleId: roleId(input.roleName),
    role_id: roleId(input.roleName),
    roleName: input.roleName,
    status: input.status || "active",
    permissions: input.permissions || [],
    deniedPermissions: input.deniedPermissions || [],
    invitedBy: input.invitedBy || null,
    invitedAt: input.invitedAt || nowIso(),
    acceptedAt: input.acceptedAt || null
  };
}

function normalizeCompany(company) {
  company.company_id ||= company.id;
  company.companyType = normalizeCompanyType(company.companyType || company.type);
  company.type = company.companyType;
  company.country ||= "PL";
  company.vatEu ||= company.vat || `DEMO-${company.id}`;
  company.vat ||= company.vatEu;
  company.address ||= "adres demo";
  company.status = normalizeVerificationStatus(company.status);
  company.verificationStatus = normalizeVerificationStatus(company.verificationStatus || company.status);
  company.people ||= [];
  company.ownerUserIds ||= company.people.slice(0, 1);
  company.invitedUserIds ||= [];
  company.documentIds ||= [];
  company.auditIds ||= [];
  return company;
}

function roleNameForUserCompany(user, company) {
  if (!user) return CompanyRoleNames.VIEWER;
  if ((company.ownerUserIds || []).includes(user.id)) return CompanyRoleNames.OWNER;
  if ([Roles.CLIENT_DISPATCHER, Roles.CARRIER_DISPATCHER].includes(user.selectedRole || user.roles?.[0])) return CompanyRoleNames.DISPATCHER;
  if (user.selectedRole === Roles.DRIVER || user.roles?.includes(Roles.DRIVER)) return CompanyRoleNames.EMPLOYEE;
  if (user.selectedRole === Roles.WAREHOUSE_WORKER || user.roles?.includes(Roles.WAREHOUSE_WORKER)) return CompanyRoleNames.WAREHOUSE_MANAGER;
  if ([Roles.WORKSHOP, Roles.MOBILE_SERVICE, Roles.ROADSIDE_ASSISTANCE].some((role) => user.roles?.includes(role))) return CompanyRoleNames.MECHANIC;
  if (user.roles?.includes(Roles.INSURANCE_PARTNER)) return CompanyRoleNames.INSURANCE_MANAGER;
  if (user.roles?.includes(Roles.PAYMENT_OPERATOR)) return CompanyRoleNames.FINANCE;
  return CompanyRoleNames.EMPLOYEE;
}

function companyTypeFilteredRolePermissions(permissions, companyType) {
  if (companyType === CompanyTypes.CARRIER) return permissions;
  const carrierOnlyPermissions = [
    DriverPermissions.ASSIGN,
    DriverPermissions.MANAGE,
    VehiclePermissions.CREATE,
    VehiclePermissions.MANAGE,
    LoadPermissions.ACCEPT,
    LoadPermissions.ASSIGN_DRIVER,
    ModulePermissions.JOBS,
    ModulePermissions.PARKING
  ];
  return permissions.filter((permission) => !carrierOnlyPermissions.includes(permission));
}

function compatibleRolesForCompanyContext(user, membership, company) {
  const companyType = normalizeCompanyType(company?.type);
  const userRoles = user?.roles || [];
  if (membership.roleName === CompanyRoleNames.WAREHOUSE_MANAGER && userRoles.includes(Roles.WAREHOUSE_WORKER)) {
    return [Roles.WAREHOUSE_WORKER];
  }
  if (companyType === CompanyTypes.CARRIER) {
    if (membership.roleName === CompanyRoleNames.EMPLOYEE && userRoles.includes(Roles.DRIVER)) return [Roles.DRIVER];
    if (membership.roleName === CompanyRoleNames.DISPATCHER) return [Roles.CARRIER_DISPATCHER];
    if ([CompanyRoleNames.OWNER, CompanyRoleNames.ADMIN, CompanyRoleNames.FINANCE, CompanyRoleNames.DRIVER_MANAGER].includes(membership.roleName)) return [Roles.CARRIER_OWNER];
    return userRoles.includes(Roles.DRIVER) ? [Roles.DRIVER] : [Roles.CARRIER_DISPATCHER];
  }
  if (companyType === CompanyTypes.CLIENT) {
    if ([CompanyRoleNames.OWNER, CompanyRoleNames.ADMIN, CompanyRoleNames.FINANCE].includes(membership.roleName)) return [Roles.CLIENT_OWNER];
    return [Roles.CLIENT_DISPATCHER];
  }
  if (companyType === CompanyTypes.WAREHOUSE) return [Roles.WAREHOUSE_WORKER];
  if (companyType === CompanyTypes.WORKSHOP) return [Roles.WORKSHOP];
  if (companyType === CompanyTypes.MOBILE_SERVICE) return [Roles.MOBILE_SERVICE];
  if (companyType === CompanyTypes.ROADSIDE_ASSISTANCE) return [Roles.ROADSIDE_ASSISTANCE];
  if ([CompanyTypes.INSURER, CompanyTypes.INSURANCE].includes(companyType)) return [Roles.INSURANCE_PARTNER];
  if (companyType === CompanyTypes.PAYMENT) return [Roles.PAYMENT_OPERATOR];
  if (companyType === CompanyTypes.SECURITY) return [Roles.SECURITY_GUARD];
  if (companyType === CompanyTypes.CUSTOMS_AGENT) return [Roles.CUSTOMS_AGENT];
  if (companyType === CompanyTypes.AUTHORITY) return [Roles.AUTHORITY_USER];
  if (companyType === CompanyTypes.FERRY_OPERATOR) return [Roles.FERRY_OPERATOR];
  if (companyType === CompanyTypes.RAIL_OPERATOR) return [Roles.RAIL_OPERATOR];
  if (companyType === CompanyTypes.ACADEMY_PARTNER) return userRoles.filter((role) => [Roles.ACADEMY_TEACHER, Roles.ACADEMY_STUDENT].includes(role));
  return userRoles.length ? userRoles : [Roles.READONLY_AUDITOR];
}

function privateRolesForUser(user) {
  const roles = (user?.roles || []).filter((role) => PrivateRolePermissionMap[role]);
  return roles.length ? roles : [user?.selectedRole || user?.roles?.[0] || Roles.READONLY_AUDITOR].filter(Boolean);
}

function platformRolesForUser(user) {
  return (user?.roles || []).filter((role) => PlatformRolePermissionMap[role]);
}

function normalizeVerificationStatus(status) {
  if ([AccountStatuses.APPROVED, AccountStatuses.VERIFIED, CompanyVerificationStatuses.VERIFIED].includes(status)) {
    return CompanyVerificationStatuses.VERIFIED;
  }
  if ([AccountStatuses.SUSPENDED, AccountStatuses.BLOCKED, CompanyVerificationStatuses.SUSPENDED].includes(status)) {
    return CompanyVerificationStatuses.SUSPENDED;
  }
  if ([AccountStatuses.REJECTED, CompanyVerificationStatuses.REJECTED].includes(status)) {
    return CompanyVerificationStatuses.REJECTED;
  }
  if ([AccountStatuses.LIMITED, CompanyVerificationStatuses.LIMITED].includes(status)) {
    return CompanyVerificationStatuses.LIMITED;
  }
  if ([AccountStatuses.PENDING, AccountStatuses.DRAFT, CompanyVerificationStatuses.DRAFT].includes(status)) {
    return CompanyVerificationStatuses.DRAFT;
  }
  return status || CompanyVerificationStatuses.PENDING;
}

function verificationStatus(company) {
  return normalizeVerificationStatus(company?.verificationStatus || company?.status);
}

function normalizeCompanyType(type) {
  if (type === "insurance") return CompanyTypes.INSURANCE;
  if (type === "insurer") return CompanyTypes.INSURER;
  return type || CompanyTypes.CLIENT;
}

function normalizePermissionList(value) {
  if (Array.isArray(value)) return unique(value);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function roleId(roleName) {
  return `company_role_${roleName}`;
}

function safe(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "_").toLowerCase();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function hasPermission(actor, permission) {
  return (actor.permissions || []).includes(permission);
}
