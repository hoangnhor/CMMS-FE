import { useEffect } from "react";
import api from "../services/api";

const KEEPALIVE_INTERVAL_MS = 13 * 60 * 1000;

export function useBackendKeepAlive() {
  useEffect(() => {
    let stopped = false;
    let timer = null;
    let inFlight = null;

    const ping = async () => {
      if (stopped) return;
      if (inFlight) return inFlight;

      inFlight = api.get("/health", {
        headers: {
          "x-no-cache": "1",
        },
      })
        .catch(() => null)
        .finally(() => {
          inFlight = null;
        });

      return inFlight;
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (stopped) return;
        if (document.visibilityState === "visible") {
          await ping();
        }
        if (!stopped) schedule();
      }, KEEPALIVE_INTERVAL_MS);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        ping();
      }
    };

    const onFocus = () => {
      ping();
    };

    ping();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}
