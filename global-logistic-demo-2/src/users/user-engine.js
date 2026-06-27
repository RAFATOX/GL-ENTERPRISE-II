import { Roles } from "../core/constants.js";

export class UserEngine {
  constructor(state) {
    this.state = state;
  }

  getById(userId) {
    return this.state.users.find((user) => user.id === userId) || null;
  }

  getActor(session) {
    const user = this.getById(session.userId);
    return {
      userId: user?.id || "system",
      name: user?.name || "System",
      role: session.role || Roles.READONLY_AUDITOR,
      companyId: user?.companyId || null,
      accountStatus: user?.accountStatus || "draft",
      verificationStatus: user?.verificationStatus || user?.accountStatus || "draft",
      phoneVerified: Boolean(user?.phoneVerified),
      documentVerified: Boolean(user?.documentVerified),
      faceVerified: Boolean(user?.faceVerified),
      documentsValid: Boolean(user?.documentsValid),
      selectedRole: user?.selectedRole || null,
      roleVerificationStatus: user?.roleVerificationStatus || {}
    };
  }

  findDemoUserForRole(role) {
    return this.state.users.find((user) => user.roles.includes(role)) || this.state.users[0];
  }

  usersByRole(role) {
    return this.state.users.filter((user) => user.roles.includes(role));
  }
}
