import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuthStore } from "../../store/authStore";
import { listAssetsApi } from "../../services/asset.api";
import {
  approveWorkOrderApi,
  completeWorkOrderApi,
  createWorkOrderApi,
  getWorkOrderByIdApi,
  listWorkOrdersApi,
  rejectWorkOrderApi,
  signOffWorkOrderApi,
  startWorkOrderApi,
  submitWorkOrderApi,
  updateWorkOrderApi,
} from "../../services/workOrder.api";
import { listUsersApi } from "../../services/user.api";
import { subscribeRealtime } from "../../services/realtime";
import { getInitials } from "../../utils/userDisplay";
import { PAGE_SIZE, buildCreateWorkOrderForm, buildTitle, canApprove, canComplete, canEdit, canSignOff, canStart, mapAssetIcon, mapPriority, mapStatus, mapTriggerLabel, mapTypeLabel, toDisplayDate, toInputDate } from "./helpers";
import "./style.css";

function WorkOrdersPage() {
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
  const [showSmartFilter, setShowSmartFilter] = useState(false);
  const [smartFilters, setSmartFilters] = useState({
    priority: "",
    woType: "",
    triggerSource: "",
    onlyMine: false,
    overdueOnly: false,
    actionableOnly: false,
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [submitModal, setSubmitModal] = useState({ open: false, loading: false, error: "", item: null });
  const [approveModal, setApproveModal] = useState({
    open: false,
    loading: false,
    error: "",
    item: null,
    assignedTo: "",
  });
  const [rejectModal, setRejectModal] = useState({
    open: false,
    loading: false,
    error: "",
    item: null,
    reason: "",
  });
  const [completeModal, setCompleteModal] = useState({
    open: false,
    loading: false,
    error: "",
    item: null,
    laborHours: "0",
    findings: "",
  });
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [editModal, setEditModal] = useState({
    open: false,
    loading: false,
    error: "",
    item: null,
    form: {
      assetId: "",
      woType: "CM",
      triggerSource: "production_request",
      priority: "medium",
      scheduledDate: "",
    },
  });
  const [createForm, setCreateForm] = useState(buildCreateWorkOrderForm);
  const notificationsRef = useRef(null);

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
      const res = await listWorkOrdersApi(params);
      setWorkOrders(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không tải được lệnh công việc");
      setWorkOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, assetFilter]);

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

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const now = Date.now();
    return workOrders.filter((item) => {
      const text = [
        item.woCode,
        item.assetId?.assetCode,
        item.assetId?.name,
        item.assignedTo?.name,
        item.createdBy?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (keyword && !text.includes(keyword)) return false;
      if (smartFilters.priority && item.priority !== smartFilters.priority) return false;
      if (smartFilters.woType && item.woType !== smartFilters.woType) return false;
      if (smartFilters.triggerSource && item.triggerSource !== smartFilters.triggerSource) return false;
      if (smartFilters.onlyMine) {
        const mine = String(user?._id || "");
        const creator = String(item.createdBy?._id || item.createdBy || "");
        const assignee = String(item.assignedTo?._id || item.assignedTo || "");
        if (mine !== creator && mine !== assignee) return false;
      }
      if (smartFilters.overdueOnly) {
        const due = item?.scheduledDate ? new Date(item.scheduledDate).getTime() : null;
        if (!due || Number.isNaN(due) || due >= now) return false;
        if (["done", "rejected"].includes(item.status)) return false;
      }
      if (smartFilters.actionableOnly) {
        const hasAction = canEdit(user, item)
          || canApprove(user, item)
          || canStart(user, item)
          || canComplete(user, item)
          || canSignOff(user, item);
        if (!hasAction) return false;
      }
      return true;
    });
  }, [search, workOrders, smartFilters, user]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, assetFilter, smartFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const goPage = (value) => {
    const next = Math.max(1, Math.min(totalPages, value));
    setPage(next);
  };

  const stats = useMemo(() => {
    const inProgress = workOrders.filter((item) => item.status === "in_progress").length;
    const pending = workOrders.filter((item) => item.status === "pending_approval").length;
    const done = workOrders.filter((item) => item.status === "done").length;
    const urgentOpen = workOrders.filter((item) => item.priority === "urgent" && !["done", "rejected"].includes(item.status)).length;
    const doneRate = workOrders.length ? Math.round((done / workOrders.length) * 100) : 0;
    const todayNew = workOrders.filter((item) => {
      const d = new Date(item._id?.toString().slice(0, 8).replace(/(..)(..)(..)(..)/, "$1-$2-$3-$4"));
      return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
    }).length;
    return { inProgress, pending, doneRate, urgentOpen, todayNew };
  }, [workOrders]);

  const notifications = useMemo(() => {
    const rows = [];
    if (stats.pending > 0) rows.push({ id: "pending", tone: "bg-amber-50 text-amber-700", text: `Có ${stats.pending} lệnh đang chờ phê duyệt.` });
    if (stats.urgentOpen > 0) rows.push({ id: "urgent", tone: "bg-red-50 text-red-700", text: `Có ${stats.urgentOpen} lệnh khẩn cấp đang mở.` });
    if (stats.inProgress > 0) rows.push({ id: "running", tone: "bg-emerald-50 text-emerald-700", text: `${stats.inProgress} lệnh đang thực hiện.` });
    return rows;
  }, [stats]);

  const smartFilterCount = useMemo(() => {
    let count = 0;
    if (smartFilters.priority) count += 1;
    if (smartFilters.woType) count += 1;
    if (smartFilters.triggerSource) count += 1;
    if (smartFilters.onlyMine) count += 1;
    if (smartFilters.overdueOnly) count += 1;
    if (smartFilters.actionableOnly) count += 1;
    return count;
  }, [smartFilters]);

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate("/auth", { replace: true });
  };

  const openSubmitModal = (item) => {
    setSubmitModal({ open: true, loading: false, error: "", item });
  };

  const closeSubmitModal = () => {
    setSubmitModal({ open: false, loading: false, error: "", item: null });
  };

  const showNotice = (type, text) => {
    setNotice({ type, text });
  };

  const submitForApproval = async () => {
    if (!submitModal.item?._id || submitModal.loading) return;
    try {
      setSubmitModal((prev) => ({ ...prev, loading: true, error: "" }));
      await submitWorkOrderApi(submitModal.item._id);
      closeSubmitModal();
      await loadWorkOrders();
    } catch (err) {
      setSubmitModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || err?.message || "Gửi duyệt thất bại",
      }));
    }
  };

  const approve = async (item, assignedTo = null) => {
    try {
      const payload = {};
      if (item.priority !== "urgent") {
        payload.assignedTo = assignedTo || user?._id;
      }
      await approveWorkOrderApi(item._id, payload);
      await loadWorkOrders();
      showNotice("success", "Đã duyệt lệnh công việc.");
      return true;
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Duyệt thất bại");
      return false;
    }
  };

  const openApproveModal = (item) => {
    if (user?.role === "admin" && item?.priority !== "urgent") {
      setApproveModal({
        open: true,
        loading: false,
        error: "",
        item,
        assignedTo: technicians[0]?._id || "",
      });
      return;
    }
    approve(item);
  };

  const closeApproveModal = () => {
    setApproveModal({ open: false, loading: false, error: "", item: null, assignedTo: "" });
  };

  const submitApproveModal = async () => {
    if (!approveModal.item?._id || approveModal.loading) return;
    if (!approveModal.assignedTo) {
      setApproveModal((prev) => ({ ...prev, error: "Vui lòng chọn kỹ thuật viên." }));
      return;
    }
    try {
      setApproveModal((prev) => ({ ...prev, loading: true, error: "" }));
      const ok = await approve(approveModal.item, approveModal.assignedTo);
      if (ok) {
        closeApproveModal();
      } else {
        setApproveModal((prev) => ({ ...prev, loading: false, error: "Không thể duyệt lệnh. Vui lòng kiểm tra lại." }));
      }
    } catch {
      setApproveModal((prev) => ({ ...prev, loading: false, error: "Duyệt thất bại." }));
    }
  };

  const openRejectModal = (item) => {
    setRejectModal({
      open: true,
      loading: false,
      error: "",
      item,
      reason: item?.rejectedReason || "",
    });
  };

  const closeRejectModal = () => {
    setRejectModal({ open: false, loading: false, error: "", item: null, reason: "" });
  };

  const submitRejectModal = async () => {
    if (!rejectModal.item?._id || rejectModal.loading) return;
    const reason = rejectModal.reason.trim();
    if (!reason) {
      setRejectModal((prev) => ({ ...prev, error: "Vui lòng nhập lý do từ chối." }));
      return;
    }
    try {
      setRejectModal((prev) => ({ ...prev, loading: true, error: "" }));
      await rejectWorkOrderApi(rejectModal.item._id, { rejectedReason: reason });
      closeRejectModal();
      await loadWorkOrders();
      showNotice("success", "Đã từ chối lệnh công việc.");
    } catch (err) {
      setRejectModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || err?.message || "Từ chối thất bại",
      }));
    }
  };

  const start = async (id) => {
    try {
      await startWorkOrderApi(id);
      await loadWorkOrders();
      showNotice("success", "Đã bắt đầu lệnh công việc.");
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Bắt đầu thất bại");
    }
  };

  const openCompleteModal = (item) => {
    setCompleteModal({
      open: true,
      loading: false,
      error: "",
      item,
      laborHours: String(item?.laborHours ?? 0),
      findings: "",
    });
  };

  const closeCompleteModal = () => {
    setCompleteModal({ open: false, loading: false, error: "", item: null, laborHours: "0", findings: "" });
  };

  const submitCompleteModal = async () => {
    if (!completeModal.item?._id || completeModal.loading) return;
    const laborHours = Number(completeModal.laborHours);
    if (Number.isNaN(laborHours) || laborHours < 0) {
      setCompleteModal((prev) => ({ ...prev, error: "Giờ công không hợp lệ." }));
      return;
    }
    try {
      setCompleteModal((prev) => ({ ...prev, loading: true, error: "" }));
      await completeWorkOrderApi(completeModal.item._id, {
        laborHours,
        findings: completeModal.findings.trim(),
      });
      closeCompleteModal();
      await loadWorkOrders();
      showNotice("success", "Đã hoàn thành lệnh công việc.");
    } catch (err) {
      setCompleteModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || err?.message || "Hoàn thành thất bại",
      }));
    }
  };

  const signOff = async (id) => {
    try {
      await signOffWorkOrderApi(id, { qcSignOff: true });
      await loadWorkOrders();
      showNotice("success", "Đã sign-off lệnh công việc.");
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Sign-off thất bại");
    }
  };

  const openEditModal = (item) => {
    setEditModal({
      open: true,
      loading: false,
      error: "",
      item,
      form: {
        assetId: item?.assetId?._id || item?.assetId || "",
        woType: item?.woType || "CM",
        triggerSource: item?.triggerSource || "production_request",
        priority: item?.priority || "medium",
        scheduledDate: toInputDate(item?.scheduledDate),
      },
    });
  };

  const closeEditModal = () => {
    setEditModal({
      open: false,
      loading: false,
      error: "",
      item: null,
      form: {
        assetId: "",
        woType: "CM",
        triggerSource: "production_request",
        priority: "medium",
        scheduledDate: "",
      },
    });
  };

  const submitEditModal = async () => {
    if (!editModal.item?._id || editModal.loading) return;
    if (!editModal.form.assetId) {
      setEditModal((prev) => ({ ...prev, error: "Vui lòng chọn tài sản." }));
      return;
    }
    try {
      setEditModal((prev) => ({ ...prev, loading: true, error: "" }));
      await updateWorkOrderApi(editModal.item._id, {
        assetId: editModal.form.assetId,
        woType: editModal.form.woType,
        triggerSource: editModal.form.triggerSource,
        priority: editModal.form.priority,
        scheduledDate: editModal.form.scheduledDate ? new Date(editModal.form.scheduledDate).toISOString() : null,
      });
      closeEditModal();
      await loadWorkOrders();
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || err?.message || "Sửa Work Order thất bại",
      }));
    }
  };

  const openDetail = async (item) => {
    try {
      setModalError("");
      setModalLoading(true);
      const res = await getWorkOrderByIdApi(item._id);
      setActionModal({ mode: "view", wo: res?.data || null });
    } catch (err) {
      setModalError(err?.response?.data?.message || err?.message || "Không tải được chi tiết Work Order.");
      setActionModal({ mode: "view", wo: null });
    } finally {
      setModalLoading(false);
    }
  };

  const closeActionModal = () => {
    setActionModal(null);
    setModalLoading(false);
    setModalError("");
  };
const openCreate = () => {
    if (!canCreateWorkOrder) {
      setCreateError("Bạn không có quyền tạo lệnh công việc.");
      return;
    }
    setCreateError("");
    setCreateForm({
      assetId: assets[0]?._id || "",
      woType: "CM",
      triggerSource: "production_request",
      priority: "medium",
      scheduledDate: "",
    });
    setShowCreateModal(true);
  };

  const createWorkOrder = async () => {
    if (!createForm.assetId) {
      setCreateError("Vui lòng chọn tài sản");
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError("");
      await createWorkOrderApi({
        assetId: createForm.assetId,
        woType: createForm.woType,
        triggerSource: createForm.triggerSource,
        priority: createForm.priority,
        scheduledDate: createForm.scheduledDate ? new Date(createForm.scheduledDate).toISOString() : null,
      });
      setShowCreateModal(false);
      await loadWorkOrders();
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || "Tạo lệnh thất bại");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <AppShell
      currentKey="work-orders"
      user={user}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Tìm kiếm tài sản, mã số hoặc vị trí..."
      notifications={notifications}
      notificationsRef={notificationsRef}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      setShowHelp={setShowHelp}
      onLogout={handleLogout}
      >
        <div className="shell-page-wrap space-y-8">
        {notice.text ? (
          <div className={`app-notice ${notice.type === "error" ? "app-notice-error" : notice.type === "info" ? "app-notice-info" : "app-notice-success"}`}>
            <span>{notice.text}</span>
            <button
              type="button"
              className="app-notice-close"
              onClick={() => setNotice({ type: "", text: "" })}
              aria-label="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ) : null}
        <section className="mb-10">
          <h2 className="app-page-title mb-6">Tóm tắt vận hành hôm nay</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-tertiary-fixed-dim">
              <p className="text-sm font-medium text-on-surface-variant mb-1">Lệnh đang chạy</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-primary">{stats.inProgress}</span>
                <span className="text-[#4edea3] text-xs font-bold bg-[#4edea3]/10 px-2 py-1 rounded">+{stats.todayNew} mới</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
              <p className="text-sm font-medium text-on-surface-variant mb-1">Chờ phê duyệt</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-primary">{stats.pending}</span>
                <span className="text-amber-600 text-xs font-bold bg-amber-100 px-2 py-1 rounded">Ưu tiên cao</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-primary">
              <p className="text-sm font-medium text-on-surface-variant mb-1">Hiệu suất hoàn thành</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-primary">{stats.doneRate}%</span>
                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full" style={{ width: `${stats.doneRate}%` }}></div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-error">
              <p className="text-sm font-medium text-on-surface-variant mb-1">Sự cố kỹ thuật</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-primary">{stats.urgentOpen}</span>
                <span className="text-error text-xs font-bold bg-error-container px-2 py-1 rounded">Khẩn cấp</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 flex flex-wrap items-center gap-4">
          <button className="flex items-center space-x-2 bg-surface-container-high px-4 py-2 rounded-full cursor-pointer hover:bg-surface-container-highest transition-colors" type="button" onClick={() => setShowSmartFilter((prev) => !prev)}>
            <span className="material-symbols-outlined text-sm">filter_alt</span>
            <span className="text-xs font-bold uppercase tracking-widest">Bộ lọc thông minh{smartFilterCount > 0 ? ` (${smartFilterCount})` : ""}</span>
          </button>
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          {canCreateWorkOrder ? (
            <button className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center shadow-lg active:scale-95 transition-transform" type="button" onClick={openCreate}>
              <span className="material-symbols-outlined text-sm mr-2">add</span>
              TẠO LỆNH MỚI
            </button>
          ) : (
            <button className="bg-slate-300 text-slate-600 px-5 py-2 rounded-lg text-xs font-bold flex items-center cursor-not-allowed" type="button" disabled title="Bạn chỉ có quyền xem">
              <span className="material-symbols-outlined text-sm mr-2">visibility</span>
              CHỈ XEM
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <select className="bg-white border-none rounded-lg text-xs font-medium shadow-sm focus:ring-1 focus:ring-[#4edea3] py-2 pl-4 pr-8 min-w-[150px] appearance-none bg-[right_0.7rem_center] bg-no-repeat" value={assetFilter} onChange={(e) => { setAssetFilter(e.target.value); setPage(1); }}>
              <option value="">Tất cả tài sản</option>
              {assets.map((asset) => (
                <option key={asset._id} value={asset._id}>{asset.name}</option>
              ))}
            </select>
            <select className="bg-white border-none rounded-lg text-xs font-medium shadow-sm focus:ring-1 focus:ring-[#4edea3] py-2 pl-4 pr-8 min-w-[180px] appearance-none bg-[right_0.7rem_center] bg-no-repeat" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="pending_approval">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="done">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </section>

        {showSmartFilter ? (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={smartFilters.priority} onChange={(event) => setSmartFilters((prev) => ({ ...prev, priority: event.target.value }))}>
                <option value="">Ưu tiên: tất cả</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
              <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={smartFilters.woType} onChange={(event) => setSmartFilters((prev) => ({ ...prev, woType: event.target.value }))}>
                <option value="">Loại WO: tất cả</option>
                <option value="PM">Bảo trì định kỳ (PM)</option>
                <option value="CM">Sửa chữa (CM)</option>
              </select>
              <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={smartFilters.triggerSource} onChange={(event) => setSmartFilters((prev) => ({ ...prev, triggerSource: event.target.value }))}>
                <option value="">Nguồn tạo: tất cả</option>
                <option value="machine_alert">Máy báo lỗi</option>
                <option value="pm_schedule">Lịch PM</option>
                <option value="production_request">Yêu cầu sản xuất</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="accent-[#4edea3]" checked={smartFilters.onlyMine} onChange={(event) => setSmartFilters((prev) => ({ ...prev, onlyMine: event.target.checked }))} />
                Chỉ của tôi
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="accent-[#4edea3]" checked={smartFilters.overdueOnly} onChange={(event) => setSmartFilters((prev) => ({ ...prev, overdueOnly: event.target.checked }))} />
                Quá hạn
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="accent-[#4edea3]" checked={smartFilters.actionableOnly} onChange={(event) => setSmartFilters((prev) => ({ ...prev, actionableOnly: event.target.checked }))} />
                Chỉ hiện có thao tác
              </label>
              <button type="button" className="ml-auto px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-100" onClick={() => setSmartFilters({ priority: "", woType: "", triggerSource: "", onlyMine: false, overdueOnly: false, actionableOnly: false })}>
                Xóa lọc thông minh
              </button>
            </div>
          </section>
        ) : null}

        <section className="bg-surface-container-lowest rounded-xl shadow-xl shadow-black/[0.02] overflow-hidden">
          {error ? <div className="px-6 py-3 text-sm text-error bg-error-container/40">{error}</div> : null}
          <div className="w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-none text-on-surface-variant">
                <th className="w-[19%] px-4 py-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Lệnh công việc</th>
                <th className="w-[16%] px-4 py-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Tài sản</th>
                <th className="w-[18%] px-4 py-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Loại</th>
                <th className="w-[9%] px-3 py-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Ưu tiên</th>
                <th className="w-[11%] px-4 py-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Trạng thái</th>
                <th className="w-[18%] px-4 py-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Người thực hiện</th>
                <th className="w-[9%] px-4 py-4 text-[10px] font-extrabold uppercase tracking-widest text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-sm text-on-surface-variant text-center">Đang tải dữ liệu...</td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-sm text-on-surface-variant text-center">Không có dữ liệu phù hợp.</td>
                </tr>
              ) : pageRows.map((item) => {
                const priority = mapPriority(item.priority);
                const status = mapStatus(item.status);
                return (
                  <tr className="hover:bg-surface-container-low/50 transition-colors" key={item._id}>
                    <td className="px-4 py-4 overflow-hidden">
                      <p className="text-base font-bold text-primary leading-tight whitespace-nowrap truncate">{buildTitle(item)}</p>
                      <p className="text-xs text-on-surface-variant font-mono whitespace-nowrap truncate">{item.woCode}</p>
                    </td>
                    <td className="px-4 py-4 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-slate-400 text-base shrink-0">{mapAssetIcon(item.assetId?.assetType)}</span>
                        <span className="text-sm text-secondary font-medium whitespace-nowrap truncate">{item.assetId?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-secondary whitespace-nowrap overflow-hidden">
                      <span className="block whitespace-nowrap truncate">{mapTypeLabel(item.woType)} · {mapTriggerLabel(item.triggerSource)}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`flex items-center gap-1 whitespace-nowrap ${priority.tone} text-[11px] font-black uppercase`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priority.dot}`}></span>
                        <span>{priority.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-4 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shell-user-avatar-initials shell-user-avatar-small border border-slate-200 shrink-0">
                          {getInitials(item.assignedTo || item.createdBy)}
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">{item.assignedTo?.name || item.createdBy?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button className="p-1 hover:bg-slate-100 text-slate-500 transition-colors rounded disabled:opacity-40" type="button" title="Chi tiết" onClick={() => openDetail(item)}>
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {canEdit(user, item) ? (
                          <>
                            <button className="p-1 hover:bg-blue-50 text-blue-600 transition-colors rounded disabled:opacity-40" type="button" title="Sửa" onClick={() => openEditModal(item)}>
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            {item.status === "draft" ? (
                              <button className="p-1 hover:bg-violet-50 text-violet-600 transition-colors rounded disabled:opacity-40" type="button" title="Gửi duyệt" onClick={() => openSubmitModal(item)}>
                                <span className="material-symbols-outlined text-[18px]">outgoing_mail</span>
                              </button>
                            ) : null}
                          </>
                        ) : null}
                        {canApprove(user, item) ? (
                          <>
                            <button className="p-1 hover:bg-emerald-50 text-[#4edea3] transition-colors rounded" type="button" title="Duyệt" onClick={() => openApproveModal(item)}>
                              <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            </button>
                            <button className="p-1 hover:bg-rose-50 text-error transition-colors rounded" type="button" title="Từ chối" onClick={() => openRejectModal(item)}>
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                          </>
                        ) : null}
                        {canStart(user, item) ? (
                          <button className="p-1 hover:bg-amber-50 text-amber-600 transition-colors rounded" type="button" title="Bắt đầu" onClick={() => start(item._id)}>
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          </button>
                        ) : null}
                        {canComplete(user, item) ? (
                          <button className="p-1 hover:bg-amber-50 text-amber-600 transition-colors rounded" type="button" title="Hoàn thành" onClick={() => openCompleteModal(item)}>
                            <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          </button>
                        ) : null}
                        {canSignOff(user, item) ? (
                          <button className="p-1 hover:bg-emerald-50 text-emerald-600 transition-colors rounded" type="button" title="Sign-off" onClick={() => signOff(item._id)}>
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
            <div className="text-xs text-on-surface-variant font-medium">
              Hiển thị <span className="font-bold text-primary">{filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(filteredRows.length, safePage * PAGE_SIZE)}</span> trong số <span className="font-bold text-primary">{filteredRows.length}</span> lệnh
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" onClick={() => goPage(1)} disabled={safePage === 1}>
                <span className="material-symbols-outlined text-[18px]">first_page</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}>
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <div className="flex items-center px-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold" type="button">
                  {safePage}
                </button>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" onClick={() => goPage(totalPages)} disabled={safePage === totalPages}>
                <span className="material-symbols-outlined text-[18px]">last_page</span>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-surface-container-low/40 p-8 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">analytics</span>
            <h3 className="text-lg font-bold text-primary mb-2">Phân tích xu hướng bảo trì</h3>
            <p className="text-sm text-on-surface-variant max-w-sm">Tài liệu phân tích hiệu suất thiết bị hàng tuần đang được tổng hợp. Bạn có thể xem báo cáo chi tiết sau 17:00 hôm nay.</p>
            <button className="mt-6 text-[#001e40] text-xs font-bold underline underline-offset-4 decoration-[#4edea3] hover:text-[#4edea3] transition-colors uppercase tracking-widest" type="button" onClick={() => showNotice("info", "Báo cáo sẽ được tổng hợp từ dữ liệu Work Order hiện tại.")}>Xem bản nháp báo cáo</button>
          </div>
          <div className="bg-primary-container p-6 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4">Ghi chú vận hành</h3>
              <div className="space-y-4">
                <div className="border-l-2 border-[#4edea3] pl-3 py-1">
                  <p className="text-xs font-bold text-[#4edea3]">Lưu ý an toàn</p>
                  <p className="text-sm text-slate-300">Kiểm tra lại khóa an toàn khu vực Robot trước ca đêm.</p>
                </div>
                <div className="border-l-2 border-amber-400 pl-3 py-1">
                  <p className="text-xs font-bold text-amber-400">Vật tư sắp hết</p>
                  <p className="text-sm text-slate-300">Dây curoa dự phòng mã X-90 còn lại 2 sợi. Đã yêu cầu nhập kho.</p>
                </div>
              </div>
              <button className="w-full mt-8 py-3 border border-white/20 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors" type="button" onClick={() => showNotice("info", "Ghi chú nhanh đã được ghi nhận trong phiên làm việc hiện tại.")}>THÊM GHI CHÚ NHANH</button>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
            </div>
          </div>
        </section>
        </div>
      </AppShell>


      {actionModal ? (
        <div className="app-modal-overlay z-[70]" onClick={closeActionModal}>
          <div className="app-modal-panel max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">visibility</span>
                Chi tiết lệnh công việc
              </h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeActionModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5">
              {modalLoading ? (
                <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
              ) : modalError ? (
                <div className="app-notice-compact app-notice-error">{modalError}</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-slate-600">Mã lệnh:</span> {actionModal.wo?.woCode || "-"}</div>
                    <div><span className="font-semibold text-slate-600">Loại:</span> {mapTypeLabel(actionModal.wo?.woType)}</div>
                    <div><span className="font-semibold text-slate-600">Tài sản:</span> {(actionModal.wo?.assetId?.assetCode || "-")} - {(actionModal.wo?.assetId?.name || "-")}</div>
                    <div><span className="font-semibold text-slate-600">Nguồn tạo:</span> {mapTriggerLabel(actionModal.wo?.triggerSource)}</div>
                    <div><span className="font-semibold text-slate-600">Ưu tiên:</span> {mapPriority(actionModal.wo?.priority).label}</div>
                    <div><span className="font-semibold text-slate-600">Trạng thái:</span> {mapStatus(actionModal.wo?.status).label}</div>
                    <div><span className="font-semibold text-slate-600">Người tạo:</span> {actionModal.wo?.createdBy?.name || "-"}</div>
                    <div><span className="font-semibold text-slate-600">Người thực hiện:</span> {actionModal.wo?.assignedTo?.name || "-"}</div>
                    <div><span className="font-semibold text-slate-600">Ngày dự kiến:</span> {toDisplayDate(actionModal.wo?.scheduledDate)}</div>
                    <div><span className="font-semibold text-slate-600">Lý do từ chối:</span> {actionModal.wo?.rejectedReason || "-"}</div>
                  </div>
                  <div className="flex justify-end pt-5">
                    <button type="button" className="app-btn-secondary" onClick={closeActionModal}>
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {submitModal.open ? (
        <div className="app-modal-overlay z-[72]" onClick={closeSubmitModal}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Gửi duyệt lệnh công việc</h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeSubmitModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              {submitModal.error ? <div className="app-notice-compact app-notice-error">{submitModal.error}</div> : null}
              <div><span className="font-semibold text-slate-600">Mã lệnh:</span> {submitModal.item?.woCode || "-"}</div>
              <div><span className="font-semibold text-slate-600">Tài sản:</span> {submitModal.item?.assetId?.name || "-"}</div>
              <div><span className="font-semibold text-slate-600">Loại:</span> {mapTypeLabel(submitModal.item?.woType)}</div>
              <div><span className="font-semibold text-slate-600">Ưu tiên:</span> {mapPriority(submitModal.item?.priority).label}</div>
              <div className="app-notice-compact app-notice-warning">
                Sau khi gửi duyệt, trạng thái sẽ chuyển sang <b>Chờ duyệt</b>.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={closeSubmitModal} disabled={submitModal.loading}>
                  Hủy
                </button>
                <button type="button" className="app-btn-primary disabled:opacity-50" onClick={submitForApproval} disabled={submitModal.loading}>
                  {submitModal.loading ? "Đang gửi..." : "Xác nhận gửi duyệt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {approveModal.open ? (
        <div className="app-modal-overlay z-[72]" onClick={closeApproveModal}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Duyệt lệnh công việc</h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeApproveModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              {approveModal.error ? <div className="app-notice-compact app-notice-error">{approveModal.error}</div> : null}
              <div><span className="font-semibold text-slate-600">Mã lệnh:</span> {approveModal.item?.woCode || "-"}</div>
              <div><span className="font-semibold text-slate-600">Tài sản:</span> {approveModal.item?.assetId?.name || "-"}</div>
              <div><span className="font-semibold text-slate-600">Ưu tiên:</span> {mapPriority(approveModal.item?.priority).label}</div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Phân công kỹ thuật viên</label>
                <select
                  className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50"
                  value={approveModal.assignedTo}
                  onChange={(event) => setApproveModal((prev) => ({ ...prev, assignedTo: event.target.value }))}
                >
                  <option value="">Chọn kỹ thuật viên</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name} ({tech.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={closeApproveModal} disabled={approveModal.loading}>
                  Hủy
                </button>
                <button type="button" className="app-btn-primary disabled:opacity-50" onClick={submitApproveModal} disabled={approveModal.loading}>
                  {approveModal.loading ? "Đang duyệt..." : "Xác nhận duyệt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rejectModal.open ? (
        <div className="app-modal-overlay z-[72]" onClick={closeRejectModal}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Từ chối lệnh công việc</h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeRejectModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              {rejectModal.error ? <div className="app-notice-compact app-notice-error">{rejectModal.error}</div> : null}
              <div><span className="font-semibold text-slate-600">Mã lệnh:</span> {rejectModal.item?.woCode || "-"}</div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Lý do từ chối</label>
                <textarea
                  className="w-full min-h-[110px] bg-surface-container-low border-none rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50"
                  placeholder="Nhập lý do từ chối..."
                  value={rejectModal.reason}
                  onChange={(event) => setRejectModal((prev) => ({ ...prev, reason: event.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={closeRejectModal} disabled={rejectModal.loading}>
                  Hủy
                </button>
                <button type="button" className="app-btn-danger disabled:opacity-50" onClick={submitRejectModal} disabled={rejectModal.loading}>
                  {rejectModal.loading ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {completeModal.open ? (
        <div className="app-modal-overlay z-[72]" onClick={closeCompleteModal}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Hoàn thành lệnh công việc</h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeCompleteModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              {completeModal.error ? <div className="app-notice-compact app-notice-error">{completeModal.error}</div> : null}
              <div><span className="font-semibold text-slate-600">Mã lệnh:</span> {completeModal.item?.woCode || "-"}</div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Giờ công</label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50"
                  value={completeModal.laborHours}
                  onChange={(event) => setCompleteModal((prev) => ({ ...prev, laborHours: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Ghi chú hoàn thành</label>
                <textarea
                  className="w-full min-h-[110px] bg-surface-container-low border-none rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50"
                  placeholder="Nhập ghi chú sau khi hoàn thành..."
                  value={completeModal.findings}
                  onChange={(event) => setCompleteModal((prev) => ({ ...prev, findings: event.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={closeCompleteModal} disabled={completeModal.loading}>
                  Hủy
                </button>
                <button type="button" className="app-btn-primary disabled:opacity-50" onClick={submitCompleteModal} disabled={completeModal.loading}>
                  {completeModal.loading ? "Đang xử lý..." : "Xác nhận hoàn thành"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editModal.open ? (
        <div className="app-modal-overlay z-[72]" onClick={closeEditModal}>
          <div className="app-modal-panel max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">edit_square</span>
                Chỉnh sửa lệnh công việc
              </h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeEditModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {editModal.error ? <div className="app-notice-compact app-notice-error">{editModal.error}</div> : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50 md:col-span-2" value={editModal.form.assetId} onChange={(event) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, assetId: event.target.value } }))}>
                  <option value="">Chọn tài sản</option>
                  {assets.map((asset) => (
                    <option key={asset._id} value={asset._id}>{asset.assetCode} - {asset.name}</option>
                  ))}
                </select>
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={editModal.form.woType} onChange={(event) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, woType: event.target.value } }))}>
                  <option value="CM">Sửa chữa (CM)</option>
                  <option value="PM">Bảo trì định kỳ (PM)</option>
                </select>
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={editModal.form.triggerSource} onChange={(event) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, triggerSource: event.target.value } }))}>
                  <option value="machine_alert">Máy báo lỗi</option>
                  <option value="pm_schedule">Lịch PM</option>
                  <option value="production_request">Yêu cầu sản xuất</option>
                </select>
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={editModal.form.priority} onChange={(event) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, priority: event.target.value } }))}>
                  <option value="urgent">Khẩn cấp</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" type="date" value={editModal.form.scheduledDate} onChange={(event) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, scheduledDate: event.target.value } }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={closeEditModal} disabled={editModal.loading}>Hủy</button>
                <button type="button" className="app-btn-primary disabled:opacity-50" onClick={submitEditModal} disabled={editModal.loading}>
                  {editModal.loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="app-modal-overlay z-[70]" onClick={() => setShowCreateModal(false)}>
          <div className="app-modal-panel max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">add_task</span>
                Tạo lệnh công việc
              </h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              {createError ? <div className="app-notice-compact app-notice-error">{createError}</div> : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50 md:col-span-2" value={createForm.assetId} onChange={(event) => setCreateForm((prev) => ({ ...prev, assetId: event.target.value }))}>
                  <option value="">Chọn tài sản</option>
                  {assets.map((asset) => (
                    <option key={asset._id} value={asset._id}>{asset.assetCode} - {asset.name}</option>
                  ))}
                </select>
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={createForm.woType} onChange={(event) => setCreateForm((prev) => ({ ...prev, woType: event.target.value }))}>
                  <option value="CM">Sửa chữa (CM)</option>
                  <option value="PM">Bảo trì định kỳ (PM)</option>
                </select>
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={createForm.triggerSource} onChange={(event) => setCreateForm((prev) => ({ ...prev, triggerSource: event.target.value }))}>
                  <option value="machine_alert">Máy báo lỗi</option>
                  <option value="pm_schedule">Lịch PM</option>
                  <option value="production_request">Yêu cầu sản xuất</option>
                </select>
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={createForm.priority} onChange={(event) => setCreateForm((prev) => ({ ...prev, priority: event.target.value }))}>
                  <option value="urgent">Khẩn cấp</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" type="date" value={createForm.scheduledDate} onChange={(event) => setCreateForm((prev) => ({ ...prev, scheduledDate: event.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="button" className="app-btn-primary disabled:opacity-50" disabled={createLoading} onClick={createWorkOrder}>{createLoading ? "Đang tạo..." : "Tạo lệnh"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showHelp ? (
        <div className="app-modal-overlay z-[60]" onClick={() => setShowHelp(false)}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-primary">Hướng dẫn nhanh</h3>
            </div>
            <div className="px-6 py-5 text-sm text-slate-700 space-y-3">
              <p>1. Tạo lệnh ở trạng thái bản nháp, cập nhật thông tin rồi gửi duyệt.</p>
              <p>2. Duyệt/Từ chối theo quyền và mức ưu tiên.</p>
              <p>3. Technician bắt đầu, hoàn thành, sau đó sign-off để đóng vòng đời WO.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default WorkOrdersPage;






