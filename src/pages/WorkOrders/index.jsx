import AppShell from "../../components/layout/AppShell";
import WorkOrderModals from "./WorkOrderModals";
import WorkOrdersTable from "./WorkOrdersTable";
import { useWorkOrdersPage } from "./useWorkOrdersPage";
import { mapPriority, mapStatus, mapTriggerLabel, mapTypeLabel } from "./helpers";
import "./style.css";
import KpiSkeletonCard from "../../components/ui/KpiSkeletonCard";

function WorkOrdersPage() {
  const controlBaseClass = "app-toolbar-control";
  const {
    user,
    canCreateWorkOrder,
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
    totalItems,
    pageSize,
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
  } = useWorkOrdersPage();

  const exportCsv = () => {
    const headers = ["Mã lệnh", "Tài sản", "Loại", "Ưu tiên", "Trạng thái", "Người thực hiện"];
    const rows = pageRows.map((item) => [
      item.woCode || "",
      item.assetId?.name || "",
      `${mapTypeLabel(item.woType)} · ${mapTriggerLabel(item.triggerSource)}`,
      mapPriority(item.priority).label || "",
      mapStatus(item.status).label || "",
      item.assignedTo?.name || item.createdBy?.name || "",
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `work_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <AppShell
        currentKey="work-orders"
        user={user}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          goPage(1);
        }}
        searchPlaceholder="Tìm kiếm lệnh, tài sản hoặc người thực hiện..."
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
          <div className="mb-8">
            <h1 className="app-page-title">Quản lý Lệnh công việc</h1>
            <p className="app-page-subtitle">Theo dõi, điều phối và kiểm soát tiến độ thực hiện lệnh công việc toàn nhà máy.</p>
          </div>
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {loading ? (
                <>
                  <KpiSkeletonCard />
                  <KpiSkeletonCard />
                  <KpiSkeletonCard />
                  <KpiSkeletonCard />
                </>
              ) : (
                <>
                  <div className="app-kpi-card border-l-4 border-tertiary-fixed-dim">
                <p className="app-kpi-title">Lệnh đang chạy</p>
                <div className="flex items-end justify-between">
                  <span className="app-kpi-value">{stats.inProgress}</span>
                  <span className="text-[#4edea3] text-xs font-bold bg-[#4edea3]/10 px-2 py-1 rounded">+{stats.todayNew} mới</span>
                </div>
              </div>
              <div className="app-kpi-card border-l-4 border-amber-500">
                <p className="app-kpi-title">Chờ phê duyệt</p>
                <div className="flex items-end justify-between">
                  <span className="app-kpi-value">{stats.pending}</span>
                  <span className="text-amber-600 text-xs font-bold bg-amber-100 px-2 py-1 rounded">Ưu tiên cao</span>
                </div>
              </div>
              <div className="app-kpi-card border-l-4 border-primary">
                <p className="app-kpi-title">Hiệu suất hoàn thành</p>
                <div className="flex items-end justify-between">
                  <span className="app-kpi-value">{stats.doneRate}%</span>
                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#4edea3] h-full" style={{ width: `${stats.doneRate}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="app-kpi-card border-l-4 border-error">
                <p className="app-kpi-title">Sự cố kỹ thuật</p>
                <div className="flex items-end justify-between">
                  <span className="app-kpi-value">{stats.urgentOpen}</span>
                  <span className="text-error text-xs font-bold bg-error-container px-2 py-1 rounded">Khẩn cấp</span>
                </div>
              </div>
                </>
              )}
            </div>
          </section>

          <section className="mb-8 app-surface-card">
            <div className="p-3 sm:p-4">
              <div className="app-toolbar-grid items-stretch">
              <button className={`${controlBaseClass} flex items-center justify-center gap-2 whitespace-nowrap bg-surface-container-high px-4 rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors`} type="button" onClick={() => setShowSmartFilter((prev) => !prev)}>
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
                  <option value="draft">Bản nháp</option>
                  <option value="pending_approval">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="done">Hoàn thành</option>
                  <option value="rejected">Từ chối</option>
                </select>
              {canCreateWorkOrder ? (
                <button className={`${controlBaseClass} whitespace-nowrap bg-primary text-white px-5 rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform`} type="button" onClick={openCreate}>
                  <span className="material-symbols-outlined text-sm mr-2">add</span>
                  TẠO LỆNH MỚI
                </button>
              ) : (
                <button className={`${controlBaseClass} whitespace-nowrap bg-slate-300 text-slate-600 px-5 rounded-lg flex items-center justify-center cursor-not-allowed`} type="button" disabled title="Bạn chỉ có quyền xem">
                  <span className="material-symbols-outlined text-sm mr-2">visibility</span>
                  CHỈ XEM
                </button>
              )}
              <button className={`${controlBaseClass} whitespace-nowrap bg-primary text-white px-5 rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform`} type="button" onClick={exportCsv} title="Xuất CSV" aria-label="Xuất danh sách lệnh công việc CSV">
                <span className="material-symbols-outlined text-sm mr-2">download</span>
                XUẤT CSV
              </button>
            </div>
            </div>

            {showSmartFilter ? (
              <section className="px-3 pb-3 sm:px-4 sm:pb-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
                <button type="button" className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-100" onClick={() => setSmartFilters({ priority: "", woType: "", triggerSource: "", onlyMine: false, overdueOnly: false, actionableOnly: false })}>
                  Xóa lọc thông minh
                </button>
              </div>
                </div>
              </section>
            ) : null}

            <WorkOrdersTable
              user={user}
              loading={loading}
              error={error}
              pageRows={pageRows}
              openDetail={openDetail}
              openEditModal={openEditModal}
              openSubmitModal={openSubmitModal}
              openApproveModal={openApproveModal}
              openRejectModal={openRejectModal}
              start={start}
              openCompleteModal={openCompleteModal}
              signOff={signOff}
              totalItems={totalItems}
              safePage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              goPage={goPage}
            />
          </section>

          <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-surface-container-low/40 p-8 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">analytics</span>
              <h3 className="text-lg font-bold text-primary mb-2">Phân tích xu hướng bảo trì</h3>
              <p className="text-sm text-on-surface-variant max-w-sm">Tài liệu phân tích hiệu suất thiết bị hàng tuần đang được tổng hợp. Bạn có thể xem báo cáo chi tiết sau 17:00 hôm nay.</p>
              <button className="mt-6 text-[#001e40] text-xs font-bold underline underline-offset-4 decoration-[#4edea3] hover:text-[#4edea3] transition-colors uppercase tracking-widest" type="button" onClick={() => setNotice({ type: "info", text: "Báo cáo sẽ được tổng hợp từ dữ liệu Work Order hiện tại." })}>Xem bản nháp báo cáo</button>
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
                <button className="w-full mt-8 py-3 border border-white/20 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors" type="button" onClick={() => setNotice({ type: "info", text: "Ghi chú nhanh đã được ghi nhận trong phiên làm việc hiện tại." })}>THÊM GHI CHÚ NHANH</button>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-10">
                <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
              </div>
            </div>
          </section>
        </div>
      </AppShell>

      <WorkOrderModals
        actionModal={actionModal}
        modalLoading={modalLoading}
        modalError={modalError}
        closeActionModal={closeActionModal}
        submitModal={submitModal}
        closeSubmitModal={closeSubmitModal}
        submitForApproval={submitForApproval}
        approveModal={approveModal}
        setApproveModal={setApproveModal}
        closeApproveModal={closeApproveModal}
        submitApproveModal={submitApproveModal}
        technicians={technicians}
        rejectModal={rejectModal}
        setRejectModal={setRejectModal}
        closeRejectModal={closeRejectModal}
        submitRejectModal={submitRejectModal}
        completeModal={completeModal}
        setCompleteModal={setCompleteModal}
        closeCompleteModal={closeCompleteModal}
        submitCompleteModal={submitCompleteModal}
        editModal={editModal}
        setEditModal={setEditModal}
        closeEditModal={closeEditModal}
        submitEditModal={submitEditModal}
        assets={assets}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        createError={createError}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createLoading={createLoading}
        createWorkOrder={createWorkOrder}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
      />
    </>
  );
}

export default WorkOrdersPage;
