import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class CommunicationEngine {
  constructor(state) {
    this.state = state;
  }

  threadForTransport(transport) {
    let thread = this.state.messageThreads.find((item) => item.transportId === transport.id);
    if (!thread) {
      thread = {
        id: createId("thread"),
        transportId: transport.id,
        participantCompanyIds: [
          transport.clientCompanyId,
          transport.carrierCompanyId
        ].filter(Boolean),
        messageIds: []
      };
      this.state.messageThreads.unshift(thread);
    }
    return thread;
  }

  sendMessage(transport, actor, payload) {
    const thread = this.threadForTransport(transport);
    if (actor.companyId && !thread.participantCompanyIds.includes(actor.companyId)) {
      thread.participantCompanyIds.push(actor.companyId);
    }
    const message = {
      id: createId("msg"),
      threadId: thread.id,
      transportId: transport.id,
      authorId: actor.userId,
      authorRole: actor.role,
      body: payload.body || "Demo transport message",
      language: payload.language || "pl",
      createdAt: nowIso(),
      translationIds: []
    };
    this.state.messages.unshift(message);
    thread.messageIds.unshift(message.id);
    return {
      message,
      event: {
        type: EventTypes.MESSAGE_SENT,
        objectType: "message",
        objectId: message.id,
        transportId: transport.id,
        previousState: null,
        newState: message.language,
        reason: "message added to transport communication thread"
      }
    };
  }

  getMessage(messageId) {
    return this.state.messages.find((message) => message.id === messageId) || null;
  }
}
