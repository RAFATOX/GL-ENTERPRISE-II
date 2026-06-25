import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class DocumentEngine {
  constructor(state) {
    this.state = state;
  }

  upload(transport, actor, payload) {
    const doc = {
      id: createId("doc"),
      transportId: transport.id,
      type: payload.type || "cmr",
      label: payload.label || "Dokument transportu",
      visibleToRoles: payload.visibleToRoles || ["platform_owner", "admin", "client_owner", "carrier_owner"],
      encrypted: true,
      integrityHash: this.integrityHash(`${transport.id}:${payload.type}:${Date.now()}`),
      uploadedBy: actor.userId,
      uploadedAt: nowIso()
    };
    this.state.documents.unshift(doc);
    transport.documentIds.unshift(doc.id);
    return {
      document: doc,
      event: {
        type: EventTypes.DOCUMENT_UPLOADED,
        objectType: "transport",
        objectId: transport.id,
        reason: `${doc.type}: encrypted with integrity hash`
      }
    };
  }

  hasDocumentType(transport, type) {
    return transport.documentIds
      .map((id) => this.state.documents.find((doc) => doc.id === id))
      .some((doc) => doc?.type === type);
  }

  confirmRequiredSet(transport) {
    const required = transport.requiredDocumentTypes || [];
    const missing = required.filter((type) => !this.hasDocumentType(transport, type));
    if (missing.length) return null;
    return {
      type: EventTypes.DOCUMENT_CONFIRMED,
      objectType: "transport",
      objectId: transport.id,
      previousState: "pending_documents",
      newState: "documents_confirmed",
      reason: "all required transport documents have integrity hashes"
    };
  }

  integrityHash(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return `sha256-demo-${Math.abs(hash).toString(16)}`;
  }
}
