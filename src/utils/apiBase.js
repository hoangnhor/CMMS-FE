export function resolveApiBaseUrl() {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawBaseUrl && import.meta.env.PROD) {
    throw new Error("VITE_API_BASE_URL is required for production builds");
  }

  const normalizedBaseUrl = (rawBaseUrl || "http://localhost:5000/api").replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/api") ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;
}

export function resolveRealtimeBaseUrl() {
  const apiBaseUrl = resolveApiBaseUrl();
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
}
