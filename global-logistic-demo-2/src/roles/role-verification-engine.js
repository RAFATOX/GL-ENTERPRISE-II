import { AccountStatuses, CompanyTypes, EventTypes, Roles } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export const onboardingRoleOptions = Object.freeze([
  { id: "driver", role: Roles.DRIVER, label: "Kierowca" },
  { id: "carrier", role: Roles.CARRIER_OWNER, label: "Przewoznik" },
  { id: "client", role: Roles.CLIENT_OWNER, label: "Klient" },
  { id: "warehouse", role: Roles.WAREHOUSE_WORKER, label: "Magazyn" },
  { id: "workshop", role: Roles.WORKSHOP, label: "Warsztat" },
  { id: "insurer", role: Roles.INSURANCE_PARTNER, label: "Ubezpieczyciel" },
  { id: "dispatcher", role: Roles.CARRIER_DISPATCHER, label: "Dyspozytor" },
  { id: "academy_student", role: Roles.ACADEMY_STUDENT, label: "Kursant Akademii" },
  { id: "academy_teacher", role: Roles.ACADEMY_TEACHER, label: "Nauczyciel Akademii" },
  { id: "platform_partner", role: Roles.SUPPORT_AGENT, label: "Partner platformy" }
]);

const roleRequirements = Object.freeze({
  [Roles.DRIVER]: ["identity_document", "selfie", "driver_license", "license_categories", "license_expiry", "driver_license_photo"],
  [Roles.CARRIER_OWNER]: ["identity_document", "selfie", "company_documents", "vat_eu", "transport_license", "ocp", "vehicles", "beneficial_owner", "settlement_wallet"],
  [Roles.CLIENT_OWNER]: ["identity_document", "selfie", "company_data", "vat_eu", "representative", "company_documents", "client_wallet"],
  [Roles.WAREHOUSE_WORKER]: ["identity_document", "selfie", "warehouse_company_data", "warehouse_addresses", "authorized_people", "company_documents"],
  [Roles.WORKSHOP]: ["identity_document", "selfie", "company_data", "vat", "workshop_address", "service_scope", "company_documents", "settlement_account"],
  [Roles.MOBILE_SERVICE]: ["identity_document", "selfie", "company_data", "vat", "service_scope", "company_documents", "settlement_account"],
  [Roles.ROADSIDE_ASSISTANCE]: ["identity_document", "selfie", "company_data", "vat", "service_scope", "company_documents", "settlement_account"],
  [Roles.INSURANCE_PARTNER]: ["identity_document", "selfie", "company_data", "license", "representatives", "partner_agreement_documents", "settlement_account"],
  [Roles.CARRIER_DISPATCHER]: ["identity_document", "selfie", "company_assignment", "dispatcher_authorization"],
  [Roles.ACADEMY_STUDENT]: ["basic_data", "phone", "email", "student_status"],
  [Roles.ACADEMY_TEACHER]: ["identity_document", "selfie", "qualification_documents", "payout_account"],
  [Roles.SUPPORT_AGENT]: ["identity_document", "selfie", "partner_agreement_documents", "compliance_approval"]
});

export class GlRoleVerificationEngine {
  constructor(state) {
    this.state = state;
  }

  selectRole(userId, roleInput) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const role = normalizeOnboardingRole(roleInput);
    const previousState = user.accountStatus;
    user.selectedRole = role;
    user.roles = [...new Set([...(user.roles || []), role])];
    user.roleVerificationStatus ||= {};
    user.roleVerificationStatus[role] = AccountStatuses.ROLE_DOCUMENTS_PENDING;
    user.accountStatus = user.documentVerified ? AccountStatuses.ROLE_DOCUMENTS_PENDING : AccountStatuses.IDENTITY_PENDING;
    user.verificationStatus = user.accountStatus;
    user.onboardingStage = user.documentVerified ? "role_documents" : "identity";
    this.state.roleVerifications.unshift({
      id: createId("role_verification"),
      userId: user.id,
      role,
      status: user.roleVerificationStatus[role],
      requiredDocuments: roleDocumentRequirements(role),
      submittedDocuments: [],
      createdAt: nowIso()
    });
    return {
      user,
      events: [{
        type: EventTypes.ROLE_VERIFICATION_STARTED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: role,
        reason: "wybrano role wymagajaca osobnej weryfikacji"
      }]
    };
  }

  submitRoleDocuments(userId, roleInput, payload) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const role = normalizeOnboardingRole(roleInput || user.selectedRole);
    const previousState = user.roleVerificationStatus?.[role] || user.accountStatus;
    const submitted = submittedDocumentKeys(payload);
    user.roleDocuments ||= {};
    user.roleDocuments[role] = submitted;
    user.roleVerificationStatus ||= {};
    const missing = missingRoleDocuments(role, submitted);
    const needsCompany = companyRoles().includes(role);
    const nextStatus = missing.length
      ? AccountStatuses.ROLE_DOCUMENTS_PENDING
      : needsCompany ? AccountStatuses.COMPANY_PENDING : AccountStatuses.APPROVED;
    user.roleVerificationStatus[role] = nextStatus;
    user.accountStatus = nextStatus;
    user.verificationStatus = nextStatus;
    user.onboardingStage = nextStatus === AccountStatuses.COMPANY_PENDING
      ? "company"
      : nextStatus === AccountStatuses.APPROVED ? "approved" : "role_documents";
    const verification = latestRoleVerification(this.state, user.id, role);
    if (verification) {
      verification.status = nextStatus;
      verification.submittedDocuments = submitted;
      verification.missingDocuments = missing;
      verification.updatedAt = nowIso();
    }
    return {
      user,
      events: [{
        type: EventTypes.ROLE_DOCUMENTS_SUBMITTED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: nextStatus,
        reason: missing.length ? `brak dokumentow roli: ${missing.join(", ")}` : "dokumenty roli przyjete w demo"
      }]
    };
  }

  submitCompanyProfile(userId, roleInput, payload, companyEngine = null) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const role = normalizeOnboardingRole(roleInput || user.selectedRole);
    const previousState = user.accountStatus;
    const hasCompanyDocuments = Boolean(payload.companyName && (payload.vatEu || payload.vat) && truthy(payload.companyDocuments));
    const companyResult = companyEngine
      ? this.createOrUpdateOnboardingCompany(user, role, payload, companyEngine, hasCompanyDocuments)
      : { company: null, events: [], document: null };
    user.companyVerification = {
      id: createId("company_verification"),
      companyId: companyResult.company?.id || null,
      role,
      companyName: payload.companyName,
      vatEu: payload.vatEu || payload.vat || null,
      walletReady: payload.walletReady === true || payload.walletReady === "true" || payload.walletReady === "on",
      hasCompanyDocuments,
      companyStatus: companyResult.company?.verificationStatus || companyResult.company?.status || null,
      companyDocumentId: companyResult.document?.id || null,
      submittedAt: nowIso()
    };
    if (companyResult.company) {
      user.companyId = companyResult.company.id;
      user.company_id = companyResult.company.id;
      user.companyIds = [...new Set([...(user.companyIds || []), companyResult.company.id])];
    }
    user.walletReady = user.companyVerification.walletReady;
    user.accountStatus = hasCompanyDocuments ? AccountStatuses.APPROVED : AccountStatuses.COMPANY_PENDING;
    user.verificationStatus = user.accountStatus;
    user.roleVerificationStatus ||= {};
    user.roleVerificationStatus[role] = user.accountStatus;
    user.onboardingStage = user.accountStatus === AccountStatuses.APPROVED ? "approved" : "company";
    return {
      user,
      company: companyResult.company,
      events: [
        ...companyResult.events,
        {
          type: EventTypes.COMPANY_PROFILE_SUBMITTED,
          objectType: "user",
          objectId: user.id,
          previousState,
          newState: user.accountStatus,
          reason: hasCompanyDocuments ? "firma i konto rozliczeniowe zatwierdzone w demo" : "brak pelnych danych firmy"
        }
      ]
    };
  }

  approve(userId, roleInput, companyEngine = null) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const role = normalizeOnboardingRole(roleInput || user.selectedRole || user.roles?.[0]);
    const previousState = user.accountStatus;
    user.accountStatus = AccountStatuses.APPROVED;
    user.verificationStatus = AccountStatuses.APPROVED;
    user.roleVerificationStatus ||= {};
    if (role) user.roleVerificationStatus[role] = AccountStatuses.APPROVED;
    user.onboardingStage = "approved";
    this.state.session.userId = user.id;
    this.state.session.role = role || Roles.READONLY_AUDITOR;
    const context = companyEngine?.defaultContextForUser(user) || null;
    this.state.session.contextType = context?.contextType || "private";
    this.state.session.companyId = context?.companyId || null;
    this.state.session.companyRoleId = context?.userCompanyRoleId || null;
    this.state.session.onboardingRequired = false;
    this.state.session.onboardingUserId = null;
    this.state.session.view = "dashboard";
    return {
      user,
      events: [{
        type: EventTypes.ONBOARDING_APPROVED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: user.accountStatus,
        reason: "konto zatwierdzone po weryfikacji roli"
      }]
    };
  }

  reject(userId, reason) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const previousState = user.accountStatus;
    user.accountStatus = AccountStatuses.REJECTED;
    user.verificationStatus = AccountStatuses.REJECTED;
    user.onboardingStage = "rejected";
    return {
      user,
      events: [{
        type: EventTypes.ONBOARDING_REJECTED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: user.accountStatus,
        reason: reason || "odrzucono konto w demo"
      }]
    };
  }

  user(userId) {
    return this.state.users.find((item) => item.id === userId) || null;
  }

  createOrUpdateOnboardingCompany(user, role, payload, companyEngine, verified) {
    const existingCompanyId = user.companyVerification?.companyId || user.companyId || null;
    const existingCompany = existingCompanyId ? companyEngine.getById(existingCompanyId) : null;
    const actor = {
      userId: user.id,
      role,
      contextType: "private",
      companyId: existingCompany?.id || null,
      companyRole: null,
      permissions: [],
      permissionsSource: "onboarding"
    };
    const events = [];
    let company = existingCompany;

    if (!company) {
      const created = companyEngine.createCompany(actor, {
        name: payload.companyName,
        companyName: payload.companyName,
        country: payload.country || user.country || "PL",
        vatEu: payload.vatEu || payload.vat,
        vat: payload.vat || payload.vatEu,
        address: payload.address || "adres firmy demo",
        type: companyTypeForRole(role),
        companyType: companyTypeForRole(role)
      });
      company = created.company;
      events.push(...created.events);
    }

    let document = null;
    if (truthy(payload.companyDocuments) && !company.documentIds?.length) {
      const uploaded = companyEngine.uploadCompanyDocument(actor, {
        companyId: company.id,
        type: "company_onboarding_documents",
        label: payload.companyDocumentLabel || "Dokumenty firmy z onboardingu"
      });
      document = uploaded.document;
      events.push(...uploaded.events);
    }

    if (verified && company.verificationStatus !== "verified") {
      const verifiedCompany = companyEngine.verifyCompany(actor, {
        companyId: company.id,
        reason: "firma zweryfikowana w onboardingu demo"
      });
      events.push(...verifiedCompany.events);
    }

    return { company, document, events };
  }
}

export function normalizeOnboardingRole(roleInput) {
  const direct = Object.values(Roles).includes(roleInput) ? roleInput : null;
  if (direct) return direct;
  return onboardingRoleOptions.find((item) => item.id === roleInput)?.role || roleInput;
}

export function roleDocumentRequirements(roleInput) {
  const role = normalizeOnboardingRole(roleInput);
  return [...(roleRequirements[role] || ["identity_document", "selfie"])];
}

export function missingRoleDocuments(roleInput, submitted = []) {
  const set = new Set(submitted);
  return roleDocumentRequirements(roleInput).filter((item) => !set.has(item));
}

export function roleVerificationApproved(user, roleInput) {
  const role = normalizeOnboardingRole(roleInput);
  return user?.roleVerificationStatus?.[role] === AccountStatuses.APPROVED;
}

function submittedDocumentKeys(payload = {}) {
  if (Array.isArray(payload.documents)) return payload.documents.filter(Boolean);
  return Object.entries(payload)
    .filter(([, value]) => value === true || value === "true" || value === "on" || (typeof value === "string" && value.length > 0))
    .map(([key]) => key);
}

function companyRoles() {
  return [
    Roles.CARRIER_OWNER,
    Roles.CLIENT_OWNER,
    Roles.WAREHOUSE_WORKER,
    Roles.WORKSHOP,
    Roles.MOBILE_SERVICE,
    Roles.ROADSIDE_ASSISTANCE,
    Roles.INSURANCE_PARTNER,
    Roles.CARRIER_DISPATCHER,
    Roles.SUPPORT_AGENT
  ];
}

function companyTypeForRole(role) {
  if ([Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER].includes(role)) return CompanyTypes.CARRIER;
  if ([Roles.CLIENT_OWNER, Roles.CLIENT_DISPATCHER].includes(role)) return CompanyTypes.CLIENT;
  if (role === Roles.WAREHOUSE_WORKER) return CompanyTypes.WAREHOUSE;
  if (role === Roles.WORKSHOP) return CompanyTypes.WORKSHOP;
  if (role === Roles.MOBILE_SERVICE) return CompanyTypes.MOBILE_SERVICE;
  if (role === Roles.ROADSIDE_ASSISTANCE) return CompanyTypes.ROADSIDE_ASSISTANCE;
  if (role === Roles.INSURANCE_PARTNER) return CompanyTypes.INSURER;
  if (role === Roles.SUPPORT_AGENT) return CompanyTypes.ACADEMY_PARTNER;
  return CompanyTypes.CLIENT;
}

function latestRoleVerification(state, userId, role) {
  return state.roleVerifications.find((item) => item.userId === userId && item.role === role) || null;
}

function truthy(value) {
  return value === true || value === "true" || value === "on";
}
