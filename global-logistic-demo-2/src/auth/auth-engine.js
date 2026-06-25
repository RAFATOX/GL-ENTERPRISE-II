import { AccountStatuses, EventTypes } from "../core/constants.js";
import { createId } from "../core/id.js";

export class AuthEngine {
  constructor(state) {
    this.state = state;
  }

  registerPhoneUser(payload) {
    const user = {
      id: createId("user"),
      name: payload.name || "Demo User",
      phone: payload.phone || "+48500999000",
      language: payload.language || "pl",
      companyId: payload.companyId || null,
      roles: [payload.role],
      accountStatus: AccountStatuses.PENDING,
      documentVerified: false,
      faceVerified: false,
      documentsValid: false,
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
        newState: AccountStatuses.PENDING,
        reason: "phone registration created"
      }]
    };
  }

  verifyAccount(userId) {
    const user = this.state.users.find((item) => item.id === userId);
    if (!user) return null;
    const previousState = user.accountStatus;
    user.accountStatus = AccountStatuses.VERIFIED;
    user.documentVerified = true;
    user.faceVerified = true;
    user.documentsValid = true;
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
}
