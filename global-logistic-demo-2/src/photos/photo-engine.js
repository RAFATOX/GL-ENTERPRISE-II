import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class PhotoEngine {
  constructor(state) {
    this.state = state;
  }

  addPhoto(transport, actor, payload) {
    const photo = {
      id: createId("photo"),
      transportId: transport.id,
      type: payload.type || "transport_photo",
      label: payload.label || "Zdjecie transportu",
      uploadedBy: actor.userId,
      state: payload.state || "ok",
      integrityHash: `photo-hash-${createId("hash")}`,
      uploadedAt: nowIso()
    };
    this.state.photos.unshift(photo);
    transport.photoIds.unshift(photo.id);
    if (photo.type === "pre_publish_load") {
      transport.cargo.prePublishPhotoId = photo.id;
    }
    return {
      photo,
      event: {
        type: EventTypes.LOAD_PHOTO_ADDED,
        objectType: "transport",
        objectId: transport.id,
        reason: `${photo.type}: ${photo.label}`
      }
    };
  }
}
