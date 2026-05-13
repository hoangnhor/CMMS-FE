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
    <>
      <div className="app-table-wrap">
      <table className="app-table min-w-[980px]">
        <thead>
          <tr>
            <th className="app-table-head-cell">Mã tài sản</th>
            <th className="app-table-head-cell">Tên tài sản</th>
            <th className="app-table-head-cell">Loại</th>
            <th className="app-table-head-cell">Trạng thái</th>
            <th className="app-table-head-cell">Vị trí</th>
            <th className="app-table-head-cell text-right">Giá trị</th>
            <th className="app-table-head-cell text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="app-table-body app-table-divider">
          {pagedAssets.map((item) => {
            const status = mapStatusLabel(item.status);
            return (
              <tr className="app-table-body-row group" key={item._id || item.assetCode}>
                <td className="px-6 py-4 font-mono text-xs font-bold text-primary whitespace-nowrap truncate">{item.assetCode || "-"}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-primary whitespace-nowrap truncate">{item.name || "-"}</div>
                  <div className="text-[10px] text-on-surface-variant whitespace-nowrap truncate">S/N: {item.serialNumber || "-"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-on-secondary-container whitespace-nowrap truncate">{mapTypeLabel(item.assetType)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-md text-[10px] font-bold ${status.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                    {status.text}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-on-secondary-container whitespace-nowrap truncate">{item.location || "-"}</td>
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

      <div className="app-table-footer">
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
    </>
  );
}

export default AssetTable;
