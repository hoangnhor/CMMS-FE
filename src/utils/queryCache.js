const CACHE_PREFIX = "am_query_cache:";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      const nextValue = value[key];
      if (nextValue === undefined) return result;
      result[key] = sortValue(nextValue);
      return result;
    }, {});
}

function stringifyKey(value) {
  try {
    return JSON.stringify(sortValue(value));
  } catch {
    return "";
  }
}

function makeStorageKey(method, path, config = {}) {
  return `${CACHE_PREFIX}${String(method || "GET").toUpperCase()}:${String(path || "")}:${stringifyKey({
    params: config?.params || {},
  })}`;
}

function readStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/storage failures.
  }
}

function readQueryCache(method, path, config = {}, ttlMs = DEFAULT_TTL_MS) {
  const key = makeStorageKey(method, path, config);
  const record = readStorage(key);
  if (!record || typeof record !== "object") return null;

  const ageMs = Date.now() - Number(record.savedAt || 0);
  if (ageMs > ttlMs) return null;

  return record.payload ?? null;
}

function writeQueryCache(method, path, config = {}, payload) {
  const key = makeStorageKey(method, path, config);
  writeStorage(key, {
    savedAt: Date.now(),
    payload,
  });
}

export { DEFAULT_TTL_MS, makeStorageKey, readQueryCache, writeQueryCache };
