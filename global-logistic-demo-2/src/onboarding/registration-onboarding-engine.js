import { AccountStatuses, Roles } from "../core/constants.js";
import { GlIdentityEngine } from "../identity/gl-identity-engine.js";
import {
  GlRoleVerificationEngine,
  missingRoleDocuments,
  normalizeOnboardingRole,
  onboardingRoleOptions,
  roleDocumentRequirements,
  roleVerificationApproved
} from "../roles/role-verification-engine.js";

export class RegistrationOnboardingEngine {
  constructor(state) {
    this.state = state;
    this.identity = new GlIdentityEngine(state);
    this.roleVerification = new GlRoleVerificationEngine(state);
  }

  start(payload) {
    return this.identity.startRegistration(payload);
  }

  verifyPhone(payload) {
    return this.identity.verifyPhone(payload.userId, payload);
  }

  createAccount(payload) {
    return this.identity.createAccount(payload.userId, payload);
  }

  selectRole(payload) {
    return this.roleVerification.selectRole(payload.userId, payload.role);
  }

  submitIdentity(payload) {
    return this.identity.submitIdentity(payload.userId, payload);
  }

  submitRoleDocuments(payload) {
    return this.roleVerification.submitRoleDocuments(payload.userId, payload.role, payload);
  }

  submitCompany(payload) {
    return this.roleVerification.submitCompanyProfile(payload.userId, payload.role, payload);
  }

  approve(payload) {
    return this.roleVerification.approve(payload.userId, payload.role);
  }

  reject(payload) {
    return this.roleVerification.reject(payload.userId, payload.reason);
  }

  currentUser() {
    return this.state.users.find((user) => user.id === this.state.session.onboardingUserId)
      || this.state.users.find((user) => user.id === this.state.session.userId)
      || null;
  }

  canEnterApp(user) {
    return isAccountApproved(user) && !this.state.session.onboardingRequired;
  }

  canUseRole(actor, role = actor.role) {
    const user = this.state.users.find((item) => item.id === actor.userId);
    if (!isAccountApproved(user)) return false;
    return roleVerificationApproved(user, role) || platformRole(role);
  }

  missingForUser(user = this.currentUser()) {
    if (!user) return ["jezyk", "kraj", "telefon", "zgody"];
    if (!user.phoneVerified) return ["potwierdzenie telefonu OTP"];
    const missing = [];
    if (!user.firstName || !user.lastName || !user.email) missing.push("konto uzytkownika");
    if (!user.selectedRole) missing.push("wybor roli");
    if (!user.documentVerified || !user.faceVerified || !user.identityDocument) missing.push("dokument tozsamosci i selfie");
    if (user.selectedRole) missing.push(...missingRoleDocuments(user.selectedRole, user.roleDocuments?.[user.selectedRole] || []));
    if (companyRole(user.selectedRole) && user.accountStatus !== AccountStatuses.APPROVED) missing.push("dane firmy i konto rozliczeniowe");
    return [...new Set(missing)];
  }

  requirementsForRole(role) {
    return roleDocumentRequirements(role);
  }

  roleOptions() {
    return onboardingRoleOptions;
  }
}

export function isAccountApproved(userOrActor) {
  const status = userOrActor?.accountStatus || userOrActor?.verificationStatus;
  return [AccountStatuses.APPROVED, AccountStatuses.VERIFIED].includes(status);
}

export function onboardingActionTypes(ActionTypes) {
  return [
    ActionTypes.ONBOARDING_START,
    ActionTypes.ONBOARDING_VERIFY_PHONE,
    ActionTypes.ONBOARDING_CREATE_ACCOUNT,
    ActionTypes.ONBOARDING_SELECT_ROLE,
    ActionTypes.ONBOARDING_SUBMIT_IDENTITY,
    ActionTypes.ONBOARDING_SUBMIT_ROLE_DOCUMENTS,
    ActionTypes.ONBOARDING_SUBMIT_COMPANY,
    ActionTypes.ONBOARDING_APPROVE,
    ActionTypes.ONBOARDING_REJECT
  ];
}

export function roleForOperationalAction(actionType, ActionTypes, actorRole) {
  if ([ActionTypes.CREATE_LOAD, ActionTypes.PUBLISH_LOAD].includes(actionType)) return Roles.CLIENT_OWNER;
  if ([ActionTypes.ACCEPT_CARRIER, ActionTypes.ASSIGN_DRIVER, ActionTypes.ADD_VEHICLE].includes(actionType)) return Roles.CARRIER_OWNER;
  if ([
    ActionTypes.START_PICKUP_NAVIGATION,
    ActionTypes.ARRIVE_PICKUP,
    ActionTypes.START_LOADING,
    ActionTypes.CONFIRM_LOADING,
    ActionTypes.START_TRANSIT,
    ActionTypes.ARRIVE_DELIVERY,
    ActionTypes.START_UNLOADING,
    ActionTypes.CONFIRM_DELIVERY
  ].includes(actionType)) return Roles.DRIVER;
  if ([ActionTypes.ACCEPT_SERVICE_JOB, ActionTypes.COMPLETE_SERVICE_JOB].includes(actionType)) return actorRole;
  if ([ActionTypes.OPEN_CLAIM].includes(actionType)) return Roles.INSURANCE_PARTNER;
  return actorRole;
}

export function normalizeRegistrationRole(role) {
  return normalizeOnboardingRole(role);
}

function companyRole(role) {
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
  ].includes(normalizeOnboardingRole(role));
}

function platformRole(role) {
  return [Roles.PLATFORM_OWNER, Roles.GL_OPERATOR, Roles.ADMIN_FINANCE, Roles.ADMIN, Roles.SUPER_ADMIN].includes(role);
}
