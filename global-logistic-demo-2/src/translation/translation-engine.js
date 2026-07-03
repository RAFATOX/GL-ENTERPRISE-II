import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

const demoDictionary = {
  "Arrived at secure parking, break started.": "Kierowca dotarl na parking strzezony i rozpoczal pauze.",
  "Damage found at unloading, photos uploaded.": "Wykryto uszkodzenie przy rozladunku, zdjecia zostaly dodane.",
  "Please confirm gate clearance before loading.": "Prosze potwierdzic odprawe na bramie przed zaladunkiem.",
  "Gate cleared. Driver may start loading.": "Brama zatwierdzona. Kierowca moze rozpoczac zaladunek."
};

export class TranslationEngine {
  constructor(state) {
    this.state = state;
  }

  languageForSession(session = this.state.session) {
    const user = this.state.users.find((item) => item.id === session?.userId);
    return user?.language || session?.language || "pl";
  }

  translationForMessage(message, targetLanguage = this.languageForSession()) {
    if (!message || message.language === targetLanguage) return null;
    return this.state.translations.find((translation) => (
      translation.messageId === message.id
      && translation.targetLanguage === targetLanguage
    )) || null;
  }

  contextualMessageTranslation(message, targetLanguage = this.languageForSession()) {
    const translation = this.translationForMessage(message, targetLanguage);
    if (!translation) return null;
    return {
      ...translation,
      sourceBody: message.body,
      operationalContext: "chat"
    };
  }

  documentTranslationContext(document, targetLanguage = this.languageForSession()) {
    if (!document) return null;
    return {
      documentId: document.id,
      sourceLanguage: document.language || "pl",
      targetLanguage,
      label: document.label,
      shouldTranslate: Boolean(document.language && document.language !== targetLanguage),
      operationalContext: "document"
    };
  }

  notificationTranslationContext(notification, targetLanguage = this.languageForSession()) {
    if (!notification) return null;
    return {
      notificationId: notification.id,
      sourceLanguage: notification.language || "pl",
      targetLanguage,
      message: notification.message,
      shouldTranslate: Boolean(notification.language && notification.language !== targetLanguage),
      operationalContext: "notification"
    };
  }

  translateMessage(message, targetLanguage = "pl") {
    if (!message || message.language === targetLanguage) return null;
    const existing = this.state.translations.find((translation) => (
      translation.messageId === message.id
      && translation.targetLanguage === targetLanguage
    ));
    if (existing) return null;
    const translation = {
      id: createId("translation"),
      messageId: message.id,
      sourceLanguage: message.language,
      targetLanguage,
      body: demoDictionary[message.body] || `[${message.language}->${targetLanguage}] ${message.body}`,
      createdAt: nowIso()
    };
    this.state.translations.unshift(translation);
    message.translationIds = message.translationIds || [];
    message.translationIds.unshift(translation.id);
    return {
      type: EventTypes.MESSAGE_TRANSLATED,
      objectType: "translation",
      objectId: translation.id,
      transportId: message.transportId,
      previousState: message.language,
      newState: targetLanguage,
      reason: "demo translation created for transport message"
    };
  }
}
