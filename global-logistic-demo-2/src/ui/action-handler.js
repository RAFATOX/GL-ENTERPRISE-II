import { ActionTypes } from "../core/constants.js";

const textKeys = new Set([
  "address",
  "body",
  "comment",
  "companyName",
  "country",
  "countryOfResidence",
  "description",
  "documentCountry",
  "documentExpiresAt",
  "documentType",
  "email",
  "firstName",
  "label",
  "lastName",
  "language",
  "licensePlate",
  "name",
  "otpCode",
  "passwordMethod",
  "phone",
  "plate",
  "reason",
  "role",
  "type",
  "userId",
  "userType",
  "vat",
  "vatEu"
]);

export function parsePayload(raw) {
  if (!raw) return { ok: true, payload: {} };
  try {
    const decoded = decodeURIComponent(raw);
    const payload = JSON.parse(decoded);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, payload: {}, error: "Payload akcji musi byc obiektem JSON." };
    }
    return { ok: true, payload: sanitizePayload(payload) };
  } catch (error) {
    return {
      ok: false,
      payload: {},
      error: `Nieprawidlowy payload akcji: ${error.message}`
    };
  }
}

export function payloadFromForm(form) {
  const action = form.dataset.formAction;
  const base = parsePayload(form.dataset.payload || "");
  if (!base.ok) return base;

  const data = new FormData(form);
  const payload = { ...base.payload };
  for (const [key, value] of data.entries()) {
    if (value === "") continue;
    setPayloadValue(payload, key, value);
  }

  return {
    ok: true,
    action,
    payload: sanitizePayload(normalizeActionPayload(action, payload))
  };
}

export function sanitizePayload(value, key = "") {
  if (Array.isArray(value)) return value.map((item) => sanitizePayload(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizePayload(entryValue, entryKey)])
    );
  }
  if (typeof value !== "string") return value;
  const normalized = value.trim();
  if (textKeys.has(key)) return stripDangerousHtml(normalized);
  return normalized;
}

function normalizeActionPayload(action, payload) {
  if (action === ActionTypes.CREATE_LOAD) {
    return {
      ...payload,
      weightKg: numberOrDefault(payload.weightKg, 1200),
      price: numberOrDefault(payload.price, 1500),
      pickupGps: normalizeGps(payload.pickupGps),
      deliveryGps: normalizeGps(payload.deliveryGps)
    };
  }

  if (action === ActionTypes.CONFIRM_GPS) {
    return {
      ...payload,
      pickupGps: normalizeGps(payload.pickupGps),
      deliveryGps: normalizeGps(payload.deliveryGps)
    };
  }

  if (action === ActionTypes.PARKING_REPORT) {
    return {
      ...payload,
      freePlaces: numberOrDefault(payload.freePlaces, 0),
      credible: payload.credible !== "false"
    };
  }

  return payload;
}

function setPayloadValue(payload, key, value) {
  if (!key.includes(".")) {
    payload[key] = value;
    return;
  }
  const parts = key.split(".");
  let cursor = payload;
  parts.slice(0, -1).forEach((part) => {
    cursor[part] ||= {};
    cursor = cursor[part];
  });
  cursor[parts.at(-1)] = value;
}

function normalizeGps(value) {
  if (!value || typeof value !== "object") return value;
  return {
    lat: numberOrDefault(value.lat, 0),
    lng: numberOrDefault(value.lng, 0)
  };
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function stripDangerousHtml(value) {
  return value
    .replaceAll("<", "")
    .replaceAll(">", "")
    .replaceAll("javascript:", "")
    .replaceAll("onerror=", "")
    .replaceAll("onload=", "");
}
