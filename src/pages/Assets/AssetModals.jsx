import { mapStatusLabel, mapTypeLabel, toCurrency, toDisplayDate } from "./helpers";

function AssetModals({
  deleteModal,
  closeDeleteModal,
  removeAsset,
  showCreateModal,
  closeCreateModal,
  createError,
  createForm,
  setCreateForm,
  createLoading,
  submitCreateAsset,
  actionModal,
  closeActionModal,
  modalLoading,
  modalError,
  editForm,
  setEditForm,
  submitEditAsset,
  showHelp,
  setShowHelp,
}) {
  return (
    <>
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
    </>
  );
}

export default AssetModals;
