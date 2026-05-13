import { getInitials } from "../../utils/userDisplay";
import { buildTitle, canApprove, canComplete, canEdit, canSignOff, canStart, mapAssetIcon, mapPriority, mapStatus, mapTriggerLabel, mapTypeLabel } from "./helpers";
import TableStateRow from "../../components/ui/TableStateRow";

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
  totalItems,
  safePage,
  totalPages,
  pageSize,
  goPage,
}) {
  return (
    <>
      {error ? <div className="px-6 py-3 text-sm text-error bg-error-container/40">{error}</div> : null}
      <div className="app-table-wrap">
        <table className="app-table min-w-[1080px]">
          <thead>
            <tr className="app-table-head-row">
              <th className="app-table-head-cell w-[19%]">Lệnh công việc</th>
              <th className="app-table-head-cell w-[16%]">Tài sản</th>
              <th className="app-table-head-cell w-[18%]">Loại</th>
              <th className="app-table-head-cell w-[9%]">Ưu tiên</th>
              <th className="app-table-head-cell w-[11%]">Trạng thái</th>
              <th className="app-table-head-cell w-[18%]">Người thực hiện</th>
              <th className="app-table-head-cell w-[9%] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="app-table-body app-table-divider">
            {loading ? (
              <TableStateRow colSpan={7} type="loading" message="Đang tải lệnh công việc..." />
            ) : pageRows.length === 0 ? (
              <TableStateRow colSpan={7} type="empty" message="Không có dữ liệu phù hợp." />
            ) : pageRows.map((item) => {
              const priority = mapPriority(item.priority);
              const status = mapStatus(item.status);
              return (
                <tr className="app-table-body-row" key={item._id}>
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
                      <span className="text-sm font-semibold whitespace-nowrap truncate">{item.assignedTo?.name || item.createdBy?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button className="p-1 hover:bg-slate-100 text-slate-500 transition-colors rounded disabled:opacity-40" type="button" title="Chi tiết" aria-label={`Chi tiết ${item.woCode || "lệnh"}`} onClick={() => openDetail(item)}>
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      {canEdit(user, item) ? (
                        <>
                          <button className="p-1 hover:bg-blue-50 text-blue-600 transition-colors rounded disabled:opacity-40" type="button" title="Sửa" aria-label={`Sửa ${item.woCode || "lệnh"}`} onClick={() => openEditModal(item)}>
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {item.status === "draft" ? (
                            <button className="p-1 hover:bg-violet-50 text-violet-600 transition-colors rounded disabled:opacity-40" type="button" title="Gửi duyệt" aria-label={`Gửi duyệt ${item.woCode || "lệnh"}`} onClick={() => openSubmitModal(item)}>
                              <span className="material-symbols-outlined text-[18px]">outgoing_mail</span>
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      {canApprove(user, item) ? (
                        <>
                          <button className="p-1 hover:bg-emerald-50 text-[#4edea3] transition-colors rounded" type="button" title="Duyệt" aria-label={`Duyệt ${item.woCode || "lệnh"}`} onClick={() => openApproveModal(item)}>
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                          <button className="p-1 hover:bg-rose-50 text-error transition-colors rounded" type="button" title="Từ chối" aria-label={`Từ chối ${item.woCode || "lệnh"}`} onClick={() => openRejectModal(item)}>
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                          </button>
                        </>
                      ) : null}
                      {canStart(user, item) ? (
                        <button className="p-1 hover:bg-amber-50 text-amber-600 transition-colors rounded" type="button" title="Bắt đầu" aria-label={`Bắt đầu ${item.woCode || "lệnh"}`} onClick={() => start(item._id)}>
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        </button>
                      ) : null}
                      {canComplete(user, item) ? (
                        <button className="p-1 hover:bg-amber-50 text-amber-600 transition-colors rounded" type="button" title="Hoàn thành" aria-label={`Hoàn thành ${item.woCode || "lệnh"}`} onClick={() => openCompleteModal(item)}>
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
                        </button>
                      ) : null}
                      {canSignOff(user, item) ? (
                        <button className="p-1 hover:bg-emerald-50 text-emerald-600 transition-colors rounded" type="button" title="Sign-off" aria-label={`Sign-off ${item.woCode || "lệnh"}`} onClick={() => signOff(item._id)}>
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

      <div className="app-table-footer">
        <div className="text-xs text-on-surface-variant font-medium">
          Hiển thị <span className="font-bold text-primary">{totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1}-{Math.min(totalItems, safePage * pageSize)}</span> trong số <span className="font-bold text-primary">{totalItems}</span> lệnh
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
    </>
  );
}

export default WorkOrdersTable;
