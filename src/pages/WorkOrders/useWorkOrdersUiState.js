import { useRef, useState } from "react";
import {
  buildApproveModal,
  buildCompleteModal,
  buildCreateWorkOrderForm,
  buildEditWorkOrderModal,
  buildRejectModal,
  buildSmartFilters,
  buildSubmitModal,
} from "./helpers";

export function useWorkOrdersUiState() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [page, setPage] = useState(1);
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

  return {
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
  };
}
