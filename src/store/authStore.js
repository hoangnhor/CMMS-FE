import { create } from "zustand";
import { meApi, refreshApi } from "../services/auth.api.js";
import { clearStoredCsrfToken, setStoredCsrfToken } from "../utils/csrfToken.js";

const SESSION_HINT_KEY = "am_has_session";

function hasSessionHint() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function setSessionHint(value) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      localStorage.setItem(SESSION_HINT_KEY, "1");
    } else {
      localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

function emitAuthMetric(event, payload = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("am.auth.metric", { detail: { event, ...payload } }));
}

export const useAuthStore = create((set) => ({
  user: null,
  hydrated: false,
  refreshing: false,
  refreshFailures: 0,
  setAuth: ({ user }) => {
    setSessionHint(Boolean(user?._id));
    set({ user: user || null, hydrated: true, refreshFailures: 0 });
  },
  logout: () => {
    clearStoredCsrfToken();
    setSessionHint(false);
    set({ user: null, hydrated: true, refreshing: false, refreshFailures: 0 });
  },
  hydrate: async () => {
    try {
      if (!hasSessionHint()) {
        set({ user: null, hydrated: true, refreshing: false, refreshFailures: 0 });
        return;
      }

      const response = await meApi();
      setStoredCsrfToken(response?.data?.csrfToken || "");
      setSessionHint(Boolean(response?.data?.user?._id));
      set({
        user: response?.data?.user || null,
        hydrated: true,
        refreshing: false,
        refreshFailures: 0,
      });
    } catch {
      try {
        const refreshResponse = await refreshApi();
        setStoredCsrfToken(refreshResponse?.data?.csrfToken || "");
        setSessionHint(Boolean(refreshResponse?.data?.user?._id));
        const response = await meApi();
        setStoredCsrfToken(response?.data?.csrfToken || "");
        setSessionHint(Boolean(response?.data?.user?._id));
        set({
          user: response?.data?.user || null,
          hydrated: true,
          refreshing: false,
          refreshFailures: 0,
        });
      } catch {
        clearStoredCsrfToken();
        set({ user: null, hydrated: true, refreshing: false, refreshFailures: 0 });
      }
    }
  },
  refreshSession: async () => {
    if (useAuthStore.getState().refreshing) return;

    set({ refreshing: true });
    try {
      const refreshResponse = await refreshApi();
      setStoredCsrfToken(refreshResponse?.data?.csrfToken || "");
      setSessionHint(Boolean(refreshResponse?.data?.user?._id));
      const response = await meApi();
      setStoredCsrfToken(response?.data?.csrfToken || "");
      setSessionHint(Boolean(response?.data?.user?._id));
      set({
        user: response?.data?.user || null,
        hydrated: true,
        refreshing: false,
        refreshFailures: 0,
      });
      emitAuthMetric("refresh_success");
      return true;
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 401 || status === 403) {
        clearStoredCsrfToken();
        setSessionHint(false);
        set({
          user: null,
          hydrated: true,
          refreshing: false,
          refreshFailures: 0,
        });
        emitAuthMetric("refresh_unauthorized", { status });
        return false;
      }

      const failures = Number(useAuthStore.getState().refreshFailures || 0) + 1;
      set({
        user: useAuthStore.getState().user,
        hydrated: true,
        refreshing: false,
        refreshFailures: failures,
      });
      emitAuthMetric("refresh_network_error", { failures });
      return false;
    }
  },
}));
