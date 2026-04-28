import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuthStore } from "../../store/authStore";
import { useDashboard } from "../../hooks/useDashboard";
import "./style.css";

function formatNowTime(value) {
  return new Date(value || Date.now()).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapPriority(priority) {
  if (priority === "urgent") return { label: "Khẩn cấp", tone: "text-error", dot: "bg-error" };
  if (priority === "high") return { label: "Cao", tone: "text-amber-600", dot: "bg-amber-500" };
  if (priority === "medium") return { label: "Trung bình", tone: "text-blue-600", dot: "bg-blue-600" };
  return { label: "Thấp", tone: "text-slate-500", dot: "bg-slate-400" };
}

function mapStatus(status) {
  if (status === "in_progress") return { label: "Đang thực hiện", cls: "bg-[#4edea3]/10 text-tertiary-fixed-dim" };
  if (status === "pending_approval") return { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700" };
  if (status === "approved") return { label: "Đã duyệt", cls: "bg-blue-100 text-blue-700" };
  if (status === "done") return { label: "Hoàn thành", cls: "bg-slate-100 text-slate-500" };
  if (status === "rejected") return { label: "Từ chối", cls: "bg-error-container text-error" };
  return { label: "Bản nháp", cls: "bg-violet-100 text-violet-700" };
}

function buildNotifications(stats, workOrders) {
  const items = [];
  if (stats.overdueOrders > 0) {
    items.push({ id: "overdue", level: "error", text: `Có ${stats.overdueOrders} lệnh công việc quá hạn cần xử lý.` });
  }
  if (stats.maintenanceNeeded > 0) {
    items.push({ id: "maintenance", level: "warning", text: `Có ${stats.maintenanceNeeded} tài sản cần bảo trì.` });
  }
  const pending = workOrders.filter((item) => item.status === "pending_approval").length;
  if (pending > 0) {
    items.push({ id: "pending", level: "info", text: `Có ${pending} work order đang chờ duyệt.` });
  }
  return items;
}

function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const canCreateWorkOrder = ["admin", "site_manager", "technician"].includes(user?.role);
  const isViewOnly = !canCreateWorkOrder;
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const notificationsRef = useRef(null);

  const { loading, refreshing, error, stats, chart, maxBarValue, donut, allWorkOrders, recentWorkOrders, lastUpdatedAt } = useDashboard();

  const subtitleTime = useMemo(() => formatNowTime(lastUpdatedAt), [lastUpdatedAt]);
  const notifications = useMemo(() => buildNotifications(stats, allWorkOrders), [stats, allWorkOrders]);

  const filteredWorkOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return recentWorkOrders;
    return allWorkOrders
      .filter((wo) => {
        const haystack = [
          wo.woCode,
          wo.assetId?.name,
          wo.assetId?.assetCode,
          wo.assignedTo?.name,
          wo.createdBy?.name,
          wo.woType,
          wo.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword);
      })
      .slice(0, 20);
  }, [searchTerm, allWorkOrders, recentWorkOrders]);

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate("/auth", { replace: true });
  };

  const topHeights = chart.map((item) => {
    const total = item.completed + item.inProgress;
    if (!total) return 0;
    const totalHeight = (total / maxBarValue) * 80;
    return (item.inProgress / total) * totalHeight;
  });

  const bottomHeights = chart.map((item) => {
    const total = item.completed + item.inProgress;
    if (!total) return 0;
    const totalHeight = (total / maxBarValue) * 80;
    return (item.completed / total) * totalHeight;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  return (
    <>
      <AppShell
      currentKey="dashboard"
      user={user}
      search={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Tìm kiếm tài sản, mã số hoặc vị trí..."
      notifications={notifications.map((item) => ({
        ...item,
        tone:
          item.level === "error"
            ? "bg-red-50 text-red-700"
            : item.level === "warning"
              ? "bg-amber-50 text-amber-700"
              : "bg-blue-50 text-blue-700",
      }))}
      notificationsRef={notificationsRef}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      setShowHelp={setShowHelp}
      onLogout={handleLogout}
      >
        <div className="shell-page-wrap space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="app-page-title">Bảng điều khiển Tổng quát</h2>
              <p className="app-page-subtitle">
                Dữ liệu vận hành thời gian thực tính đến {subtitleTime} hôm nay.
                {refreshing ? " (Đang cập nhật...)" : ""}
              </p>
            </div>
            <button
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg ${
                canCreateWorkOrder
                  ? "bg-primary-container text-[#4edea3] hover:bg-primary shadow-primary/10"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed shadow-transparent"
              }`}
              type="button"
              onClick={() => {
                if (canCreateWorkOrder) navigate("/work-orders");
              }}
              disabled={!canCreateWorkOrder}
            >
              <span className="material-symbols-outlined text-lg">add_task</span>
              {canCreateWorkOrder ? "Tạo Lệnh Công Việc" : "Chế Độ Chỉ Xem"}
            </button>
          </div>

          {isViewOnly ? (
            <div className="app-notice app-notice-info">
              Tài khoản của bạn đang ở chế độ xem. Bạn vẫn theo dõi toàn bộ dashboard theo thời gian thực, nhưng không tạo mới lệnh công việc.
            </div>
          ) : null}

          {error ? <div className="app-notice app-notice-error">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-surface-container-low rounded-lg text-primary"><span className="material-symbols-outlined text-2xl">precision_manufacturing</span></div>
                <div className="h-6 w-16 opacity-30 flex items-end gap-1"><div className="w-1 bg-primary h-2"></div><div className="w-1 bg-primary h-4"></div><div className="w-1 bg-primary h-3"></div><div className="w-1 bg-primary h-5"></div><div className="w-1 bg-primary h-4"></div></div>
              </div>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Tổng số tài sản</p>
              <h3 className="text-2xl font-bold text-primary mt-1 tabular-nums">{loading ? "..." : stats.totalAssets.toLocaleString("vi-VN")}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim rounded-lg"><span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span></div>
                <div className="h-6 w-16 opacity-40 flex items-end gap-1"><div className="w-1 bg-[#4edea3] h-4"></div><div className="w-1 bg-[#4edea3] h-5"></div><div className="w-1 bg-[#4edea3] h-5"></div><div className="w-1 bg-[#4edea3] h-4"></div><div className="w-1 bg-[#4edea3] h-5"></div></div>
              </div>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Đang hoạt động</p>
              <h3 className="text-2xl font-bold text-primary mt-1 tabular-nums">{loading ? "..." : stats.activeAssets.toLocaleString("vi-VN")}</h3>
              <p className="text-[10px] font-bold text-tertiary-fixed-dim mt-2 bg-tertiary-fixed-dim/10 px-2 py-0.5 rounded w-fit">{loading ? "..." : `${stats.activeRate}% Hiệu suất`}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-4"><div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><span className="material-symbols-outlined text-2xl">warning</span></div><div className="h-6 w-16 opacity-30 flex items-end gap-1"><div className="w-1 bg-amber-600 h-2"></div><div className="w-1 bg-amber-600 h-3"></div><div className="w-1 bg-amber-600 h-5"></div><div className="w-1 bg-amber-600 h-4"></div><div className="w-1 bg-amber-600 h-3"></div></div></div>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Cần bảo trì</p>
              <h3 className="text-2xl font-bold text-primary mt-1 tabular-nums">{loading ? "..." : stats.maintenanceNeeded.toLocaleString("vi-VN")}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-4"><div className="p-2 bg-secondary-container text-secondary rounded-lg"><span className="material-symbols-outlined text-2xl">pending_actions</span></div><div className="h-6 w-16 opacity-30 flex items-end gap-1"><div className="w-1 bg-secondary h-4"></div><div className="w-1 bg-secondary h-3"></div><div className="w-1 bg-secondary h-4"></div><div className="w-1 bg-secondary h-5"></div><div className="w-1 bg-secondary h-2"></div></div></div>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Lệnh công việc mở</p>
              <h3 className="text-2xl font-bold text-primary mt-1 tabular-nums">{loading ? "..." : stats.openOrders.toLocaleString("vi-VN")}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-4"><div className="p-2 bg-error-container text-error rounded-lg"><span className="material-symbols-outlined text-2xl">error</span></div><div className="h-6 w-16 opacity-30 flex items-end gap-1"><div className="w-1 bg-error h-1"></div><div className="w-1 bg-error h-2"></div><div className="w-1 bg-error h-3"></div><div className="w-1 bg-error h-1"></div><div className="w-1 bg-error h-2"></div></div></div>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Bảo trì quá hạn</p>
              <h3 className="text-2xl font-bold text-error mt-1 tabular-nums">{loading ? "..." : stats.overdueOrders.toLocaleString("vi-VN")}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200/70 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h4 className="text-lg font-bold text-primary">Tiến độ lệnh công việc</h4>
                  <p className="text-xs text-on-surface-variant">Thống kê trong 7 ngày qua</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant"><span className="w-3 h-3 bg-primary-container rounded-sm"></span> Hoàn thành</div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant"><span className="w-3 h-3 bg-tertiary-fixed-dim rounded-sm"></span> Đang thực hiện</div>
                </div>
              </div>

              <div className="h-64 flex items-end justify-between px-4">
                {chart.map((item, idx) => (
                  <div className="flex flex-col items-center gap-3 w-full" key={item.key}>
                    <div className="w-8 flex flex-col gap-1 items-center justify-end h-full">
                      <div className="w-full bg-tertiary-fixed-dim rounded-t-sm" style={{ height: `${topHeights[idx]}%` }}></div>
                      <div className="w-full bg-primary-container" style={{ height: `${bottomHeights[idx]}%` }}></div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200/70 shadow-sm flex flex-col">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-primary">Trạng thái tài sản</h4>
                <p className="text-xs text-on-surface-variant">Phân bổ theo danh mục</p>
              </div>
              <div className="relative flex-1 flex items-center justify-center">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 36 36">
                  <circle className="stroke-[#4edea3]" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
                  <circle className="stroke-[#fbbf24]" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${donut.warningPct}, 100`} strokeDashoffset={-donut.goodPct} strokeWidth="3" />
                  <circle className="stroke-[#ba1a1a]" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${donut.errorPct}, 100`} strokeDashoffset={-(donut.goodPct + donut.warningPct)} strokeWidth="3" />
                </svg>
                <div className="absolute text-center">
                  <span className="block text-3xl font-extrabold text-primary">{loading ? "..." : donut.totalAssets.toLocaleString("vi-VN")}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tổng tài sản</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4edea3]"></span><span className="text-xs font-medium text-on-surface-variant">Tốt ({donut.goodPct}%)</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span><span className="text-xs font-medium text-on-surface-variant">Cảnh báo ({donut.warningPct}%)</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span><span className="text-xs font-medium text-on-surface-variant">Lỗi ({donut.errorPct}%)</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden border border-slate-200/70 shadow-sm">
            <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-surface-container-low">
              <h4 className="text-lg font-bold text-primary">Lệnh công việc gần đây</h4>
              <button className="text-sm font-semibold text-on-primary-container hover:text-primary transition-colors flex items-center gap-1" type="button" onClick={() => navigate("/work-orders")}>
                {searchTerm.trim() ? `Kết quả: ${filteredWorkOrders.length}` : "Xem tất cả"}
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mã Lệnh</th>
                    <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên Tài Sản</th>
                    <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Loại</th>
                    <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Người thực hiện</th>
                    <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Độ ưu tiên</th>
                    <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredWorkOrders.map((wo) => {
                    const priority = mapPriority(wo.priority);
                    const status = mapStatus(wo.status);
                    return (
                      <tr className="hover:bg-surface-container-low/30 transition-colors" key={wo._id || wo.woCode}>
                        <td className="px-8 py-4 text-sm font-bold text-primary">{wo.woCode || "-"}</td>
                        <td className="px-8 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">settings_input_component</span></div><span className="text-sm font-medium">{wo.assetId?.name || "-"}</span></div></td>
                        <td className="px-8 py-4 text-sm text-on-surface-variant">{wo.woType || "-"}</td>
                        <td className="px-8 py-4 text-sm">{wo.assignedTo?.name || wo.createdBy?.name || "-"}</td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex items-center gap-1 whitespace-nowrap ${priority.tone} text-[11px] font-black uppercase`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                            <span>{priority.label}</span>
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${status.cls}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filteredWorkOrders.length === 0 ? (
                    <tr><td className="px-8 py-8 text-sm text-on-surface-variant text-center" colSpan="6">Không tìm thấy dữ liệu phù hợp.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>

      {showHelp ? (
        <div className="app-modal-overlay z-[60]" onClick={() => setShowHelp(false)}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-primary">Hướng dẫn nhanh</h3>
            </div>
            <div className="px-6 py-5 text-sm text-slate-700 space-y-3">
              <p>1. Dùng ô tìm kiếm để lọc nhanh Work Order theo mã, tài sản hoặc người thực hiện.</p>
              <p>2. Nhấn chuông để xem cảnh báo quá hạn, tài sản cần bảo trì và lệnh chờ duyệt.</p>
              <p>3. Theo dõi biểu đồ và thẻ KPI để nắm trạng thái vận hành theo thời gian thực.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default DashboardPage;




