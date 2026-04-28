import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuthStore } from "../../store/authStore";
import { listAssetsApi } from "../../services/asset.api";
import { listWorkOrdersApi } from "../../services/workOrder.api";
import { createPmScheduleApi, listPmSchedulesApi } from "../../services/maintenance.api";
import { subscribeRealtime } from "../../services/realtime";
import "./style.css";

const PAGE_SIZE = 12;

function mapIntervalLabel(triggerType, intervalValue) {
  if (triggerType === "hours") return `${intervalValue} giờ`;
  if (triggerType === "days") return `${intervalValue} ngày`;
  if (triggerType === "shots") return `${intervalValue.toLocaleString("vi-VN")} shot`;
  if (triggerType === "usage_count") return `${intervalValue} lần`;
  return String(intervalValue || "-");
}

function toDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function calcDayDiff(value) {
  if (!value) return null;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  return Math.round((dueStart.getTime() - todayStart.getTime()) / 86400000);
}

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
  const [createForm, setCreateForm] = useState({
    assetId: "",
    triggerType: "days",
    intervalValue: "30",
    isActive: true,
  });

  const showNotice = (type, text) => setNotice({ type, text });

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
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
      setError(err?.response?.data?.message || err?.message || "Không tải được dữ liệu bảo trì");
      setAssets([]);
      setSchedules([]);
      setWorkOrders([]);
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
    const keyword = search.trim().toLowerCase();
    if (!keyword) return schedules;
    return schedules.filter((item) => {
      const text = [item.assetId?.assetCode, item.assetId?.name, item.assetId?.assetType, item.triggerType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [schedules, search]);

  const dueByAsset = useMemo(() => {
    const map = new Map();
    workOrders.forEach((wo) => {
      if (["done", "rejected"].includes(wo.status)) return;
      if (!wo.assetId?._id || !wo.scheduledDate) return;
      const due = new Date(wo.scheduledDate);
      if (Number.isNaN(due.getTime())) return;

      const key = String(wo.assetId._id);
      const prev = map.get(key);
      if (!prev || due.getTime() < prev.getTime()) {
        map.set(key, due);
      }
    });
    return map;
  }, [workOrders]);

  const scheduleRows = useMemo(() => {
    return filteredSchedules.map((item) => {
      const dueDate = dueByAsset.get(String(item.assetId?._id));
      const dayDiff = calcDayDiff(dueDate);

      let statusTone = "bg-surface-container text-on-surface-variant";
      let statusDot = "bg-slate-400";
      let statusLabel = item.isActive ? "Đang hoạt động" : "Tạm dừng";

      if (dayDiff !== null) {
        if (dayDiff < 0) {
          statusTone = "bg-error-container text-error";
          statusDot = "bg-error";
          statusLabel = `Quá hạn ${Math.abs(dayDiff)} ngày`;
        } else if (dayDiff === 0) {
          statusTone = "bg-amber-100 text-amber-700";
          statusDot = "bg-amber-500";
          statusLabel = "Hôm nay";
        } else {
          statusTone = "bg-surface-container text-on-surface-variant";
          statusDot = "bg-slate-400";
          statusLabel = `Còn ${dayDiff} ngày`;
        }
      } else if (item.isActive) {
        statusTone = "bg-[#dcfce7] text-[#166534]";
        statusDot = "bg-[#4ade80]";
      } else {
        statusTone = "bg-slate-200 text-slate-700";
        statusDot = "bg-slate-400";
      }

      return {
        ...item,
        dueDate,
        dayDiff,
        statusTone,
        statusDot,
        statusLabel,
      };
    });
  }, [filteredSchedules, dueByAsset]);

  const totalPages = Math.max(1, Math.ceil(scheduleRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = scheduleRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate("/auth", { replace: true });
  };

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
            <div className={`app-notice mb-6 ${notice.type === "error" ? "app-notice-error" : "app-notice-success"}`}>
              <span>{notice.text}</span>
              <button type="button" className="app-notice-close" onClick={() => setNotice({ type: "", text: "" })}><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
          ) : null}
          {error ? <div className="app-notice app-notice-error mb-6">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">settings_suggest</span></div>
              <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Kế hoạch đang thực hiện</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-primary tracking-tighter">{loading ? "..." : activePlans}</span>
                <span className="text-[#4edea3] text-sm font-bold mb-1">+{loading ? "0" : Math.max(0, activePlans - overdueCount)}</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-tertiary-fixed-dim" style={{ width: `${Math.min(100, activePlans * 8)}%` }} /></div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group shadow-sm transition-all hover:shadow-md border-l-4 border-amber-400">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">schedule</span></div>
              <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Sắp đến hạn (7 ngày)</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-primary tracking-tighter">{loading ? "..." : String(upcoming7Days).padStart(2, "0")}</span>
                <span className="text-amber-500 text-xs font-medium mb-1 italic">Cần kiểm tra</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${Math.min(100, upcoming7Days * 12)}%` }} /></div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group shadow-sm transition-all hover:shadow-md border-l-4 border-error">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl text-error">warning</span></div>
              <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Quá hạn bảo trì</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-error tracking-tighter">{loading ? "..." : String(overdueCount).padStart(2, "0")}</span>
                <span className="px-2 py-1 bg-error/10 text-error text-[10px] font-bold rounded mb-1 uppercase">Rủi ro cao</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-error" style={{ width: `${Math.min(100, overdueCount * 20)}%` }} /></div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <section className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-surface-container">
                <h2 className="text-xl font-extrabold tracking-tight text-primary">Danh sách kế hoạch bảo trì</h2>
                <div className="flex items-center gap-2">
                  <button
                    className="app-btn-primary disabled:opacity-50 flex items-center gap-2"
                    type="button"
                    onClick={() => {
                      setCreateError("");
                      setShowCreateModal(true);
                    }}
                    disabled={!canManageMaintenance}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tạo kế hoạch mới
                  </button>
                  <button className="p-2 hover:bg-surface-container-low rounded transition-colors" type="button" onClick={() => { setSearch(""); setPage(1); }} title="Xóa bộ lọc tìm kiếm"><span className="material-symbols-outlined text-slate-500">filter_list</span></button>
                  <button className="p-2 hover:bg-surface-container-low rounded transition-colors" type="button" onClick={exportCsv} title="Xuất CSV"><span className="material-symbols-outlined text-slate-500">download</span></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Tài sản & Mã số</th>
                      <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Loại & Tần suất</th>
                      <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Ngày dự kiến</th>
                      <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Trạng thái / Đếm ngược</th>
                      <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {pagedRows.map((item) => (
                      <tr key={item._id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center text-primary"><span className="material-symbols-outlined">build</span></div>
                            <div>
                              <p className="text-sm font-bold text-primary">{item.assetId?.name || "-"}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {item.assetId?.assetCode || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-semibold text-primary">Định kỳ</p>
                          <p className="text-[10px] text-on-surface-variant">{mapIntervalLabel(item.triggerType, item.intervalValue)}</p>
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
                    {!loading && scheduleRows.length === 0 ? <tr><td className="px-8 py-8 text-center text-sm text-slate-500" colSpan="5">Không có kế hoạch phù hợp.</td></tr> : null}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-4 bg-surface-container-low/30 border-t border-surface-container flex justify-between items-center">
                <p className="text-xs text-on-surface-variant italic">Hiển thị {scheduleRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(scheduleRows.length, safePage * PAGE_SIZE)} trên tổng số {scheduleRows.length} kế hoạch</p>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" onClick={() => goPage(1)} disabled={safePage === 1}>
                    <span className="material-symbols-outlined text-[18px]">first_page</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}>
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <div className="flex items-center px-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">{safePage}</button>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors disabled:opacity-40" onClick={() => goPage(totalPages)} disabled={safePage === totalPages}>
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
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
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
                  <select className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-[#4edea3]/50" value={createForm.assetId} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, assetId: event.target.value }))}>
                    <option value="">Chọn tài sản</option>
                    {assets.map((asset) => <option key={asset._id} value={asset._id}>{asset.assetCode} - {asset.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Loại trigger</label>
                  <select className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-[#4edea3]/50" value={createForm.triggerType} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, triggerType: event.target.value }))}>
                    <option value="days">Theo ngày</option>
                    <option value="hours">Theo giờ</option>
                    <option value="shots">Theo shot</option>
                    <option value="usage_count">Theo số lần dùng</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Chu kỳ</label>
                  <input className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-[#4edea3]/50" type="number" min="1" value={createForm.intervalValue} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, intervalValue: event.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={createForm.isActive} disabled={!canManageMaintenance} onChange={(event) => setCreateForm((prev) => ({ ...prev, isActive: event.target.checked }))} /> Kích hoạt ngay
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="app-btn-secondary" onClick={() => setShowCreateModal(false)} disabled={createLoading}>Hủy</button>
                  <button className="app-btn-primary disabled:opacity-50" type="submit" disabled={!canManageMaintenance || createLoading}>{createLoading ? "Đang tạo..." : "Lưu kế hoạch"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {showHelp ? (
        <div className="app-modal-overlay z-[60]" onClick={() => setShowHelp(false)}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
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
