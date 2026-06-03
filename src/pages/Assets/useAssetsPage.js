import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { listAssetsApi } from "../../services/asset.api";
import { logoutApi } from "../../services/auth.api";
import { subscribeRealtime } from "../../services/realtime";
import {
  PAGE_SIZE,
  buildAdvancedFilters,
  buildAssetNotifications,
  buildCreateAssetForm,
  buildDeleteModalState,
  buildEditAssetForm,
  escapeCsvValue,
  filterAssets,
  mapStatusLabel,
  mapTypeLabel,
  mapNotificationTone,
} from "./helpers";
import { buildAssetPageActions } from "./actions";
import { normalizeListResponse } from "../../utils/listResponse";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { readQueryCache } from "../../utils/queryCache";

export function useAssetsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const canManageAssets = ["admin", "site_manager"].includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({ active: 0, in_repair: 0, idle: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [deleteModal, setDeleteModal] = useState(buildDeleteModalState);
  const [createForm, setCreateForm] = useState(buildCreateAssetForm);
  const [editForm, setEditForm] = useState(buildEditAssetForm);
  const [advancedFilters, setAdvancedFilters] = useState(buildAdvancedFilters);
  const notificationsRef = useRef(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const loadAssets = useCallback(async ({ silent = false } = {}) => {
    let usedCachedSnapshot = false;
    try {
      if (!silent) setLoading(true);
      setError("");
      const keyword = debouncedSearch.trim();
      const requestParams = {
        paginated: true,
        page,
        limit: PAGE_SIZE,
        assetType: typeFilter || undefined,
        status: statusFilter || undefined,
        keyword: keyword || undefined,
        manufacturer: advancedFilters.manufacturer.trim() || undefined,
        location: advancedFilters.location.trim() || undefined,
        minPrice: advancedFilters.minPrice.trim() || undefined,
        maxPrice: advancedFilters.maxPrice.trim() || undefined,
      };
      const cachedAssets = readQueryCache("GET", "/assets", { params: requestParams });
      if (cachedAssets) {
        usedCachedSnapshot = true;
        const cachedParsed = normalizeListResponse(cachedAssets);
        setAssets(cachedParsed.items);
        if (cachedParsed.pagination) {
          setTotalPages(cachedParsed.pagination.totalPages || 1);
          setTotalItems(cachedParsed.pagination.total || 0);
          const summaryData = cachedAssets?.data?.summary || {};
          setSummary({
            active: Number(summaryData.active) || 0,
            in_repair: Number(summaryData.in_repair) || 0,
            idle: Number(summaryData.idle) || 0,
          });
        }
        if (!silent) setLoading(false);
      }

      const res = await listAssetsApi(requestParams);
      const { items, pagination } = normalizeListResponse(res);
      setAssets(items);
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.total || 0);
        const summaryData = res?.data?.summary || {};
        setSummary({
          active: Number(summaryData.active) || 0,
          in_repair: Number(summaryData.in_repair) || 0,
          idle: Number(summaryData.idle) || 0,
        });
      }
    } catch (err) {
      if (!usedCachedSnapshot) {
        setError(err?.response?.data?.message || err?.message || "Không tải được dữ liệu tài sản");
        setAssets([]);
        setTotalPages(1);
        setTotalItems(0);
        setSummary({ active: 0, in_repair: 0, idle: 0 });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, statusFilter, advancedFilters]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadAssets();
    });
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    return filterAssets(assets, { search: "", typeFilter: "", statusFilter: "", advancedFilters: buildAdvancedFilters() });
  }, [assets]);

  const effectiveTotalItems = totalItems;
  const effectiveTotalPages = totalPages;
  const safePage = Math.min(page, effectiveTotalPages);
  const pagedAssets = filteredAssets;

  const totalAssets = effectiveTotalItems;
  const activeAssets = summary.active;
  const repairAssets = summary.in_repair;
  const idleAssets = summary.idle;

  const notifications = useMemo(() => {
    return buildAssetNotifications({ activeAssets, repairAssets, idleAssets }).map(mapNotificationTone);
  }, [activeAssets, repairAssets, idleAssets]);

  const handleLogout = async (event) => {
    event.preventDefault();
    try {
      await logoutApi();
    } catch {
      // ignore network/API logout errors and clear local session anyway
    }
    logout();
    navigate("/auth", { replace: true });
  };

  const goPage = (value) => {
    const next = Math.max(1, Math.min(effectiveTotalPages, value));
    setPage(next);
  };

  const resetAdvancedFilters = () => {
    setPage(1);
    setAdvancedFilters(buildAdvancedFilters());
  };

  const exportCsv = () => {
    const headers = ["Mã tài sản", "Tên tài sản", "Loại", "Trạng thái", "Vị trí", "Hãng", "Model", "Serial", "Giá trị"];
    const rows = filteredAssets.map((item) => [
      item.assetCode || "",
      item.name || "",
      mapTypeLabel(item.assetType || ""),
      mapStatusLabel(item.status || "").text,
      item.location || "",
      item.manufacturer || "",
      item.model || "",
      item.serialNumber || "",
      item.purchasePrice ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assets_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    let timeoutId = null;
    const onRealtimeChanged = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        loadAssets({ silent: true });
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
  }, [loadAssets]);

  useEffect(() => {
    if (!notice.text) return undefined;
    const timer = setTimeout(() => setNotice({ type: "", text: "" }), 3500);
    return () => clearTimeout(timer);
  }, [notice.text]);

  const {
    openCreateModal,
    closeCreateModal,
    openViewModal,
    openEditModal,
    submitEditAsset,
    openDeleteModal,
    closeDeleteModal,
    removeAsset,
    submitCreateAsset,
    closeActionModal,
  } = buildAssetPageActions({
    canManageAssets,
    setAssets,
    setNotice,
    setModalError,
    setModalLoading,
    setActionModal,
    setCreateError,
    setCreateLoading,
    setCreateForm,
    setShowCreateModal,
    deleteModal,
    setDeleteModal,
    editForm,
    setEditForm,
    actionModal,
    createForm,
  });

  return {
    user,
    canManageAssets,
    loading,
    error,
    assets,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    showNotifications,
    setShowNotifications,
    showHelp,
    setShowHelp,
    showAdvancedFilter,
    setShowAdvancedFilter,
    actionModal,
    modalLoading,
    modalError,
    showCreateModal,
    createLoading,
    createError,
    notice,
    setNotice,
    deleteModal,
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    advancedFilters,
    setAdvancedFilters,
    notificationsRef,
    notifications,
    filteredAssets,
    totalItems: effectiveTotalItems,
    pageSize: PAGE_SIZE,
    safePage,
    totalPages: effectiveTotalPages,
    pagedAssets,
    totalAssets,
    activeAssets,
    repairAssets,
    idleAssets,
    handleLogout,
    goPage,
    resetAdvancedFilters,
    exportCsv,
    openCreateModal,
    closeCreateModal,
    openViewModal,
    openEditModal,
    submitEditAsset,
    openDeleteModal,
    closeDeleteModal,
    removeAsset,
    submitCreateAsset,
    closeActionModal,
  };
}
