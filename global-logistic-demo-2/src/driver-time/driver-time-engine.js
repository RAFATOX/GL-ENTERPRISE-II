export class DriverTimeEngine {
  constructor(state) {
    this.state = state;
  }

  get(driverId) {
    return this.state.driverTime.find((record) => record.driverId === driverId) || null;
  }

  canAssign(driverId) {
    const record = this.get(driverId);
    if (!record) {
      return { ok: false, reason: "driver time profile missing" };
    }
    if (!record.legalToComplete) {
      return { ok: false, reason: "driver would violate legal working time" };
    }
    if (record.remainingLegalHours < 1.5) {
      return { ok: false, reason: "remaining legal driving time too low" };
    }
    return { ok: true, reason: "driver time legal for demo assignment" };
  }

  startBreak(driverId) {
    const record = this.get(driverId);
    if (record) {
      record.breakHours += 0.75;
      record.drivingHoursToday = Math.max(0, record.drivingHoursToday - 0.75);
      record.remainingLegalHours += 0.75;
      record.legalToComplete = record.remainingLegalHours >= 1.5;
    }
  }

  recordFerryRest(driverId, hours = 1.5) {
    const record = this.get(driverId);
    if (record) {
      record.breakHours += hours;
      record.drivingHoursToday = Math.max(0, record.drivingHoursToday - hours);
      record.remainingLegalHours += hours;
      record.legalToComplete = record.remainingLegalHours >= 1.5;
      record.ferryRailAllowance = true;
    }
  }
}
