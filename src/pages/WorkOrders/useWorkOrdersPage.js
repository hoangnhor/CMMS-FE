import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logoutApi } from "../../services/auth.api";
import {
  PAGE_SIZE,
  countActiveSmartFilters,
} from "./helpers";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useWorkOrdersData } from "./useWorkOrdersData";
import { useWorkOrdersUiState } from "./useWorkOrdersUiState";
import { useWorkOrdersActions } from "./useWorkOrdersActions";

export function useWorkOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const canCreateWorkOrder = ["admin", "site_manager", "technician"].includes(user?.role);

  const ui = useWorkOrdersUiState();
  const {
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
    setActionModal,
    modalLoading,
    setModalLoading,
    modalError,
    setModalError,
    showCreateModal,
    setShowCreateModal,
    createError,
    setCreateError,
    createLoading,
    setCreateLoading,
    submitModal,
    setSubmitModal,
    approveModal,
    setApproveModal,
    rejectModal,
    setRejectModal,
    completeModal,
    setCompleteModal,
    notice,
    setNotice,
    editModal,
    setEditModal,
    createForm,
    setCreateForm,
    notificationsRef,
  } = ui;
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    workOrders,
    assets,
    technicians,
    loading,
    error,
    filteredRows,
    pageRows,
    totalPages,
    totalItems,
    safePage,
    stats,
    notifications,
    loadWorkOrders,
  } = useWorkOrdersData({
    user,
    debouncedSearch,
    statusFilter,
    assetFilter,
    page,
    smartFilters,
  });

  useEffect(() => {
    const onClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showNotifications, notificationsRef, setShowNotifications]);

  const smartFilterCount = useMemo(() => countActiveSmartFilters(smartFilters), [smartFilters]);
  const goPage = (value) => {
    const next = Math.max(1, Math.min(totalPages, value));
    setPage(next);
  };

  useEffect(() => {
    if (!notice.text) return undefined;
    const timer = setTimeout(() => setNotice({ type: "", text: "" }), 3500);
    return () => clearTimeout(timer);
  }, [notice.text, setNotice]);

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
  } = useWorkOrdersActions({
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
    totalItems,
    pageSize: PAGE_SIZE,
    safePage,
    totalPages,
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
