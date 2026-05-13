import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useAuthStore } from "../../store/authStore";
import { useDashboard } from "../../hooks/useDashboard";
import { buildChartHeights, buildDashboardNotifications, buildWorkOrderSearchText, formatNowTime, mapNotificationTone, mapPriority, mapStatus } from "./helpers";
import "./style.css";
import TableStateRow from "../../components/ui/TableStateRow";
import KpiSkeletonCard from "../../components/ui/KpiSkeletonCard";

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
  const notifications = useMemo(() => buildDashboardNotifications(stats, allWorkOrders), [stats, allWorkOrders]);

  const filteredWorkOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return recentWorkOrders;
    return allWorkOrders
      .filter((wo) => buildWorkOrderSearchText(wo).includes(keyword))
      .slice(0, 20);
  }, [searchTerm, allWorkOrders, recentWorkOrders]);

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate("/auth", { replace: true });
  };

  const chartHeights = useMemo(() => buildChartHeights(chart, maxBarValue), [chart, maxBarValue]);

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
        searchPlaceholder="Tìm kiếm lệnh công việc, tài sản hoặc người thực hiện..."
        notifications={notifications.map(mapNotificationTone)}
        notificationsRef={notificationsRef}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        setShowHelp={setShowHelp}
        onLogout={handleLogout}
      >
        <div className="shell-page-wrap space-y-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
            <div>
              <h1 className="app-page-title">Bảng điều khiển Tổng quát</h1>
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

          {error ? <div className="app-notice app-notice-error" role="alert">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {loading ? (
              <>
                <KpiSkeletonCard />
                <KpiSkeletonCard />
                <KpiSkeletonCard />
                <KpiSkeletonCard />
                <KpiSkeletonCard />
              </>
            ) : (
              <>
                  <div className="app-kpi-card border-l-4 border-[#111827]">
                    <p className="app-kpi-title">Tổng số tài sản</p>
                    <div className="flex items-end gap-3">
                      <span className="app-kpi-value tabular-nums">{stats.totalAssets.toLocaleString("vi-VN")}</span>
                    </div>
                  </div>

                  <div className="app-kpi-card border-l-4 border-[#4edea3]">
                    <p className="app-kpi-title">Đang hoạt động</p>
                    <div className="flex items-end gap-3">
                      <span className="app-kpi-value tabular-nums">{stats.activeAssets.toLocaleString("vi-VN")}</span>
                      <span className="text-[10px] font-bold text-tertiary-fixed-dim mb-1 bg-tertiary-fixed-dim/10 px-2 py-0.5 rounded whitespace-nowrap">{`${stats.activeRate}% Hiệu suất`}</span>
                    </div>
                  </div>

                  <div className="app-kpi-card border-l-4 border-[#f59e0b]">
                    <p className="app-kpi-title">Cần bảo trì</p>
                    <div className="flex items-end gap-3">
                      <span className="app-kpi-value tabular-nums">{stats.maintenanceNeeded.toLocaleString("vi-VN")}</span>
                    </div>
                  </div>

                  <div className="app-kpi-card border-l-4 border-primary">
                    <p className="app-kpi-title">Lệnh công việc mở</p>
                    <div className="flex items-end gap-3">
                      <span className="app-kpi-value tabular-nums">{stats.openOrders.toLocaleString("vi-VN")}</span>
                    </div>
                  </div>

                  <div className="app-kpi-card border-l-4 border-[#b91c1c]">
                    <p className="app-kpi-title">Bảo trì quá hạn</p>
                    <div className="flex items-end gap-3">
                      <span className="app-kpi-value text-error tabular-nums">{stats.overdueOrders.toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200/70 shadow-sm">
              <div className="mb-10">
                <h4 className="text-lg font-bold text-primary">Tiến độ lệnh công việc</h4>
                <p className="text-xs text-on-surface-variant">Thống kê trong 7 ngày qua</p>
                <div className="mt-3 flex items-center gap-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant"><span className="w-3 h-3 bg-primary-container rounded-sm"></span> Hoàn thành</div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant"><span className="w-3 h-3 bg-tertiary-fixed-dim rounded-sm"></span> Đang thực hiện</div>
                </div>
              </div>

              <div className="h-64 flex items-end justify-between px-4">
                {chart.map((item, idx) => (
                  <div className="flex flex-col items-center gap-3 w-full" key={item.key}>
                    <div className="w-8 flex flex-col gap-1 items-center justify-end h-full">
                      <div className="w-full bg-tertiary-fixed-dim rounded-t-sm" style={{ height: `${chartHeights[idx].topHeight}%` }}></div>
                      <div className="w-full bg-primary-container" style={{ height: `${chartHeights[idx].bottomHeight}%` }}></div>
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

          <div className="app-surface-card">
            <div className="px-8 py-6 border-b border-surface-container-low">
              <h4 className="text-lg font-bold text-primary">Lệnh công việc gần đây</h4>
              <button className="mt-2 text-sm font-semibold text-on-primary-container hover:text-primary transition-colors flex items-center gap-1" type="button" onClick={() => navigate("/work-orders")}>
                {searchTerm.trim() ? `Kết quả: ${filteredWorkOrders.length}` : "Xem tất cả"}
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </button>
            </div>
            <div className="app-table-wrap">
              <table className="app-table min-w-[920px]">
                <caption className="sr-only">Danh sách lệnh công việc gần đây</caption>
                <thead>
                  <tr className="app-table-head-row">
                    <th className="app-table-head-cell px-8">Mã Lệnh</th>
                    <th className="app-table-head-cell px-8">Tên Tài Sản</th>
                    <th className="app-table-head-cell px-8">Loại</th>
                    <th className="app-table-head-cell px-8">Người thực hiện</th>
                    <th className="app-table-head-cell px-8">Độ ưu tiên</th>
                    <th className="app-table-head-cell px-8">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="app-table-body app-table-divider">
                  {filteredWorkOrders.map((wo) => {
                    const priority = mapPriority(wo.priority);
                    const status = mapStatus(wo.status);
                    return (
                      <tr className="app-table-body-row" key={wo._id || wo.woCode}>
                        <td className="px-8 py-4 text-sm font-bold text-primary whitespace-nowrap truncate">{wo.woCode || "-"}</td>
                        <td className="px-8 py-4"><div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-slate-400 shrink-0"><span className="material-symbols-outlined text-sm">settings_input_component</span></div><span className="text-sm font-medium whitespace-nowrap truncate">{wo.assetId?.name || "-"}</span></div></td>
                        <td className="px-8 py-4 text-sm text-on-surface-variant whitespace-nowrap truncate">{wo.woType || "-"}</td>
                        <td className="px-8 py-4 text-sm whitespace-nowrap truncate">{wo.assignedTo?.name || wo.createdBy?.name || "-"}</td>
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
                  {loading ? (
                    <TableStateRow colSpan={6} type="loading" message="Đang tải lệnh công việc gần đây..." />
                  ) : null}
                  {!loading && filteredWorkOrders.length === 0 ? (
                    <TableStateRow colSpan={6} type="empty" message="Không tìm thấy dữ liệu phù hợp." />
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




