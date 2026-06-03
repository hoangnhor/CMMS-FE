import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { resolveApiBaseUrl } from "../utils/apiBase";
import { clearStoredCsrfToken, getStoredCsrfToken, setStoredCsrfToken } from "../utils/csrfToken";

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const csrfCookieName = "am_csrf";
let refreshPromise = null;

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const encodedName = `${encodeURIComponent(name)}=`;
  const hit = document.cookie.split("; ").find((item) => item.startsWith(encodedName));
  if (!hit) return "";
  return decodeURIComponent(hit.slice(encodedName.length));
}

function buildCsrfHeaders() {
  const csrfToken = getStoredCsrfToken() || readCookie(csrfCookieName);
  return csrfToken ? { "x-csrf-token": csrfToken } : {};
}

function isUnsafeMethod(method) {
  const normalized = String(method || "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalized);
}

api.interceptors.request.use((config) => {
  if (isUnsafeMethod(config.method)) {
    config.headers = {
      ...(config.headers || {}),
      ...buildCsrfHeaders(),
    };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = Number(error?.response?.status || 0);
    const originalConfig = error?.config || {};
    const requestUrl = String(originalConfig?.url || "");
    const authExcluded =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/me") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout");

    if (status === 401 && !originalConfig._retry && !authExcluded) {
      originalConfig._retry = true;
      try {
        refreshPromise =
          refreshPromise ||
          axios.post(
            `${resolveApiBaseUrl()}/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json",
                ...buildCsrfHeaders(),
              },
            }
          ).then((response) => {
            const nextCsrfToken = response?.data?.data?.csrfToken || "";
            if (nextCsrfToken) setStoredCsrfToken(nextCsrfToken);
            return response;
          });
        await refreshPromise;
        return api(originalConfig);
      } catch {
        clearStoredCsrfToken();
        useAuthStore.getState().logout();
      } finally {
        refreshPromise = null;
      }
    } else if (status === 401 && authExcluded) {
      clearStoredCsrfToken();
      useAuthStore.getState().logout();
    }

    if (!error?.response) {
      error.message =
        "Không kết nối được API. Kiểm tra VITE_API_BASE_URL hoặc VITE_USE_SAME_ORIGIN_API và cấu hình reverse proxy /api.";
    }
    return Promise.reject(error);
  }
);

export default api;
