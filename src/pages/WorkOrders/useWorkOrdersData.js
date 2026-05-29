import { useCallback, useEffect, useMemo, useState } from "react";
import { listAssetsApi } from "../../services/asset.api";
import { listWorkOrdersApi } from "../../services/workOrder.api";
import { listUsersApi } from "../../services/user.api";
import { normalizeListResponse } from "../../utils/listResponse";
import {
  PAGE_SIZE,
  buildWorkOrderNotifications,
  buildWorkOrderStats,
  filterWorkOrders,
} from "./helpers";
import { useWorkOrdersRealtime } from "./useWorkOrdersRealtime";

export function useWorkOrdersData({
  user,
  debouncedSearch,
  statusFilter,
  assetFilter,
  page,
  smartFilters,
}) {
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const smartPriority = smartFilters.priority;
  const smartWoType = smartFilters.woType;
  const smartTriggerSource = smartFilters.triggerSource;
  const hasClientOnlyFilters = Boolean(
    smartFilters.onlyMine || smartFilters.overdueOnly || smartFilters.actionableOnly
  );

  const loadAssets = useCallback(async () => {
    try {
      const res = await listAssetsApi();
      setAssets(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setAssets([]);
    }
  }, []);

  const loadTechnicians = useCallback(async () => {
    if (user?.role !== "admin") {
      setTechnicians([]);
      return;
    }
    try {
      const res = await listUsersApi();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setTechnicians(rows.filter((item) => item?.role === "technician" && item?.isActive));
    } catch {
      setTechnicians([]);
    }
  }, [user?.role]);

  const loadWorkOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (assetFilter) params.assetId = assetFilter;
      if (debouncedSearch.trim()) params.keyword = debouncedSearch.trim();
      if (smartPriority) params.priority = smartPriority;
      if (smartWoType) params.woType = smartWoType;
      if (smartTriggerSource) params.triggerSource = smartTriggerSource;
      if (!hasClientOnlyFilters) {
        params.paginated = true;
        params.page = page;
        params.limit = PAGE_SIZE;
      }

      const res = await listWorkOrdersApi(params);
      const { items, pagination } = normalizeListResponse(res);
      setWorkOrders(items);
      if (pagination && !hasClientOnlyFilters) {
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.total || 0);
      } else {
        setTotalPages(Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
        setTotalItems(items.length);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không tải được lệnh công việc");
      setWorkOrders([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [
    statusFilter,
    assetFilter,
    debouncedSearch,
    page,
    hasClientOnlyFilters,
    smartPriority,
    smartWoType,
    smartTriggerSource,
  ]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadAssets();
    });
  }, [loadAssets]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadTechnicians();
    });
  }, [loadTechnicians]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadWorkOrders();
    });
  }, [loadWorkOrders]);

  useWorkOrdersRealtime(() => loadWorkOrders({ silent: true }));

  const clientSmartFilters = useMemo(
    () => ({
      ...smartFilters,
      priority: "",
      woType: "",
      triggerSource: "",
    }),
    [smartFilters]
  );
  const filteredRows = useMemo(
    () => filterWorkOrders(workOrders, { search: debouncedSearch, smartFilters: clientSmartFilters, user }),
    [debouncedSearch, workOrders, clientSmartFilters, user]
  );

  const effectiveTotalPages = hasClientOnlyFilters
    ? Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
    : totalPages;
  const effectiveTotalItems = hasClientOnlyFilters ? filteredRows.length : totalItems;
  const safePage = Math.min(page, effectiveTotalPages);
  const pageRows = hasClientOnlyFilters
    ? filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : filteredRows;

  const stats = useMemo(() => buildWorkOrderStats(workOrders), [workOrders]);
  const notifications = useMemo(() => buildWorkOrderNotifications(stats), [stats]);

  return {
    workOrders,
    assets,
    technicians,
    loading,
    error,
    filteredRows,
    pageRows,
    totalPages: effectiveTotalPages,
    totalItems: effectiveTotalItems,
    safePage,
    stats,
    notifications,
    loadWorkOrders,
  };
}
