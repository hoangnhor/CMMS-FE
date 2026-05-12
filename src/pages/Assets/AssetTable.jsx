import { mapStatusLabel, mapTypeLabel, toCurrency } from "./helpers";
import TableStateRow from "../../components/ui/TableStateRow";

function AssetTable({
  loading,
  pagedAssets,
  canManageAssets,
  openViewModal,
  openEditModal,
  openDeleteModal,
  totalItems,
  safePage,
  totalPages,
  pageSize,
  goPage,
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200/70 shadow-sm">
      <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[980px] text-left border-collapse">
        <thead className="bg-surface-container-low">
          <tr>
            <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Mã tài sản</th>
            <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Tên tài sản</th>
            <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Loại</th>
            <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
            <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Vị trí</th>
            <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest text-right">Giá trị</th>
            <th className="sticky top-0 z-10 bg-surface-container-low px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pagedAssets.map((item) => {
            const status = mapStatusLabel(item.status);
            return (
              <tr className="hover:bg-surface-container-low transition-colors group" key={item._id || item.assetCode}>
                <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{item.assetCode || "-"}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-primary">{item.name || "-"}</div>
                  <div className="text-[10px] text-on-surface-variant">S/N: {item.serialNumber || "-"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-on-secondary-container">{mapTypeLabel(item.assetType)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${status.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                    {status.text}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-on-secondary-container">{item.location || "-"}</td>
                <td className="px-6 py-4 text-sm font-bold text-primary text-right tabular-nums">{toCurrency(item.purchasePrice)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button className="app-icon-action" type="button" onClick={() => openViewModal(item._id)} aria-label={`Xem ${item.assetCode || "tài sản"}`}><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                    {canManageAssets ? (
                      <>
                        <button className="app-icon-action" type="button" onClick={() => openEditModal(item._id)} aria-label={`Sửa ${item.assetCode || "tài sản"}`}><span className="material-symbols-outlined text-[20px]">edit</span></button>
                        <button className="app-icon-action hover:text-error" type="button" onClick={() => openDeleteModal(item)} aria-label={`Xóa ${item.assetCode || "tài sản"}`}><span className="material-symbols-outlined text-[20px]">delete</span></button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
          {loading ? (
            <TableStateRow colSpan={7} type="loading" message="Đang tải dữ liệu tài sản..." />
          ) : null}
          {!loading && pagedAssets.length === 0 ? (
            <TableStateRow colSpan={7} type="empty" message="Không có tài sản phù hợp." />
          ) : null}
        </tbody>
      </table>
      </div>

      <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
        <div className="text-xs text-on-surface-variant font-medium">
          Hiển thị <span className="font-bold text-primary">{totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1}-{Math.min(totalItems, safePage * pageSize)}</span> trong số <span className="font-bold text-primary">{totalItems}</span> tài sản
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" type="button" aria-label="Trang đầu" onClick={() => goPage(1)} disabled={safePage === 1}><span className="material-symbols-outlined text-[18px]">first_page</span></button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" type="button" aria-label="Trang trước" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
          <div className="flex items-center px-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold" type="button" aria-current="page">{safePage}</button>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" type="button" aria-label="Trang sau" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" type="button" aria-label="Trang cuối" onClick={() => goPage(totalPages)} disabled={safePage === totalPages}><span className="material-symbols-outlined text-[18px]">last_page</span></button>
        </div>
      </div>
    </div>
  );
}

export default AssetTable;
