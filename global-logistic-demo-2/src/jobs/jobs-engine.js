import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class JobsEngine {
  constructor(state) {
    this.state = state;
  }

  getForTransport(transportId) {
    return this.state.jobs.find((job) => job.transportId === transportId) || null;
  }

  createForTransport(transport) {
    if (!transport.driverId || !transport.carrierCompanyId) return null;
    const existing = this.getForTransport(transport.id);
    if (existing) return null;
    const job = {
      id: createId("job"),
      transportId: transport.id,
      driverId: transport.driverId,
      carrierCompanyId: transport.carrierCompanyId,
      status: "assigned",
      createdAt: nowIso(),
      completedAt: null
    };
    this.state.jobs.unshift(job);
    return {
      type: EventTypes.JOB_CREATED,
      objectType: "job",
      objectId: job.id,
      transportId: transport.id,
      previousState: null,
      newState: job.status,
      reason: "driver job created from DRIVER_ASSIGNED event"
    };
  }

  completeForTransport(transport) {
    const job = this.getForTransport(transport.id);
    if (!job || job.status === "completed") return null;
    const previousState = job.status;
    job.status = "completed";
    job.completedAt = nowIso();
    return {
      type: EventTypes.JOB_COMPLETED,
      objectType: "job",
      objectId: job.id,
      transportId: transport.id,
      previousState,
      newState: job.status,
      reason: "driver job completed with transport"
    };
  }
}
