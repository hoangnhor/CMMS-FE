import { mapPriority, mapStatus, mapTriggerLabel, mapTypeLabel, toDisplayDate } from "./helpers";

function WorkOrderModals({
  actionModal,
  modalLoading,
  modalError,
  closeActionModal,
  submitModal,
  closeSubmitModal,
  submitForApproval,
  approveModal,
  setApproveModal,
  closeApproveModal,
  submitApproveModal,
  technicians,
  rejectModal,
  setRejectModal,
  closeRejectModal,
  submitRejectModal,
  completeModal,
  setCompleteModal,
  closeCompleteModal,
  submitCompleteModal,
  editModal,
  setEditModal,
  closeEditModal,
  submitEditModal,
  assets,
  showCreateModal,
  setShowCreateModal,
  createError,
  createForm,
  setCreateForm,
  createLoading,
  createWorkOrder,
  showHelp,
  setShowHelp,
}) {
  return (
    <>
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

export default WorkOrderModals;
