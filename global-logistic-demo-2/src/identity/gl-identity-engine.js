import { AccountStatuses, EventTypes, Roles } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class GlIdentityEngine {
  constructor(state) {
    this.state = state;
  }

  startRegistration(payload) {
    const user = {
      id: createId("user"),
      name: "Nowy uzytkownik GL",
      firstName: "",
      lastName: "",
      email: "",
      phone: payload.phone,
      language: payload.language,
      country: payload.country,
      countryOfResidence: payload.country,
      companyId: null,
      roles: [],
      selectedRole: null,
      accountStatus: AccountStatuses.DRAFT,
      verificationStatus: AccountStatuses.DRAFT,
      onboardingStage: "phone",
      phoneVerified: false,
      documentVerified: false,
      faceVerified: false,
      documentsValid: false,
      identityDocument: null,
      consents: {
        terms: true,
        identityVerification: true,
        documentProcessing: true,
        acceptedAt: nowIso()
      },
      roleVerificationStatus: {},
      roleDocuments: {},
      companyVerification: null,
      walletReady: false,
      recoveryEnabled: true,
      previousPhones: []
    };

    this.state.users.push(user);
    this.state.session.userId = user.id;
    this.state.session.role = Roles.READONLY_AUDITOR;
    this.state.session.onboardingUserId = user.id;
    this.state.session.onboardingRequired = true;
    this.state.session.view = "onboarding";
    this.state.onboardingDrafts.unshift({
      id: createId("onboarding"),
      userId: user.id,
      status: user.accountStatus,
      language: payload.language,
      country: payload.country,
      createdAt: nowIso()
    });

    const events = [
      {
        type: EventTypes.ONBOARDING_STARTED,
        objectType: "user",
        objectId: user.id,
        previousState: null,
        newState: user.accountStatus,
        reason: "rozpoczeto rejestracje GL Identity Engine"
      },
      {
        type: EventTypes.ONBOARDING_LANGUAGE_SELECTED,
        objectType: "user",
        objectId: user.id,
        previousState: null,
        newState: payload.language,
        reason: "wybrano jezyk i kraj rejestracji"
      },
      {
        type: EventTypes.PHONE_ADDED,
        objectType: "user",
        objectId: user.id,
        previousState: null,
        newState: payload.phone,
        reason: "dodano telefon do weryfikacji OTP"
      }
    ];

    if (this.phoneAlreadyExists(payload.phone, user.id)) {
      events.push({
        type: EventTypes.COMPLIANCE_SIGNAL_RECORDED,
        objectType: "user",
        objectId: user.id,
        previousState: null,
        newState: "duplicate_phone",
        reason: "wiele kont na ten sam telefon"
      });
    }

    return { user, events };
  }

  verifyPhone(userId, payload) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const previousState = user.accountStatus;
    user.phoneVerified = true;
    user.accountStatus = AccountStatuses.PHONE_VERIFIED;
    user.verificationStatus = user.accountStatus;
    user.onboardingStage = "account";
    return {
      user,
      events: [{
        type: EventTypes.PHONE_OTP_VERIFIED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: user.accountStatus,
        reason: `telefon potwierdzony kodem OTP ${String(payload.otpCode || "").slice(0, 2)}**`
      }]
    };
  }

  createAccount(userId, payload) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const previousState = user.accountStatus;
    user.firstName = payload.firstName;
    user.lastName = payload.lastName;
    user.name = `${payload.firstName} ${payload.lastName}`.trim();
    user.email = payload.email;
    user.passwordMethod = payload.passwordMethod || "passkey_demo";
    user.countryOfResidence = payload.countryOfResidence || payload.country || user.country;
    user.userType = payload.userType;
    user.accountStatus = AccountStatuses.IDENTITY_PENDING;
    user.verificationStatus = user.accountStatus;
    user.onboardingStage = "role";
    return {
      user,
      events: [{
        type: EventTypes.USER_ACCOUNT_CREATED,
        objectType: "user",
        objectId: user.id,
        previousState,
        newState: user.accountStatus,
        reason: "utworzono konto uzytkownika po weryfikacji telefonu"
      }]
    };
  }

  submitIdentity(userId, payload) {
    const user = this.user(userId);
    if (!user) return { events: [] };
    const previousState = user.accountStatus;
    user.identityDocument = {
      id: createId("identity_doc"),
      type: payload.documentType,
      country: payload.documentCountry,
      expiresAt: payload.documentExpiresAt,
      selfieConfirmed: payload.selfieConfirmed === true || payload.selfieConfirmed === "true" || payload.selfieConfirmed === "on",
      submittedAt: nowIso()
    };
    user.documentVerified = true;
    user.faceVerified = true;
    user.documentsValid = true;
    user.accountStatus = user.selectedRole ? AccountStatuses.ROLE_DOCUMENTS_PENDING : AccountStatuses.IDENTITY_VERIFIED;
    user.verificationStatus = user.accountStatus;
    user.onboardingStage = user.selectedRole ? "role_documents" : "role";
    this.state.identityVerifications.unshift({
      id: createId("identity"),
      userId: user.id,
      documentId: user.identityDocument.id,
      status: AccountStatuses.IDENTITY_VERIFIED,
      checkedAt: nowIso()
    });
    return {
      user,
      events: [
        {
          type: EventTypes.IDENTITY_DOCUMENT_SUBMITTED,
          objectType: "user",
          objectId: user.id,
          previousState,
          newState: AccountStatuses.IDENTITY_PENDING,
          reason: "dodano dokument tozsamosci i selfie"
        },
        {
          type: EventTypes.IDENTITY_VERIFIED,
          objectType: "user",
          objectId: user.id,
          previousState: AccountStatuses.IDENTITY_PENDING,
          newState: user.accountStatus,
          reason: "dokument tozsamosci porownany z twarza w trybie demo"
        }
      ]
    };
  }

  user(userId) {
    return this.state.users.find((item) => item.id === userId) || null;
  }

  phoneAlreadyExists(phone, currentUserId) {
    return this.state.users.some((user) => user.id !== currentUserId && user.phone === phone);
  }
}
