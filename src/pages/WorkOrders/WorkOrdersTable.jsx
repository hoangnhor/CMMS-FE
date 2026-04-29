import { getInitials } from "../../utils/userDisplay";
import { buildTitle, canApprove, canComplete, canEdit, canSignOff, canStart, mapAssetIcon, mapPriority, mapStatus, mapTriggerLabel, mapTypeLabel } from "./helpers";

function WorkOrdersTable({
  user,
  loading,
  error,
  pageRows,
  openDetail,
  openEditModal,
  openSubmitModal,
  openApproveModal,
  openRejectModal,
  start,
  openCompleteModal,
  signOff,
  filteredRows,
  safePage,
  totalPages,
  pageSize,
  goPage,
}) {
  return (
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
          Hiển thị <span className="font-bold text-primary">{filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-{Math.min(filteredRows.length, safePage * pageSize)}</span> trong số <span className="font-bold text-primary">{filteredRows.length}</span> lệnh
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
  );
}

export default WorkOrdersTable;
