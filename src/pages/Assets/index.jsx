import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import AssetModals from "./AssetModals";
import AssetTable from "./AssetTable";
import { useAssetsPage } from "./useAssetsPage";
import "./style.css";

function AssetsPage() {
  const navigate = useNavigate();
  const {
    user,
    canManageAssets,
    loading,
    error,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    showNotifications,
    setShowNotifications,
    showHelp,
    setShowHelp,
    showAdvancedFilter,
    setShowAdvancedFilter,
    actionModal,
    modalLoading,
    modalError,
    showCreateModal,
    createLoading,
    createError,
    notice,
    setNotice,
    deleteModal,
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    advancedFilters,
    setAdvancedFilters,
    notificationsRef,
    notifications,
    filteredAssets,
    pageSize,
    safePage,
    totalPages,
    pagedAssets,
    totalAssets,
    activeAssets,
    repairAssets,
    idleAssets,
    handleLogout,
    goPage,
    resetAdvancedFilters,
    exportCsv,
    openCreateModal,
    closeCreateModal,
    openViewModal,
    openEditModal,
    submitEditAsset,
    openDeleteModal,
    closeDeleteModal,
    removeAsset,
    submitCreateAsset,
    closeActionModal,
  } = useAssetsPage();

  return (
    <>
      <AppShell
        currentKey="assets"
        user={user}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          goPage(1);
        }}
        searchPlaceholder="Tìm kiếm tài sản, mã số hoặc vị trí..."
        notifications={notifications}
        notificationsRef={notificationsRef}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        setShowHelp={setShowHelp}
        onLogout={handleLogout}
      >
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
              <select className="bg-transparent border-none focus:ring-0 text-primary font-bold py-0 pr-8 cursor-pointer" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); goPage(1); }}>
                <option value="">Tất cả loại</option>
                <option value="machine">Máy móc</option>
                <option value="mold">Khuôn</option>
                <option value="jig_tool">Jig/Tool</option>
                <option value="infrastructure">Hạ tầng</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest rounded-lg text-sm border-none min-w-[200px]">
              <span className="text-on-surface-variant font-medium">Trạng thái:</span>
              <select className="bg-transparent border-none focus:ring-0 text-primary font-bold py-0 pr-8 cursor-pointer" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); goPage(1); }}>
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
                    goPage(1);
                  }}
                />
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#4edea3]/50 outline-none"
                  placeholder="Vị trí"
                  type="text"
                  value={advancedFilters.location}
                  onChange={(event) => {
                    setAdvancedFilters((prev) => ({ ...prev, location: event.target.value }));
                    goPage(1);
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
                    goPage(1);
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
                    goPage(1);
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

          <AssetTable
            loading={loading}
            pagedAssets={pagedAssets}
            canManageAssets={canManageAssets}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            openDeleteModal={openDeleteModal}
            filteredAssets={filteredAssets}
            safePage={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            goPage={goPage}
          />

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
      </AppShell>
      <AssetModals
        deleteModal={deleteModal}
        closeDeleteModal={closeDeleteModal}
        removeAsset={removeAsset}
        showCreateModal={showCreateModal}
        closeCreateModal={closeCreateModal}
        createError={createError}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createLoading={createLoading}
        submitCreateAsset={submitCreateAsset}
        actionModal={actionModal}
        closeActionModal={closeActionModal}
        modalLoading={modalLoading}
        modalError={modalError}
        editForm={editForm}
        setEditForm={setEditForm}
        submitEditAsset={submitEditAsset}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
      />
    </>
  );
}

export default AssetsPage;
