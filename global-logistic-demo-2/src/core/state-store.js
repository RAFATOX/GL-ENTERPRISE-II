import { DEMO_DATA_VERSION, STORAGE_KEY } from "./constants.js";
import { createDemoState } from "./demo-data.js";

export class StateStore {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  load() {
    if (typeof window === "undefined" || !window.localStorage) {
      return createDemoState();
    }

    const saved = window.localStorage.getItem(this.storageKey);
    if (!saved) return this.browserDemoState();

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.schemaVersion !== DEMO_DATA_VERSION || parsed?.demoDataVersion !== DEMO_DATA_VERSION) {
        window.localStorage.removeItem(this.storageKey);
        return this.browserDemoState();
      }
      return parsed;
    } catch (error) {
      window.localStorage.removeItem(this.storageKey);
      return this.browserDemoState();
    }
  }

  save(state) {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  reset() {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(this.storageKey);
    }
    if (typeof window !== "undefined" && window.localStorage) return this.browserDemoState();
    return createDemoState();
  }

  browserDemoState() {
    return createDemoState({ startInApp: true });
  }
}
