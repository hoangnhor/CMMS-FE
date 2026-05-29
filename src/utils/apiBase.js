export function resolveApiBaseUrl() {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (rawBaseUrl) {
    const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
    return normalizedBaseUrl.endsWith("/api") ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;
  }

  if (import.meta.env.PROD) {
    const useSameOriginApi =
      String(import.meta.env.VITE_USE_SAME_ORIGIN_API || "").toLowerCase() === "true";
    if (!useSameOriginApi) {
      throw new Error(
        "Thiếu cấu hình API production: set VITE_API_BASE_URL hoặc VITE_USE_SAME_ORIGIN_API=true"
      );
    }
    return "/api";
  }

  const normalizedBaseUrl = "http://localhost:5000/api".replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/api") ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;
}

export function resolveRealtimeBaseUrl() {
  const apiBaseUrl = resolveApiBaseUrl();
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
}
