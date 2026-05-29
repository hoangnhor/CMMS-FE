import { useEffect } from "react";
import { useAuthStore } from "../store/authStore.js";
import { computeNextDelay } from "../utils/sessionBackoff.js";

export function useSessionKeeper() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const userId = useAuthStore((state) => state.user?._id || null);
  const refreshFailures = useAuthStore((state) => state.refreshFailures || 0);
  const refreshSession = useAuthStore((state) => state.refreshSession);

  useEffect(() => {
    if (!hydrated || !userId) return undefined;

    let stopped = false;
    let timer = null;

    const scheduleNext = () => {
      const delay = computeNextDelay(useAuthStore.getState().refreshFailures || 0);
      timer = setTimeout(async () => {
        if (stopped) return;
        await refreshSession();
        if (!stopped) scheduleNext();
      }, delay);
    };

    const runImmediate = async () => {
      await refreshSession();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        runImmediate();
      }
    };

    const onFocus = () => {
      runImmediate();
    };

    scheduleNext();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [hydrated, userId, refreshFailures, refreshSession]);
}
