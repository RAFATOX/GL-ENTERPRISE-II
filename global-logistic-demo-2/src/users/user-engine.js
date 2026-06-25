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
      accountStatus: user?.accountStatus || "system"
    };
  }

  findDemoUserForRole(role) {
    return this.state.users.find((user) => user.roles.includes(role)) || this.state.users[0];
  }

  usersByRole(role) {
    return this.state.users.filter((user) => user.roles.includes(role));
  }
}
