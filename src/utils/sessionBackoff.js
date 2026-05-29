export const BASE_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
export const MAX_BACKOFF_MS = 30 * 60 * 1000;

export function computeNextDelay(failures) {
  if (!failures) return BASE_REFRESH_INTERVAL_MS;
  const factor = 2 ** Math.min(failures, 4);
  return Math.min(BASE_REFRESH_INTERVAL_MS * factor, MAX_BACKOFF_MS);
}

