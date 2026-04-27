import { useCallback, useEffect, useMemo, useState } from "react";
import { listAssetsApi } from "../services/asset.api";
import { subscribeRealtime } from "../services/realtime";
import { listWorkOrdersApi } from "../services/workOrder.api";

const REALTIME_INTERVAL_MS = 15000;

function toDateKey(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildLast7Days() {
  const now = new Date();
  const items = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString("vi-VN", { weekday: "short" });
    items.push({
      key: toDateKey(d),
      label,
      completed: 0,
      inProgress: 0,
    });
  }
  return items;
}

function normalizeDashboard(assets, workOrders) {
  const totalAssets = assets.length;
  const activeAssets = assets.filter((item) => item.status === "active").length;
  const inRepairAssets = assets.filter((item) => item.status === "in_repair").length;
  const idleAssets = assets.filter((item) => item.status === "idle").length;

  const maintenanceNeeded = inRepairAssets + idleAssets;
  const openOrders = workOrders.filter((item) => item.status !== "done").length;

  const now = new Date();
  const overdueOrders = workOrders.filter((item) => {
    if (item.status === "done") return false;
    if (!item.scheduledDate) return false;
    const scheduled = new Date(item.scheduledDate);
    return !Number.isNaN(scheduled.getTime()) && scheduled < now;
  }).length;

  const chart = buildLast7Days();
  const chartMap = Object.fromEntries(chart.map((item) => [item.key, item]));

  workOrders.forEach((wo) => {
    const doneKey = toDateKey(wo.completedAt);
    if (doneKey && chartMap[doneKey]) {
      chartMap[doneKey].completed += 1;
    }

    const inProgressKey = toDateKey(wo.startedAt || wo.createdAt);
    if (wo.status === "in_progress" && inProgressKey && chartMap[inProgressKey]) {
      chartMap[inProgressKey].inProgress += 1;
    }
  });

  const maxBarValue = Math.max(1, ...chart.map((item) => item.completed + item.inProgress));

  const toPercent = (value) => {
    if (!totalAssets) return 0;
    return Number(((value / totalAssets) * 100).toFixed(1));
  };

  const goodPct = toPercent(activeAssets);
  const errorPct = toPercent(inRepairAssets);
  const warningPct = Number((100 - goodPct - errorPct).toFixed(1));

  return {
    stats: {
      totalAssets,
      activeAssets,
      maintenanceNeeded,
      openOrders,
      overdueOrders,
      activeRate: totalAssets ? ((activeAssets / totalAssets) * 100).toFixed(1) : "0.0",
    },
    chart,
    maxBarValue,
    donut: {
      totalAssets,
      goodPct,
      warningPct,
      errorPct,
    },
    allWorkOrders: workOrders,
    recentWorkOrders: workOrders.slice(0, 5),
  };
}

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const [assetsRes, workOrdersRes] = await Promise.all([listAssetsApi(), listWorkOrdersApi()]);

      setAssets(Array.isArray(assetsRes?.data) ? assetsRes.data : []);
      setWorkOrders(Array.isArray(workOrdersRes?.data) ? workOrdersRes.data : []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không tải được dữ liệu dashboard");
      setAssets([]);
      setWorkOrders([]);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        load({ silent: true });
      }
    }, REALTIME_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        load({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [load]);

  useEffect(() => {
    let timeoutId = null;
    const onRealtimeChanged = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        load({ silent: true });
      }, 250);
    };

    const unsubscribe = subscribeRealtime(
      ["asset.changed", "work_order.changed", "pm_schedule.changed", "maintenance_log.changed"],
      onRealtimeChanged
    );

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [load]);

  const dashboard = useMemo(() => normalizeDashboard(assets, workOrders), [assets, workOrders]);

  return {
    loading,
    refreshing,
    error,
    reload: load,
    lastUpdatedAt,
    ...dashboard,
  };
}

