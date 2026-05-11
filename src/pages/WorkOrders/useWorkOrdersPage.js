import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { listAssetsApi } from "../../services/asset.api";
import { listWorkOrdersApi } from "../../services/workOrder.api";
import { listUsersApi } from "../../services/user.api";
import { subscribeRealtime } from "../../services/realtime";
import {
  PAGE_SIZE,
  buildApproveModal,
  buildCompleteModal,
  buildCreateWorkOrderForm,
  buildEditWorkOrderModal,
  buildRejectModal,
  buildSmartFilters,
  buildSubmitModal,
  buildWorkOrderNotifications,
  buildWorkOrderStats,
  countActiveSmartFilters,
  filterWorkOrders,
} from "./helpers";
import { buildWorkOrderPageActions } from "./actions";
import { normalizeListResponse } from "../../utils/listResponse";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export function useWorkOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const canCreateWorkOrder = ["admin", "site_manager", "technician"].includes(user?.role);

  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showSmartFilter, setShowSmartFilter] = useState(false);
  const [smartFilters, setSmartFilters] = useState(buildSmartFilters);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [submitModal, setSubmitModal] = useState(buildSubmitModal);
  const [approveModal, setApproveModal] = useState(buildApproveModal);
  const [rejectModal, setRejectModal] = useState(buildRejectModal);
  const [completeModal, setCompleteModal] = useState(buildCompleteModal);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [editModal, setEditModal] = useState(buildEditWorkOrderModal);
  const [createForm, setCreateForm] = useState(buildCreateWorkOrderForm);
  const notificationsRef = useRef(null);
  const debouncedSearch = useDebouncedValue(search, 300);

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
      params.paginated = true;
      params.page = page;
      params.limit = PAGE_SIZE;
      const res = await listWorkOrdersApi(params);
      const { items, pagination } = normalizeListResponse(res);
      setWorkOrders(items);
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.total || 0);
      } else {
        setTotalPages(1);
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
  }, [statusFilter, assetFilter, debouncedSearch, page]);

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

  useEffect(() => {
    const onClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    let timeoutId = null;
    const onChanged = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        loadWorkOrders({ silent: true });
      }, 250);
    };
    const unsub = subscribeRealtime(["work_order.changed"], onChanged);
    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadWorkOrders]);

  const filteredRows = useMemo(() => filterWorkOrders(workOrders, { search: debouncedSearch, smartFilters, user }), [debouncedSearch, workOrders, smartFilters, user]);
  const smartFilterCount = useMemo(() => countActiveSmartFilters(smartFilters), [smartFilters]);
  const hasClientOnlyFilters = smartFilterCount > 0;

  const effectiveTotalPages = hasClientOnlyFilters ? 1 : totalPages;
  const effectiveTotalItems = hasClientOnlyFilters ? filteredRows.length : totalItems;
  const safePage = Math.min(page, effectiveTotalPages);
  const pageRows = filteredRows;
  const goPage = (value) => {
    const next = Math.max(1, Math.min(effectiveTotalPages, value));
    setPage(next);
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, assetFilter, debouncedSearch]);

  useEffect(() => {
    if (!notice.text) return undefined;
    const timer = setTimeout(() => setNotice({ type: "", text: "" }), 3500);
    return () => clearTimeout(timer);
  }, [notice.text]);

  const stats = useMemo(() => buildWorkOrderStats(workOrders), [workOrders]);
  const notifications = useMemo(() => buildWorkOrderNotifications(stats), [stats]);

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate("/auth", { replace: true });
  };

  const {
    openSubmitModal,
    closeSubmitModal,
    submitForApproval,
    openApproveModal,
    closeApproveModal,
    submitApproveModal,
    openRejectModal,
    closeRejectModal,
    submitRejectModal,
    start,
    openCompleteModal,
    closeCompleteModal,
    submitCompleteModal,
    signOff,
    openEditModal,
    closeEditModal,
    submitEditModal,
    openDetail,
    closeActionModal,
    openCreate,
    createWorkOrder,
  } = buildWorkOrderPageActions({
    user,
    canCreateWorkOrder,
    assets,
    technicians,
    loadWorkOrders,
    submitModal,
    setSubmitModal,
    approveModal,
    setApproveModal,
    rejectModal,
    setRejectModal,
    completeModal,
    setCompleteModal,
    editModal,
    setEditModal,
    createForm,
    setCreateForm,
    setCreateError,
    setCreateLoading,
    setShowCreateModal,
    setNotice,
    setActionModal,
    setModalLoading,
    setModalError,
  });

  return {
    user,
    canCreateWorkOrder,
    workOrders,
    assets,
    technicians,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    assetFilter,
    setAssetFilter,
    page,
    setPage,
    showSmartFilter,
    setShowSmartFilter,
    smartFilters,
    setSmartFilters,
    showNotifications,
    setShowNotifications,
    showHelp,
    setShowHelp,
    actionModal,
    modalLoading,
    modalError,
    showCreateModal,
    setShowCreateModal,
    createError,
    setCreateError,
    createLoading,
    submitModal,
    closeSubmitModal,
    submitForApproval,
    approveModal,
    setApproveModal,
    closeApproveModal,
    submitApproveModal,
    rejectModal,
    setRejectModal,
    closeRejectModal,
    submitRejectModal,
    completeModal,
    setCompleteModal,
    closeCompleteModal,
    submitCompleteModal,
    notice,
    setNotice,
    editModal,
    setEditModal,
    closeEditModal,
    submitEditModal,
    createForm,
    setCreateForm,
    notificationsRef,
    filteredRows,
    totalItems: effectiveTotalItems,
    pageSize: PAGE_SIZE,
    safePage,
    totalPages: effectiveTotalPages,
    pageRows,
    goPage,
    stats,
    notifications,
    smartFilterCount,
    handleLogout,
    openSubmitModal,
    openApproveModal,
    openRejectModal,
    start,
    openCompleteModal,
    signOff,
    openEditModal,
    openDetail,
    closeActionModal,
    openCreate,
    createWorkOrder,
  };
}
