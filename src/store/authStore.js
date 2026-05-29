import { create } from "zustand";
import { meApi, refreshApi } from "../services/auth.api.js";

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
    set({ user: user || null, hydrated: true, refreshFailures: 0 });
  },
  logout: () => {
    set({ user: null, hydrated: true, refreshing: false, refreshFailures: 0 });
  },
  hydrate: async () => {
    try {
      const response = await meApi();
      set({
        user: response?.data || null,
        hydrated: true,
        refreshing: false,
        refreshFailures: 0,
      });
    } catch {
      try {
        await refreshApi();
        const response = await meApi();
        set({
          user: response?.data || null,
          hydrated: true,
          refreshing: false,
          refreshFailures: 0,
        });
      } catch {
        set({ user: null, hydrated: true, refreshing: false, refreshFailures: 0 });
      }
    }
  },
  refreshSession: async () => {
    if (useAuthStore.getState().refreshing) return;

    set({ refreshing: true });
    try {
      await refreshApi();
      const response = await meApi();
      set({
        user: response?.data || null,
        hydrated: true,
        refreshing: false,
        refreshFailures: 0,
      });
      emitAuthMetric("refresh_success");
      return true;
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 401 || status === 403) {
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
