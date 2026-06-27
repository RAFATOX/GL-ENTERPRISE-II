import { AccountStatuses, EventTypes, Roles } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOCK_TTL_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;

export class AuthEngine {
  constructor(state) {
    this.state = state;
    ensureAuthState(this.state);
  }

  startLogin(payload) {
    ensureAuthState(this.state);
    const user = this.findUserByIdentifier(payload.identifier || payload.phone || payload.email);
    if (!user) {
      return authFailure("unknown", EventTypes.AUTH_LOGIN_FAILED, "nie znaleziono konta dla loginu", "unknown_identity");
    }
    if (user.passwordHash) {
      if (!payload.password) {
        return authFailure(user.id, EventTypes.AUTH_LOGIN_FAILED, "haslo jest wymagane dla tego konta", "missing_password");
      }
      if (hashSecret(String(payload.password), user.passwordSalt) !== user.passwordHash) {
        return authFailure(user.id, EventTypes.AUTH_LOGIN_FAILED, "nieprawidlowe haslo", "invalid_password");
      }
    }
    if (isLocked(user)) {
      return authFailure(user.id, EventTypes.AUTH_LOGIN_FAILED, "konto zablokowane po nieudanych probach OTP", "locked");
    }
    const challenge = createOtpChallenge(this.state, user, "login");
    return {
      challenge,
      events: [challengeEvent(challenge, user.id, "utworzono OTP do logowania")]
    };
  }

  verifyLogin(payload, companyEngine = null) {
    ensureAuthState(this.state);
    const result = verifyOtpChallenge(this.state, payload.challengeId, payload.otpCode, "login");
    if (!result.ok) {
      const challenge = this.state.otpChallenges.find((item) => item.id === payload.challengeId);
      return {
        ...result,
        events: [
          ...(result.events || []),
          {
            type: EventTypes.AUTH_LOGIN_FAILED,
            objectType: "user",
            objectId: challenge?.userId || "unknown",
            previousState: null,
            newState: "failed",
            reason: result.reasons?.[0] || "nieudane logowanie",
            result: "failed"
          }
        ]
      };
    }

    const user = result.user;
    const context = companyEngine?.defaultContextForUser(user) || null;
    const authSession = createAuthSession(this.state, user, context);
    this.state.session.userId = user.id;
    this.state.session.role = user.selectedRole || user.roles?.[0] || Roles.READONLY_AUDITOR;
    this.state.session.contextType = context?.contextType || "private";
    this.state.session.companyId = context?.companyId || null;
    this.state.session.companyRoleId = context?.userCompanyRoleId || null;
    this.state.session.authSessionId = authSession.id;
    this.state.session.onboardingRequired = ![AccountStatuses.APPROVED, AccountStatuses.VERIFIED].includes(user.accountStatus);
    this.state.session.onboardingUserId = this.state.session.onboardingRequired ? user.id : null;
    this.state.session.view = this.state.session.onboardingRequired ? "onboarding" : "dashboard";
    this.state.session.deniedView = null;
    this.state.session.deniedRoute = null;

    return {
      session: authSession,
      events: [{
        type: EventTypes.AUTH_LOGIN_SUCCEEDED,
        objectType: "user",
        objectId: user.id,
        previousState: "otp_verified",
        newState: authSession.id,
        reason: "uzytkownik zalogowany po poprawnym OTP"
      }]
    };
  }

  logout(payload = {}) {
    ensureAuthState(this.state);
    const sessionId = payload.sessionId || this.state.session.authSessionId;
    const active = this.state.authSessions.find((session) => session.id === sessionId);
    if (active) {
      active.status = "revoked";
      active.revokedAt = nowIso();
    }
    const previousUserId = this.state.session.userId;
    this.state.session.userId = null;
    this.state.session.role = Roles.READONLY_AUDITOR;
    this.state.session.contextType = "private";
    this.state.session.companyId = null;
    this.state.session.companyRoleId = null;
    this.state.session.authSessionId = null;
    this.state.session.onboardingRequired = true;
    this.state.session.onboardingUserId = null;
    this.state.session.view = "onboarding";
    return {
      events: [{
        type: EventTypes.AUTH_LOGGED_OUT,
        objectType: "user",
        objectId: previousUserId || "anonymous",
        previousState: sessionId || null,
        newState: "logged_out",
        reason: "sesja uzytkownika zostala zakonczona"
      }]
    };
  }

  requestPasswordReset(payload) {
    ensureAuthState(this.state);
    const user = this.findUserByIdentifier(payload.identifier || payload.phone || payload.email);
    if (!user) {
      return authFailure("unknown", EventTypes.AUTH_LOGIN_FAILED, "nie znaleziono konta do resetu hasla", "unknown_identity");
    }
    if (isLocked(user)) {
      return authFailure(user.id, EventTypes.AUTH_LOGIN_FAILED, "konto zablokowane po nieudanych probach OTP", "locked");
    }
    const challenge = createOtpChallenge(this.state, user, "password_reset");
    return {
      challenge,
      events: [
        challengeEvent(challenge, user.id, "utworzono OTP do resetu hasla"),
        {
          type: EventTypes.AUTH_PASSWORD_RESET_REQUESTED,
          objectType: "user",
          objectId: user.id,
          previousState: null,
          newState: challenge.id,
          reason: "rozpoczeto reset hasla przez OTP"
        }
      ]
    };
  }

  confirmPasswordReset(payload) {
    ensureAuthState(this.state);
    const result = verifyOtpChallenge(this.state, payload.challengeId, payload.otpCode, "password_reset");
    if (!result.ok) return result;
    const user = result.user;
    const previousState = user.passwordUpdatedAt || null;
    user.passwordSalt = createId("password_salt");
    user.passwordHash = hashSecret(String(payload.newPassword || ""), user.passwordSalt);
    user.passwordMethod = "password_demo";
    user.passwordUpdatedAt = nowIso();
    return {
      user,
      events: [{
        type: EventTypes.AUTH_PASSWORD_RESET_SUCCEEDED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: user.passwordUpdatedAt,
        reason: "haslo zmienione po poprawnym OTP"
      }]
    };
  }

  peekDemoOtp(challengeId) {
    return this.state.otpChallenges.find((challenge) => challenge.id === challengeId)?.demoOtpCode || null;
  }

  registerPhoneUser(payload) {
    const user = {
      id: createId("user"),
      name: payload.name || "Demo User",
      phone: payload.phone || "+48500999000",
      language: payload.language || "pl",
      companyId: payload.companyId || null,
      roles: [payload.role],
      accountStatus: AccountStatuses.DRAFT,
      verificationStatus: AccountStatuses.DRAFT,
      onboardingStage: "phone",
      phoneVerified: false,
      documentVerified: false,
      faceVerified: false,
      documentsValid: false,
      roleVerificationStatus: {},
      recoveryEnabled: true,
      previousPhones: []
    };
    this.state.users.push(user);
    return {
      user,
      events: [{
        type: EventTypes.USER_REGISTERED,
        objectType: "user",
        objectId: user.id,
        previousState: null,
        newState: AccountStatuses.DRAFT,
        reason: "phone registration created"
      }]
    };
  }

  verifyAccount(userId) {
    const user = this.state.users.find((item) => item.id === userId);
    if (!user) return null;
    const previousState = user.accountStatus;
    user.accountStatus = AccountStatuses.APPROVED;
    user.verificationStatus = AccountStatuses.APPROVED;
    user.onboardingStage = "approved";
    user.phoneVerified = true;
    user.documentVerified = true;
    user.faceVerified = true;
    user.documentsValid = true;
    user.roleVerificationStatus ||= {};
    (user.roles || []).forEach((role) => {
      user.roleVerificationStatus[role] = AccountStatuses.APPROVED;
    });
    return {
      user,
      events: [{
        type: EventTypes.ACCOUNT_VERIFIED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: user.accountStatus,
        reason: "document and face verification completed"
      }]
    };
  }

  changePhone(userId, newPhone) {
    const user = this.state.users.find((item) => item.id === userId);
    if (!user) return null;
    const oldPhone = user.phone;
    user.previousPhones.push(oldPhone);
    user.phone = newPhone;
    return {
      user,
      events: [{
        type: EventTypes.PHONE_CHANGED,
        objectType: "user",
        objectId: user.id,
        previousState: oldPhone,
        newState: newPhone,
        reason: "phone changed without losing account"
      }]
    };
  }

  findUserByIdentifier(identifier) {
    const normalized = String(identifier || "").trim().toLowerCase();
    return this.state.users.find((user) => (
      String(user.phone || "").toLowerCase() === normalized
      || String(user.email || "").toLowerCase() === normalized
      || String(user.id || "").toLowerCase() === normalized
    )) || null;
  }
}

export function ensureAuthState(state) {
  state.authSessions ||= [];
  state.otpChallenges ||= [];
}

export function createOtpChallenge(state, user, purpose, options = {}) {
  ensureAuthState(state);
  const code = options.code || createOtpCode();
  const salt = createId("otp_salt");
  const challenge = {
    id: createId("otp"),
    userId: user.id,
    purpose,
    channel: options.channel || "sms",
    target: maskedTarget(user.phone || user.email || user.id),
    otpHash: hashSecret(code, salt),
    salt,
    demoOtpCode: code,
    attempts: 0,
    maxAttempts: MAX_OTP_ATTEMPTS,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    usedAt: null,
    status: "pending"
  };
  state.otpChallenges.unshift(challenge);
  return challenge;
}

export function verifyOtpChallenge(state, challengeId, otpCode, purpose) {
  ensureAuthState(state);
  const challenge = state.otpChallenges.find((item) => item.id === challengeId && item.purpose === purpose);
  if (!challenge) return otpFailure(null, "challenge_not_found", "OTP challenge not found");
  const user = state.users.find((item) => item.id === challenge.userId);
  if (!user) return otpFailure(challenge, "user_not_found", "OTP user not found");
  if (isLocked(user)) return otpFailure(challenge, "locked", "konto zablokowane po nieudanych probach OTP");
  if (challenge.usedAt || challenge.status === "used") return otpFailure(challenge, "used", "kod OTP zostal juz uzyty");
  if (Date.parse(challenge.expiresAt) <= Date.now()) {
    challenge.status = "expired";
    return otpFailure(challenge, "expired", "kod OTP wygasl");
  }

  const matches = hashSecret(String(otpCode || ""), challenge.salt) === challenge.otpHash;
  if (!matches) {
    challenge.attempts += 1;
    challenge.lastFailedAt = nowIso();
    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.status = "locked";
      user.authLockedUntil = new Date(Date.now() + LOCK_TTL_MS).toISOString();
      return {
        ok: false,
        reasons: ["zbyt wiele blednych prob OTP"],
        events: [
          failedOtpEvent(challenge, "zbyt wiele blednych prob OTP"),
          {
            type: EventTypes.AUTH_OTP_LOCKED,
            objectType: "user",
            objectId: user.id,
            previousState: null,
            newState: user.authLockedUntil,
            reason: "konto zablokowane po blednych probach OTP",
            result: "blocked"
          }
        ]
      };
    }
    return otpFailure(challenge, "invalid", "nieprawidlowy kod OTP");
  }

  challenge.status = "used";
  challenge.usedAt = nowIso();
  user.authLockedUntil = null;
  return { ok: true, user, challenge, events: [] };
}

function createAuthSession(state, user, context) {
  const session = {
    id: createId("auth_session"),
    userId: user.id,
    role: user.selectedRole || user.roles?.[0] || Roles.READONLY_AUDITOR,
    contextType: context?.contextType || "private",
    companyId: context?.companyId || null,
    userCompanyRoleId: context?.userCompanyRoleId || null,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    status: "active"
  };
  state.authSessions.unshift(session);
  return session;
}

function authFailure(userId, eventType, reason, newState) {
  return {
    ok: false,
    reasons: [reason],
    events: [{
      type: eventType,
      objectType: "user",
      objectId: userId,
      previousState: null,
      newState,
      reason,
      result: "failed"
    }]
  };
}

function otpFailure(challenge, newState, reason) {
  return {
    ok: false,
    reasons: [reason],
    events: [failedOtpEvent(challenge, reason, newState)]
  };
}

function failedOtpEvent(challenge, reason, newState = "failed") {
  return {
    type: EventTypes.AUTH_OTP_FAILED,
    objectType: "user",
    objectId: challenge?.userId || "unknown",
    previousState: challenge?.attempts || 0,
    newState,
    reason,
    result: "failed"
  };
}

function challengeEvent(challenge, userId, reason) {
  return {
    type: EventTypes.AUTH_OTP_CHALLENGE_CREATED,
    objectType: "user",
    objectId: userId,
    previousState: null,
    newState: challenge.id,
    reason
  };
}

function createOtpCode() {
  const value = randomInt(0, 999999);
  return String(value).padStart(6, "0");
}

function randomInt(min, max) {
  const range = max - min + 1;
  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return min + (array[0] % range);
  }
  return min + Math.floor(Math.random() * range);
}

function isLocked(user) {
  return Boolean(user?.authLockedUntil && Date.parse(user.authLockedUntil) > Date.now());
}

function maskedTarget(value) {
  const text = String(value || "");
  if (text.includes("@")) {
    const [name, domain] = text.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${text.slice(0, 4)}***${text.slice(-2)}`;
}

function hashSecret(secret, salt) {
  const input = `${salt}:${secret}`;
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) + input.charCodeAt(index);
    hash >>>= 0;
  }
  return `demo_hash_${hash.toString(36)}`;
}
