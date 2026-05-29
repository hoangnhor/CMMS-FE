import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { resolveApiBaseUrl } from "../utils/apiBase";

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
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
  const csrfToken = readCookie(csrfCookieName);
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
          );
        await refreshPromise;
        return api(originalConfig);
      } catch {
        useAuthStore.getState().logout();
      } finally {
        refreshPromise = null;
      }
    } else if (status === 401 && authExcluded) {
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
