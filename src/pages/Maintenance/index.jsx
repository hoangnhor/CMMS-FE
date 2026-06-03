import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuthStore } from "../../store/authStore";
import { logoutApi } from "../../services/auth.api";
import { listAssetsApi } from "../../services/asset.api";
import { listWorkOrdersApi } from "../../services/workOrder.api";
import { createPmScheduleApi, listPmSchedulesApi } from "../../services/maintenance.api";
import { subscribeRealtime } from "../../services/realtime";
import { readQueryCache } from "../../utils/queryCache";
import {
  PAGE_SIZE,
  buildDueByAsset,
  buildScheduleSearchText,
  buildScheduleStatus,
  mapIntervalLabel,
  toDisplayDate,
} from "./helpers";
import "./style.css";
import TableStateRow from "../../components/ui/TableStateRow";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

function MaintenancePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const canManageMaintenance = ["admin", "site_manager"].includes(user?.role);

  const [assets, setAssets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const notificationsRef = useRef(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [page, setPage] = useState(1);
  const [showSmartFilter, setShowSmartFilter] = useState(false);
  const [assetFilter, setAssetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [createForm, setCreateForm] = useState({
    assetId: "",
    triggerType: "days",
    intervalValue: "30",
    isActive: true,
  });
  const debouncedSearch = useDebouncedValue(search, 300);
  const controlBaseClass = "app-toolbar-control";

  const showNotice = (type, text) => setNotice({ type, text });

  const loadData = useCallback(async ({ silent = false } = {}) => {
    let usedCachedSnapshot = false;
    try {
      if (!silent) setLoading(true);
      setError("");
      const assetsCache = readQueryCache("GET", "/assets", { params: {} });
      if (assetsCache) {
        usedCachedSnapshot = true;
        setAssets(Array.isArray(assetsCache?.data) ? assetsCache.data : []);
      }
      const workOrdersCache = readQueryCache("GET", "/work-orders", { params: {} });
      if (workOrdersCache) {
        usedCachedSnapshot = true;
        setWorkOrders(Array.isArray(workOrdersCache?.data) ? workOrdersCache.data : []);
      }
      const schedulesCache = canManageMaintenance
        ? readQueryCache("GET", "/pm-schedules", { params: {} })
        : null;
      if (schedulesCache) {
        usedCachedSnapshot = true;
        setSchedules(Array.isArray(schedulesCache?.data) ? schedulesCache.data : []);
      }
      let assetsRes;
      let schedulesRes;
      let workOrdersRes;

      if (canManageMaintenance) {
        [assetsRes, schedulesRes, workOrdersRes] = await Promise.all([
          listAssetsApi(),
          listPmSchedulesApi(),
          listWorkOrdersApi(),
        ]);
      } else {
        [assetsRes, workOrdersRes] = await Promise.all([
          listAssetsApi(),
          listWorkOrdersApi(),
        ]);
        schedulesRes = { data: [] };
      }

      setAssets(Array.isArray(assetsRes?.data) ? assetsRes.data : []);
      setSchedules(Array.isArray(schedulesRes?.data) ? schedulesRes.data : []);
      setWorkOrders(Array.isArray(workOrdersRes?.data) ? workOrdersRes.data : []);
    } catch (err) {
      if (!usedCachedSnapshot) {
        setError(err?.response?.data?.message || err?.message || "Không tải được dữ liệu bảo trì");
        setAssets([]);
        setSchedules([]);
        setWorkOrders([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [canManageMaintenance]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  useEffect(() => {
    let timeoutId = null;
    const onChanged = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        loadData({ silent: true });
      }, 250);
    };
    const unsub = subscribeRealtime(["maintenance_log.changed", "pm_schedule.changed", "work_order.changed"], onChanged);
    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadData]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showNotifications]);

  const filteredSchedules = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    if (!keyword) return schedules;
    return schedules.filter((item) => buildScheduleSearchText(item).includes(keyword));
  }, [schedules, debouncedSearch]);

  const dueByAsset = useMemo(() => buildDueByAsset(workOrders), [workOrders]);

  const scheduleRows = useMemo(() => {
    const rows = filteredSchedules.map((item) => {
      const dueDate = dueByAsset.get(String(item.assetId?._id));
      const statusData = buildScheduleStatus(item, dueDate);
      const statusKey =
        statusData.dayDiff === null
          ? "unknown"
          : statusData.dayDiff < 0
            ? "overdue"
            : statusData.dayDiff <= 7
              ? "upcoming"
              : "scheduled";

      return {
        ...item,
        dueDate,
        ...statusData,
        statusKey,
      };
    });
    return rows.filter((item) => {
      if (assetFilter && String(item.assetId?._id) !== assetFilter) return false;
      if (statusFilter && item.statusKey !== statusFilter) return false;
      if (triggerFilter && item.triggerType !== triggerFilter) return false;
      return true;
    });
  }, [filteredSchedules, dueByAsset, assetFilter, statusFilter, triggerFilter]);

  const totalPages = Math.max(1, Math.ceil(scheduleRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = scheduleRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const smartFilterCount = [triggerFilter].filter(Boolean).length;

  const goPage = (value) => {
    const next = Math.max(1, Math.min(totalPages, value));
    setPage(next);
  };

  const activePlans = scheduleRows.filter((item) => item.isActive).length;
  const upcoming7Days = scheduleRows.filter((item) => item.dayDiff !== null && item.dayDiff >= 0 && item.dayDiff <= 7).length;
  const overdueCount = scheduleRows.filter((item) => item.dayDiff !== null && item.dayDiff < 0).length;

  const notifications = useMemo(() => {
    const rows = [];
    if (overdueCount > 0) rows.push({ id: "overdue", tone: "bg-red-50 text-red-700", text: `Có ${overdueCount} kế hoạch bảo trì quá hạn.` });
    if (upcoming7Days > 0) rows.push({ id: "upcoming", tone: "bg-amber-50 text-amber-700", text: `Có ${upcoming7Days} kế hoạch sắp đến hạn 7 ngày.` });
    if (activePlans > 0) rows.push({ id: "active", tone: "bg-emerald-50 text-emerald-700", text: `${activePlans} kế hoạch PM đang hoạt động.` });
    return rows;
  }, [activePlans, upcoming7Days, overdueCount]);

  const createSchedule = async () => {
    if (!canManageMaintenance) {
      showNotice("error", "Bạn không có quyền tạo lịch bảo trì.");
      return;
    }
    if (!createForm.assetId) {
      setCreateError("Vui lòng chọn tài sản.");
      return;
    }
    const intervalValue = Number(createForm.intervalValue);
    if (Number.isNaN(intervalValue) || intervalValue <= 0) {
      setCreateError("Chu kỳ bảo trì không hợp lệ.");
      return;
    }
    try {
      setCreateError("");
      setCreateLoading(true);
      await createPmScheduleApi({
        assetId: createForm.assetId,
        triggerType: createForm.triggerType,
        intervalValue,
        isActive: createForm.isActive,
      });
      setCreateForm((prev) => ({ ...prev, intervalValue: "30" }));
      await loadData({ silent: true });
      showNotice("success", "Đã tạo kế hoạch bảo trì.");
      setShowCreateModal(false);
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || "Tạo kế hoạch thất bại.");
    } finally {
      setCreateLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Mã tài sản", "Tên tài sản", "Trigger", "Chu kỳ", "Ngày dự kiến", "Trạng thái"];
    const rows = scheduleRows.map((item) => [
      item.assetId?.assetCode || "",
      item.assetId?.name || "",
      item.triggerType || "",
      mapIntervalLabel(item.triggerType, item.intervalValue),
      toDisplayDate(item.dueDate),
      item.statusLabel || "",
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `maintenance_plans_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

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

  useEffect(() => {
    if (!notice.text) return undefined;
    const timer = setTimeout(() => setNotice({ type: "", text: "" }), 3500);
    return () => clearTimeout(timer);
  }, [notice.text]);

  return (
    <>
      <AppShell
        currentKey="maintenance"
        user={user}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm kiếm kế hoạch, tài sản hoặc mã số..."
        notifications={notifications}
        notificationsRef={notificationsRef}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        setShowHelp={setShowHelp}
        onLogout={handleLogout}
      >
        <div className="shell-page-wrap space-y-8">
          {notice.text ? (
            <div className={`app-notice mb-6 ${notice.type === "error" ? "app-notice-error" : "app-notice-success"}`}>
              <span>{notice.text}</span>
              <button type="button" className="app-notice-close" onClick={() => setNotice({ type: "", text: "" })}><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
          ) : null}
          {error ? <div className="app-notice app-notice-error mb-6">{error}</div> : null}

          <div className="mb-8">
            <h1 className="app-page-title">Quản lý Bảo trì</h1>
            <p className="app-page-subtitle">Theo dõi kế hoạch định kỳ, kiểm soát trạng thái và tối ưu lịch vận hành thiết bị.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="app-kpi-card relative overflow-hidden group transition-all hover:shadow-md border-l-4 border-[#4edea3]">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">settings_suggest</span></div>
              <p className="app-kpi-title">Kế hoạch đang thực hiện</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">{loading ? "..." : activePlans}</span>
                <span className="text-[#4edea3] text-[10px] font-bold mb-1">+{loading ? "0" : Math.max(0, activePlans - overdueCount)}</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-tertiary-fixed-dim" style={{ width: `${Math.min(100, activePlans * 8)}%` }} /></div>
            </div>

            <div className="app-kpi-card relative overflow-hidden group transition-all hover:shadow-md border-l-4 border-amber-400">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">schedule</span></div>
              <p className="app-kpi-title">Sắp đến hạn (7 ngày)</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">{loading ? "..." : String(upcoming7Days).padStart(2, "0")}</span>
                <span className="text-amber-500 text-xs font-medium mb-1 italic">Cần kiểm tra</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${Math.min(100, upcoming7Days * 12)}%` }} /></div>
            </div>

            <div className="app-kpi-card relative overflow-hidden group transition-all hover:shadow-md border-l-4 border-error">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl text-error">warning</span></div>
              <p className="app-kpi-title">Quá hạn bảo trì</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">{loading ? "..." : String(overdueCount).padStart(2, "0")}</span>
                <span className="px-2 py-1 bg-error/10 text-error text-[10px] font-bold rounded mb-1 uppercase">Rủi ro cao</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-error" style={{ width: `${Math.min(100, overdueCount * 20)}%` }} /></div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <section className="flex-1 app-surface-card">
              <div className="px-8 py-6 flex flex-col items-start gap-3">
                <div className="app-toolbar-grid items-stretch">
                  <button
                    className={`${controlBaseClass} flex items-center justify-center gap-2 whitespace-nowrap bg-surface-container-high px-4 rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors`}
                    type="button"
                    onClick={() => setShowSmartFilter((prev) => !prev)}
                  >
                    <span className="material-symbols-outlined text-sm">filter_alt</span>
                    <span className="truncate">Bộ lọc thông minh{smartFilterCount > 0 ? ` (${smartFilterCount})` : ""}</span>
                  </button>
                  <select className={`${controlBaseClass} bg-white border-none rounded-lg shadow-sm focus:ring-1 focus:ring-[#4edea3] py-0 pl-4 pr-8 appearance-none bg-[right_0.7rem_center] bg-no-repeat`} value={assetFilter} onChange={(event) => { setAssetFilter(event.target.value); goPage(1); }}>
                    <option value="">Tất cả tài sản</option>
                    {assets.map((asset) => (
                      <option key={asset._id} value={asset._id}>{asset.name}</option>
                    ))}
                  </select>
                  <select className={`${controlBaseClass} bg-white border-none rounded-lg shadow-sm focus:ring-1 focus:ring-[#4edea3] py-0 pl-4 pr-8 appearance-none bg-[right_0.7rem_center] bg-no-repeat`} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); goPage(1); }}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="scheduled">Đúng kế hoạch</option>
                    <option value="upcoming">Sắp đến hạn</option>
                    <option value="overdue">Quá hạn</option>
                  </select>
                  {canManageMaintenance ? (
                    <button
                      className={`${controlBaseClass} whitespace-nowrap bg-primary text-white px-5 rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50`}
                      type="button"
                      onClick={() => {
                        setCreateError("");
                        setShowCreateModal(true);
                      }}
                      disabled={!canManageMaintenance}
                    >
                      <span className="material-symbols-outlined text-sm mr-2">add</span>
                      Tạo kế hoạch mới
                    </button>
                  ) : (
                    <button className={`${controlBaseClass} whitespace-nowrap bg-slate-300 text-slate-600 px-5 rounded-lg flex items-center justify-center cursor-not-allowed`} type="button" disabled title="Bạn chỉ có quyền xem">
                      <span className="material-symbols-outlined text-sm mr-2">visibility</span>
                      Chỉ xem
                    </button>
                  )}
                  <button
                    className={`${controlBaseClass} whitespace-nowrap bg-primary text-white px-5 rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform`}
                    type="button"
                    onClick={exportCsv}
                    title="Xuất CSV"
                    aria-label="Xuất danh sách kế hoạch CSV"
                  >
                    <span className="material-symbols-outlined text-sm mr-2">download</span>
                    Xuất CSV
                  </button>
                </div>
              </div>
              {showSmartFilter ? (
                <div className="px-8 pb-4">
                  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select className="bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-[#4edea3]/50" value={triggerFilter} onChange={(event) => { setTriggerFilter(event.target.value); goPage(1); }}>
                        <option value="">Loại trigger: tất cả</option>
                        <option value="days">Theo ngày</option>
                        <option value="hours">Theo giờ</option>
                        <option value="shots">Theo shot</option>
                        <option value="usage_count">Theo số lần dùng</option>
                      </select>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-100" onClick={() => { setTriggerFilter(""); setAssetFilter(""); setStatusFilter(""); setSearch(""); setPage(1); }}>
                        Xóa lọc thông minh
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}
              <div className="app-table-wrap">
                <table className="app-table min-w-[980px]">
                  <thead>
                    <tr className="app-table-head-row">
                      <th className="app-table-head-cell px-8">Tài sản & Mã số</th>
                      <th className="app-table-head-cell px-8">Loại & Tần suất</th>
                      <th className="app-table-head-cell px-8">Ngày dự kiến</th>
                      <th className="app-table-head-cell px-8">Trạng thái / Đếm ngược</th>
                      <th className="app-table-head-cell px-8">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="app-table-body app-table-divider">
                    {pagedRows.map((item) => (
                      <tr key={item._id} className="app-table-body-row">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center text-primary"><span className="material-symbols-outlined">build</span></div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-primary whitespace-nowrap truncate">{item.assetId?.name || "-"}</p>
                              <p className="text-[10px] text-slate-400 font-mono whitespace-nowrap truncate">ID: {item.assetId?.assetCode || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-semibold text-primary whitespace-nowrap truncate">Định kỳ</p>
                          <p className="text-[10px] text-on-surface-variant whitespace-nowrap truncate">{mapIntervalLabel(item.triggerType, item.intervalValue)}</p>
                        </td>
                        <td className="px-8 py-6"><p className="text-sm font-bold text-primary">{toDisplayDate(item.dueDate)}</p></td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${item.statusTone}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.statusDot}`} />
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <button className="app-icon-action" type="button" onClick={() => navigate("/work-orders")} title="Xem chi tiết">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {loading ? <TableStateRow colSpan={5} type="loading" message="Đang tải kế hoạch bảo trì..." /> : null}
                    {!loading && scheduleRows.length === 0 ? <TableStateRow colSpan={5} type="empty" message="Không có kế hoạch phù hợp." /> : null}
                  </tbody>
                </table>
              </div>
              <div className="app-table-footer border-t border-surface-container bg-surface-container-low/30">
                <p className="text-xs text-on-surface-variant italic">Hiển thị {scheduleRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(scheduleRows.length, safePage * PAGE_SIZE)} trên tổng số {scheduleRows.length} kế hoạch</p>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" aria-label="Trang đầu" onClick={() => goPage(1)} disabled={safePage === 1}>
                    <span className="material-symbols-outlined text-[18px]">first_page</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" aria-label="Trang trước" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}>
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <div className="flex items-center px-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold" type="button" aria-current="page">{safePage}</button>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" aria-label="Trang sau" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" type="button" aria-label="Trang cuối" onClick={() => goPage(totalPages)} disabled={safePage === totalPages}>
                    <span className="material-symbols-outlined text-[18px]">last_page</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 opacity-50">
            <div className="h-32 rounded-xl bg-gradient-to-br from-primary-container/10 to-transparent flex items-center justify-center p-8 border border-primary-container/5">
              <p className="text-[10px] font-mono text-primary-container/40 uppercase tracking-[0.2em] text-center">Data Integrity Verified // Maintenance Framework v4.0.2</p>
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-bl from-primary-container/10 to-transparent flex items-center justify-center p-8 border border-primary-container/5">
              <p className="text-[10px] font-mono text-primary-container/40 uppercase tracking-[0.2em] text-center">Precision Engineering Standard // Real-time Synchronization Enabled</p>
            </div>
          </div>
        </div>
      </AppShell>

      {showCreateModal ? (
        <div className="app-modal-overlay z-[70]" onClick={() => { if (!createLoading) setShowCreateModal(false); }}>
          <div className="app-modal-panel max-w-xl" role="dialog" aria-modal="true" aria-label="Tạo kế hoạch bảo trì" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">add_task</span>Tạo kế hoạch mới</h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => { if (!createLoading) setShowCreateModal(false); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!canManageMaintenance ? <div className="app-notice-compact app-notice-info">Tài khoản của bạn chỉ có quyền xem dữ liệu bảo trì.</div> : null}
              {createError ? <div className="app-notice-compact app-notice-error">{createError}</div> : null}
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createSchedule(); }}>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Chọn tài sản</label>
                  <select className="app-select" value={createForm.assetId} aria-invalid={!createForm.assetId} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, assetId: event.target.value }))}>
                    <option value="">Chọn tài sản</option>
                    {assets.map((asset) => <option key={asset._id} value={asset._id}>{asset.assetCode} - {asset.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Loại trigger</label>
                  <select className="app-select" value={createForm.triggerType} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, triggerType: event.target.value }))}>
                    <option value="days">Theo ngày</option>
                    <option value="hours">Theo giờ</option>
                    <option value="shots">Theo shot</option>
                    <option value="usage_count">Theo số lần dùng</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Chu kỳ</label>
                  <input className="app-input" type="number" min="1" value={createForm.intervalValue} aria-invalid={!createForm.intervalValue || Number(createForm.intervalValue) <= 0} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, intervalValue: event.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={createForm.isActive} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, isActive: event.target.checked }))} /> Kích hoạt ngay
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="app-btn-secondary" onClick={() => setShowCreateModal(false)} disabled={createLoading}>Hủy</button>
                  <button className="app-btn-primary disabled:opacity-50" type="submit" disabled={!canManageMaintenance || createLoading || !createForm.assetId || Number(createForm.intervalValue) <= 0}>{createLoading ? "Đang tạo..." : "Lưu kế hoạch"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {showHelp ? (
        <div className="app-modal-overlay z-[60]" onClick={() => setShowHelp(false)}>
          <div className="app-modal-panel max-w-xl" role="dialog" aria-modal="true" aria-label="Hướng dẫn nhanh bảo trì" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-lg font-bold text-primary">Hướng dẫn nhanh</h3></div>
            <div className="px-6 py-5 text-sm text-slate-700 space-y-3">
              <p>1. Theo dõi lịch PM ở bảng kế hoạch theo từng loại trigger.</p>
              <p>2. Quản lý có thể tạo mới lịch PM theo tài sản và chu kỳ.</p>
              <p>3. Dùng nhật ký bảo trì để kiểm tra thời điểm hoàn thành và giờ công.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default MaintenancePage;
