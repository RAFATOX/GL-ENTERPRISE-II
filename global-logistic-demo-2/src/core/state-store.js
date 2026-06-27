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
    if (!saved) return createDemoState();

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.schemaVersion !== 10 || parsed?.demoDataVersion !== DEMO_DATA_VERSION) {
        window.localStorage.removeItem(this.storageKey);
        return createDemoState();
      }
      return parsed;
    } catch (error) {
      window.localStorage.removeItem(this.storageKey);
      return createDemoState();
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
    return createDemoState();
  }
}
