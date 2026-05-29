import { useEffect } from "react";
import { subscribeRealtime } from "../../services/realtime";

export function useWorkOrdersRealtime(onReload) {
  useEffect(() => {
    let timeoutId = null;
    const onChanged = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        onReload();
      }, 250);
    };
    const unsub = subscribeRealtime(["work_order.changed"], onChanged);
    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onReload]);
}
