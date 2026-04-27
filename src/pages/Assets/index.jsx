import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { createAssetApi, deleteAssetApi, getAssetByIdApi, listAssetsApi, updateAssetApi } from "../../services/asset.api";
import { subscribeRealtime } from "../../services/realtime";
import { getDisplayName, getInitials, mapRoleLabel } from "../../utils/userDisplay";
import "./style.css";

const PAGE_SIZE = 10;

function toCurrency(value) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function mapTypeLabel(type) {
  if (type === "machine") return "Máy móc";
  if (type === "mold") return "Khuôn";
  if (type === "jig_tool") return "Jig/Tool";
  if (type === "infrastructure") return "Hạ tầng";
  return type || "-";
}

function mapStatusLabel(status) {
  if (status === "active") return { text: "Đang hoạt động", cls: "bg-[#4edea3]/10 text-[#005236]", dot: "bg-tertiary-fixed-dim" };
  if (status === "in_repair") return { text: "Bảo trì", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" };
  if (status === "idle") return { text: "Dừng máy", cls: "bg-error-container text-error", dot: "bg-error" };
  return { text: "Ngưng sử dụng", cls: "bg-slate-200 text-slate-700", dot: "bg-slate-400" };
}

function escapeCsvValue(value) {
  const raw = value === null || value === undefined ? "" : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

function parseCurrencyToNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s/g, "").replace(/[^\d.,]/g, "");
  if (!normalized) return null;

  const lastDot = normalized.lastIndexOf(".");
  const lastComma = normalized.lastIndexOf(",");
  const lastSep = Math.max(lastDot, lastComma);

  if (lastSep === -1) {
    const digitsOnly = normalized.replace(/\D/g, "");
    return digitsOnly ? Number(digitsOnly) : null;
  }

  const intPart = normalized.slice(0, lastSep).replace(/\D/g, "");
  const fracPart = normalized.slice(lastSep + 1).replace(/\D/g, "");

  if (fracPart.length > 0 && fracPart.length <= 2) {
    return Number(`${intPart || "0"}.${fracPart}`);
  }

  const digitsOnly = normalized.replace(/\D/g, "");
  return digitsOnly ? Number(digitsOnly) : null;
}

function AssetsPage() {
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
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    loading: false,
    error: "",
    asset: null,
  });
  const [createForm, setCreateForm] = useState({
    assetCode: "",
    name: "",
    assetType: "machine",
    status: "active",
    location: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    status: "",
    location: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    purchasePrice: "",
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    manufacturer: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  });
  const notificationsRef = useRef(null);

  const showNotice = (type, text) => {
    setNotice({ type, text });
  };

  const loadAssets = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const res = await listAssetsApi();
      setAssets(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không tải được dữ liệu tài sản");
      setAssets([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadAssets();
    });
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const manufacturerKeyword = advancedFilters.manufacturer.trim().toLowerCase();
    const locationKeyword = advancedFilters.location.trim().toLowerCase();
    const minPriceValue = parseCurrencyToNumber(advancedFilters.minPrice);
    const maxPriceValue = parseCurrencyToNumber(advancedFilters.maxPrice);

    return assets.filter((item) => {
      if (typeFilter && item.assetType !== typeFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (manufacturerKeyword && !String(item.manufacturer || "").toLowerCase().includes(manufacturerKeyword)) return false;
      if (locationKeyword && !String(item.location || "").toLowerCase().includes(locationKeyword)) return false;
      if (minPriceValue !== null && Number(item.purchasePrice || 0) < minPriceValue) return false;
      if (maxPriceValue !== null && Number(item.purchasePrice || 0) > maxPriceValue) return false;
      if (!keyword) return true;
      const text = [item.assetCode, item.name, item.location, item.serialNumber, item.model]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [assets, search, typeFilter, statusFilter, advancedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedAssets = filteredAssets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalAssets = assets.length;
  const activeAssets = assets.filter((item) => item.status === "active").length;
  const repairAssets = assets.filter((item) => item.status === "in_repair").length;
  const idleAssets = assets.filter((item) => item.status === "idle").length;

  const notifications = useMemo(() => {
    const result = [];
    if (idleAssets > 0) {
      result.push({ id: "idle", level: "error", text: `Có ${idleAssets} tài sản đang dừng máy.` });
    }
    if (repairAssets > 0) {
      result.push({ id: "repair", level: "warning", text: `Có ${repairAssets} tài sản đang bảo trì.` });
    }
    if (activeAssets > 0) {
      result.push({ id: "active", level: "info", text: `${activeAssets} tài sản đang hoạt động ổn định.` });
    }
    return result;
  }, [activeAssets, repairAssets, idleAssets]);

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate("/auth", { replace: true });
  };

  const goPage = (value) => {
    const next = Math.max(1, Math.min(totalPages, value));
    setPage(next);
  };

  const resetAdvancedFilters = () => {
    setPage(1);
    setAdvancedFilters({
      manufacturer: "",
      location: "",
      minPrice: "",
      maxPrice: "",
    });
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

  const upsertLocalAsset = (updatedAsset) => {
    setAssets((prev) => prev.map((item) => (item._id === updatedAsset._id ? { ...item, ...updatedAsset } : item)));
  };

  const resetCreateForm = () => {
    setCreateForm({
      assetCode: "",
      name: "",
      assetType: "machine",
      status: "active",
      location: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      purchasePrice: "",
    });
  };

  const openCreateModal = () => {
    if (!canManageAssets) {
      showNotice("error", "Bạn không có quyền thêm tài sản.");
      return;
    }
    setCreateError("");
    setCreateLoading(false);
    resetCreateForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError("");
    setCreateLoading(false);
  };

  const closeActionModal = () => {
    setActionModal(null);
    setModalError("");
    setModalLoading(false);
  };

  const openViewModal = async (id) => {
    try {
      setModalError("");
      setModalLoading(true);
      const res = await getAssetByIdApi(id);
      setActionModal({ mode: "view", asset: res?.data?.asset || null });
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Không tải được chi tiết tài sản.");
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModal = async (id) => {
    if (!canManageAssets) {
      showNotice("error", "Bạn không có quyền sửa tài sản.");
      return;
    }
    try {
      setModalError("");
      setModalLoading(true);
      const res = await getAssetByIdApi(id);
      const asset = res?.data?.asset;
      if (!asset) {
        showNotice("error", "Không tải được dữ liệu tài sản.");
        return;
      }
      setEditForm({
        name: asset.name || "",
        status: asset.status || "",
        location: asset.location || "",
        manufacturer: asset.manufacturer || "",
        model: asset.model || "",
        serialNumber: asset.serialNumber || "",
        purchasePrice: asset.purchasePrice === null || asset.purchasePrice === undefined ? "" : String(asset.purchasePrice),
      });
      setActionModal({ mode: "edit", asset });
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Không tải được dữ liệu tài sản.");
    } finally {
      setModalLoading(false);
    }
  };

  const submitEditAsset = async () => {
    if (!canManageAssets) {
      setModalError("Bạn không có quyền cập nhật tài sản.");
      return;
    }
    if (!actionModal?.asset?._id) return;
    if (!editForm.name.trim()) {
      setModalError("Tên tài sản không được để trống.");
      return;
    }
    try {
      setModalError("");
      setModalLoading(true);
      const payload = {
        name: editForm.name.trim(),
        status: editForm.status,
        location: editForm.location.trim(),
        manufacturer: editForm.manufacturer.trim(),
        model: editForm.model.trim(),
        serialNumber: editForm.serialNumber.trim(),
        purchasePrice: parseCurrencyToNumber(editForm.purchasePrice),
      };
      const res = await updateAssetApi(actionModal.asset._id, payload);
      const updatedAsset = res?.data?.asset;
      if (updatedAsset) {
        upsertLocalAsset(updatedAsset);
      }
      showNotice("success", "Cập nhật tài sản thành công.");
      closeActionModal();
    } catch (err) {
      setModalError(err?.response?.data?.message || err?.message || "Cập nhật tài sản thất bại.");
      setModalLoading(false);
    }
  };

  const openDeleteModal = (asset) => {
    if (!canManageAssets) {
      showNotice("error", "Bạn không có quyền xóa tài sản.");
      return;
    }
    setDeleteModal({
      open: true,
      loading: false,
      error: "",
      asset,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, loading: false, error: "", asset: null });
  };

  const removeAsset = async () => {
    if (!deleteModal.asset?._id || deleteModal.loading) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true, error: "" }));
      await deleteAssetApi(deleteModal.asset._id);
      setAssets((prev) => prev.filter((item) => item._id !== deleteModal.asset._id));
      closeDeleteModal();
      showNotice("success", "Đã xóa tài sản.");
    } catch (err) {
      setDeleteModal((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || err?.message || "Xóa tài sản thất bại.",
      }));
    }
  };

  const submitCreateAsset = async () => {
    if (!canManageAssets) {
      setCreateError("Bạn không có quyền thêm tài sản.");
      return;
    }
    if (!createForm.assetCode.trim() || !createForm.name.trim() || !createForm.assetType) {
      setCreateError("Vui lòng nhập đủ Mã tài sản, Tên tài sản và Loại.");
      return;
    }
    try {
      setCreateError("");
      setCreateLoading(true);
      const payload = {
        assetCode: createForm.assetCode.trim(),
        name: createForm.name.trim(),
        assetType: createForm.assetType,
        status: createForm.status,
        location: createForm.location.trim(),
        manufacturer: createForm.manufacturer.trim(),
        model: createForm.model.trim(),
        serialNumber: createForm.serialNumber.trim(),
        purchaseDate: createForm.purchaseDate ? new Date(createForm.purchaseDate).toISOString() : null,
        purchasePrice: parseCurrencyToNumber(createForm.purchasePrice),
        detail: {},
      };
      const res = await createAssetApi(payload);
      const createdAsset = res?.data?.asset;
      if (createdAsset) {
        setAssets((prev) => [createdAsset, ...prev]);
      }
      showNotice("success", "Tạo tài sản thành công.");
      closeCreateModal();
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || "Tạo tài sản thất bại.");
      setCreateLoading(false);
    }
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

  return (
    <div className="bg-[#eef3f8] text-on-surface">
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#001e40] dark:bg-[#000511] flex flex-col py-6 shadow-2xl shadow-black/20 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4edea3] flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
            </div>
            <div>
              <h1 className="shell-brand-title tracking-tighter text-white uppercase font-headline">Digital Foreman</h1>
              <p className="shell-brand-subtitle">Hệ thống Kỹ nghệ Số</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-3">
          <a
            className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 group text-left"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="font-['Inter'] shell-nav-text">Bảng điều khiển</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-[#4edea3] border-r-4 border-[#4edea3] transition-all duration-200 active:scale-95 group text-left" href="#" onClick={(e) => e.preventDefault()}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
            <span className="font-['Inter'] shell-nav-text">Tài sản</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 group text-left" href="#" onClick={(e) => { e.preventDefault(); navigate('/work-orders'); }}>
            <span className="material-symbols-outlined text-xl">engineering</span>
            <span className="font-['Inter'] shell-nav-text">Lệnh công việc</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 group text-left" href="#" onClick={(e) => { e.preventDefault(); navigate('/maintenance'); }}>
            <span className="material-symbols-outlined text-xl">build</span>
            <span className="font-['Inter'] shell-nav-text">Bảo trì</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 group text-left" href="#" onClick={(e) => { e.preventDefault(); navigate('/users'); }}>
            <span className="material-symbols-outlined text-xl">group</span>
            <span className="font-['Inter'] shell-nav-text">Người dùng</span>
          </a>
        </nav>
        <div className="mt-auto px-3">
          <a className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95" href="#" onClick={handleLogout}>
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-['Inter'] shell-nav-text">Đăng xuất</span>
          </a>
        </div>
      </aside>

      <header className="shell-header fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-8 z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="shell-search-wrap relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-tertiary-fixed-dim transition-colors">search</span>
            <input
              className="shell-search-input w-full border-none rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#4edea3]/50 transition-all outline-none"
              placeholder="Tìm kiếm tài sản, mã số hoặc vị trí..."
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 relative" ref={notificationsRef}>
            <button className="text-slate-500 hover:text-[#4edea3] transition-colors relative" type="button" onClick={() => setShowNotifications((prev) => !prev)}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: showNotifications ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
              {notifications.length > 0 ? <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface"></span> : null}
            </button>
            <button className="text-slate-500 hover:text-[#4edea3] transition-colors" type="button" onClick={() => setShowHelp(true)}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: showHelp ? "'FILL' 1" : "'FILL' 0" }}>help</span>
            </button>
            {showNotifications ? (
              <div className="absolute right-0 top-10 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                <div className="text-sm font-bold text-primary px-2 pb-2 border-b border-slate-100">Thông báo tài sản</div>
                <div className="max-h-72 overflow-auto mt-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-sm text-slate-500 px-2 py-3">Không có thông báo mới.</div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          item.level === "error"
                            ? "bg-red-50 text-red-700"
                            : item.level === "warning"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="text-right">
                <p className="app-user-name">{getDisplayName(user)}</p>
                <p className="app-user-role">{mapRoleLabel(user?.role)}</p>
            </div>
              <div className="shell-user-avatar shell-user-avatar-initials ring-2 ring-surface-container">
                {getInitials(user)}
              </div>
          </div>
        </div>
      </header>

      <main className="ml-64 pt-16 min-h-screen bg-[#eef3f8]">
        <div className="shell-page-wrap">
          {notice.text ? (
            <div className={`app-notice mb-6 ${notice.type === "error" ? "app-notice-error" : "app-notice-success"}`}>
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
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="app-page-title">Quản lý Tài sản</h1>
              <p className="app-page-subtitle">Theo dõi, kiểm kê và tối ưu hóa hiệu suất thiết bị toàn nhà máy.</p>
            </div>
            {canManageAssets ? (
              <button className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/10" type="button" onClick={openCreateModal}>
                <span className="material-symbols-outlined text-[20px]">add</span>
                Thêm tài sản
              </button>
            ) : (
              <button className="bg-slate-300 text-slate-600 px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-not-allowed" type="button" disabled title="Bạn chỉ có quyền xem">
                <span className="material-symbols-outlined text-[20px]">visibility</span>
                Chỉ xem
              </button>
            )}
          </div>

          {error ? <div className="app-notice app-notice-error mb-6">{error}</div> : null}
          {!canManageAssets ? (
            <div className="app-notice app-notice-info mb-6">
              Tài khoản của bạn đang ở chế độ xem. Chỉ admin hoặc site_manager mới có quyền thêm/sửa/xóa tài sản.
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm">
              <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Tổng tài sản</div>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-primary tracking-tighter">{loading ? "..." : totalAssets.toLocaleString("vi-VN")}</span>
                <span className="text-tertiary-fixed-dim text-xs font-bold mb-1">+0%</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm">
              <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Đang hoạt động</div>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-primary tracking-tighter">{loading ? "..." : activeAssets.toLocaleString("vi-VN")}</span>
                <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim mb-2.5 shadow-[0_0_8px_rgba(78,222,163,0.6)]"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm">
              <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Đang bảo trì</div>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-primary tracking-tighter">{loading ? "..." : repairAssets.toLocaleString("vi-VN")}</span>
                <div className="w-2 h-2 rounded-full bg-amber-400 mb-2.5 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm">
              <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Dừng máy</div>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-primary tracking-tighter">{loading ? "..." : idleAssets.toLocaleString("vi-VN")}</span>
                <div className="w-2 h-2 rounded-full bg-error mb-2.5 shadow-[0_0_8px_rgba(186,26,26,0.6)]"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mb-1 flex flex-wrap gap-4 items-center border border-slate-200/70 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest rounded-lg text-sm border-none min-w-[200px]">
              <span className="text-on-surface-variant font-medium">Loại:</span>
              <select className="bg-transparent border-none focus:ring-0 text-primary font-bold py-0 pr-8 cursor-pointer" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}>
                <option value="">Tất cả loại</option>
                <option value="machine">Máy móc</option>
                <option value="mold">Khuôn</option>
                <option value="jig_tool">Jig/Tool</option>
                <option value="infrastructure">Hạ tầng</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest rounded-lg text-sm border-none min-w-[200px]">
              <span className="text-on-surface-variant font-medium">Trạng thái:</span>
              <select className="bg-transparent border-none focus:ring-0 text-primary font-bold py-0 pr-8 cursor-pointer" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="in_repair">Bảo trì</option>
                <option value="idle">Dừng máy</option>
                <option value="disposed">Ngưng sử dụng</option>
              </select>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-highest rounded-lg text-sm font-bold text-on-surface-variant transition-colors ml-auto"
              type="button"
              onClick={() => setShowAdvancedFilter((prev) => !prev)}
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Bộ lọc nâng cao
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-highest rounded-lg text-sm font-bold text-on-surface-variant transition-colors"
              type="button"
              onClick={exportCsv}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Xuất CSV
            </button>
          </div>

          {showAdvancedFilter ? (
            <div className="bg-white rounded-xl mt-3 p-4 border border-slate-200/70 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#4edea3]/50 outline-none"
                  placeholder="Hãng sản xuất"
                  type="text"
                  value={advancedFilters.manufacturer}
                  onChange={(event) => {
                    setAdvancedFilters((prev) => ({ ...prev, manufacturer: event.target.value }));
                    setPage(1);
                  }}
                />
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#4edea3]/50 outline-none"
                  placeholder="Vị trí"
                  type="text"
                  value={advancedFilters.location}
                  onChange={(event) => {
                    setAdvancedFilters((prev) => ({ ...prev, location: event.target.value }));
                    setPage(1);
                  }}
                />
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#4edea3]/50 outline-none"
                  placeholder="Giá từ"
                  type="text"
                  inputMode="decimal"
                  value={advancedFilters.minPrice}
                  onChange={(event) => {
                    setAdvancedFilters((prev) => ({ ...prev, minPrice: event.target.value }));
                    setPage(1);
                  }}
                />
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#4edea3]/50 outline-none"
                  placeholder="Giá đến"
                  type="text"
                  inputMode="decimal"
                  value={advancedFilters.maxPrice}
                  onChange={(event) => {
                    setAdvancedFilters((prev) => ({ ...prev, maxPrice: event.target.value }));
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex justify-end mt-3">
                <button
                  className="px-4 py-2 hover:bg-surface-container-highest rounded-lg text-sm font-bold text-on-surface-variant transition-colors"
                  type="button"
                  onClick={resetAdvancedFilters}
                >
                  Xóa lọc nâng cao
                </button>
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-xl overflow-hidden border border-slate-200/70 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Mã tài sản</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Tên tài sản</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Loại</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Vị trí</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest text-right">Giá trị</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedAssets.map((item) => {
                  const status = mapStatusLabel(item.status);
                  return (
                    <tr className="hover:bg-surface-container-low transition-colors group" key={item._id || item.assetCode}>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{item.assetCode || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary">{item.name || "-"}</div>
                        <div className="text-[10px] text-on-surface-variant">S/N: {item.serialNumber || "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-secondary-container">{mapTypeLabel(item.assetType)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${status.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-secondary-container">{item.location || "-"}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary text-right tabular-nums">{toCurrency(item.purchasePrice)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button className="app-icon-action" type="button" onClick={() => openViewModal(item._id)}><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                          {canManageAssets ? (
                            <>
                              <button className="app-icon-action" type="button" onClick={() => openEditModal(item._id)}><span className="material-symbols-outlined text-[20px]">edit</span></button>
                              <button className="app-icon-action hover:text-error" type="button" onClick={() => openDeleteModal(item)}><span className="material-symbols-outlined text-[20px]">delete</span></button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && pagedAssets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-sm text-on-surface-variant">Không có tài sản phù hợp.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
              <div className="text-xs text-on-surface-variant font-medium">
                Hiển thị <span className="font-bold text-primary">{filteredAssets.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(filteredAssets.length, safePage * PAGE_SIZE)}</span> trong số <span className="font-bold text-primary">{filteredAssets.length}</span> tài sản
              </div>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(1)} disabled={safePage === 1}><span className="material-symbols-outlined text-[18px]">first_page</span></button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                <div className="flex items-center px-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">{safePage}</button>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(totalPages)} disabled={safePage === totalPages}><span className="material-symbols-outlined text-[18px]">last_page</span></button>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-primary-container p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10">
                <h3 className="text-white text-xl font-bold mb-2">Báo cáo tình trạng định kỳ</h3>
                <p className="text-on-primary-container text-sm max-w-md">Hệ thống ghi nhận hiệu suất trung bình toàn nhà máy đang ở mức ổn định. Có một số thiết bị sắp đến hạn bảo trì trong 48h tới.</p>
                <button className="mt-6 px-5 py-2 bg-[#4edea3] text-primary font-bold text-xs rounded-lg hover:bg-white transition-colors" type="button" onClick={() => navigate("/maintenance")}>Xem lịch bảo trì</button>
              </div>
              <span className="material-symbols-outlined absolute -right-8 -bottom-8 text-[200px] text-white/5 pointer-events-none">precision_manufacturing</span>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">qr_code_scanner</span>
              </div>
              <h3 className="text-primary font-bold mb-2">Kiểm kê nhanh</h3>
              <p className="text-on-surface-variant text-xs">Sử dụng ứng dụng di động để quét mã QR trên thiết bị và cập nhật trạng thái ngay lập tức.</p>
              <div className="mt-auto pt-4 flex gap-3">
                <span className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">ios</span></span>
                <span className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">android</span></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {deleteModal.open ? (
        <div className="app-modal-overlay z-[71]" onClick={closeDeleteModal}>
          <div className="app-modal-panel max-w-lg" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Xóa tài sản</h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeDeleteModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              {deleteModal.error ? <div className="app-notice-compact app-notice-error">{deleteModal.error}</div> : null}
              <p className="text-slate-700">
                Bạn có chắc muốn xóa vĩnh viễn tài sản <b>{deleteModal.asset?.assetCode || "-"}</b>?
              </p>
              <p className="text-xs text-slate-500">Thao tác này không thể hoàn tác.</p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={closeDeleteModal} disabled={deleteModal.loading}>
                  Hủy
                </button>
                <button type="button" className="app-btn-danger disabled:opacity-50" onClick={removeAsset} disabled={deleteModal.loading}>
                  {deleteModal.loading ? "Đang xóa..." : "Xóa vĩnh viễn"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="app-modal-overlay z-[70]" onClick={closeCreateModal}>
          <div className="app-modal-panel max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">add_task</span>
                Thêm tài sản mới
              </h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeCreateModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {createError ? <div className="app-notice-compact app-notice-error">{createError}</div> : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Mã tài sản*" value={createForm.assetCode} onChange={(event) => setCreateForm((prev) => ({ ...prev, assetCode: event.target.value }))} />
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Tên tài sản*" value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} />
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={createForm.assetType} onChange={(event) => setCreateForm((prev) => ({ ...prev, assetType: event.target.value }))}>
                  <option value="machine">Máy móc</option>
                  <option value="mold">Khuôn</option>
                  <option value="jig_tool">Jig/Tool</option>
                  <option value="infrastructure">Hạ tầng</option>
                </select>
                <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={createForm.status} onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}>
                  <option value="active">Đang hoạt động</option>
                  <option value="in_repair">Bảo trì</option>
                  <option value="idle">Dừng máy</option>
                  <option value="disposed">Ngưng sử dụng</option>
                </select>
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Vị trí" value={createForm.location} onChange={(event) => setCreateForm((prev) => ({ ...prev, location: event.target.value }))} />
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Hãng" value={createForm.manufacturer} onChange={(event) => setCreateForm((prev) => ({ ...prev, manufacturer: event.target.value }))} />
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Model" value={createForm.model} onChange={(event) => setCreateForm((prev) => ({ ...prev, model: event.target.value }))} />
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Serial" value={createForm.serialNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, serialNumber: event.target.value }))} />
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" type="date" value={createForm.purchaseDate} onChange={(event) => setCreateForm((prev) => ({ ...prev, purchaseDate: event.target.value }))} />
                <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Giá trị" value={createForm.purchasePrice} onChange={(event) => setCreateForm((prev) => ({ ...prev, purchasePrice: event.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="app-btn-secondary" onClick={closeCreateModal}>Hủy</button>
                <button type="button" className="app-btn-primary disabled:opacity-50" disabled={createLoading} onClick={submitCreateAsset}>
                  {createLoading ? "Đang tạo..." : "Tạo tài sản"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {actionModal ? (
        <div className="app-modal-overlay z-[70]" onClick={closeActionModal}>
          <div className="app-modal-panel max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">
                  {actionModal.mode === "view" ? "visibility" : "edit_square"}
                </span>
                {actionModal.mode === "view" ? "Chi tiết tài sản" : "Chỉnh sửa tài sản"}
              </h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={closeActionModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5">
              {modalLoading ? (
                <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
              ) : actionModal.mode === "view" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-slate-600">Mã tài sản:</span> {actionModal.asset?.assetCode || "-"}</div>
                  <div><span className="font-semibold text-slate-600">Loại:</span> {mapTypeLabel(actionModal.asset?.assetType || "")}</div>
                  <div><span className="font-semibold text-slate-600">Tên:</span> {actionModal.asset?.name || "-"}</div>
                  <div><span className="font-semibold text-slate-600">Trạng thái:</span> {mapStatusLabel(actionModal.asset?.status || "").text}</div>
                  <div><span className="font-semibold text-slate-600">Vị trí:</span> {actionModal.asset?.location || "-"}</div>
                  <div><span className="font-semibold text-slate-600">Ngày mua:</span> {toDisplayDate(actionModal.asset?.purchaseDate)}</div>
                  <div><span className="font-semibold text-slate-600">Hãng:</span> {actionModal.asset?.manufacturer || "-"}</div>
                  <div><span className="font-semibold text-slate-600">Model:</span> {actionModal.asset?.model || "-"}</div>
                  <div><span className="font-semibold text-slate-600">Serial:</span> {actionModal.asset?.serialNumber || "-"}</div>
                  <div><span className="font-semibold text-slate-600">Giá trị:</span> {toCurrency(actionModal.asset?.purchasePrice)}</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalError ? <div className="app-notice-compact app-notice-error">{modalError}</div> : null}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Tên tài sản" value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
                    <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={editForm.status} onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}>
                      <option value="active">Đang hoạt động</option>
                      <option value="in_repair">Bảo trì</option>
                      <option value="idle">Dừng máy</option>
                      <option value="disposed">Ngưng sử dụng</option>
                    </select>
                    <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Vị trí" value={editForm.location} onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))} />
                    <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Hãng" value={editForm.manufacturer} onChange={(event) => setEditForm((prev) => ({ ...prev, manufacturer: event.target.value }))} />
                    <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Model" value={editForm.model} onChange={(event) => setEditForm((prev) => ({ ...prev, model: event.target.value }))} />
                    <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" placeholder="Serial" value={editForm.serialNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, serialNumber: event.target.value }))} />
                    <input className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50 md:col-span-2" placeholder="Giá trị" value={editForm.purchasePrice} onChange={(event) => setEditForm((prev) => ({ ...prev, purchasePrice: event.target.value }))} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" className="app-btn-secondary" onClick={closeActionModal}>Hủy</button>
                    <button type="button" className="app-btn-primary disabled:opacity-50" disabled={modalLoading} onClick={submitEditAsset}>
                      {modalLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              )}
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
              <p>1. Dùng ô tìm kiếm để lọc tài sản theo mã, tên, vị trí hoặc serial.</p>
              <p>2. Dùng bộ lọc loại và trạng thái để thu hẹp danh sách.</p>
              <p>3. Theo dõi thông báo chuông để xử lý nhanh tài sản dừng máy hoặc đang bảo trì.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AssetsPage;




