let counter = 1;

export function createId(prefix) {
  const time = Date.now().toString(36);
  const serial = counter.toString(36).padStart(3, "0");
  counter += 1;
  return `${prefix}_${time}_${serial}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}
