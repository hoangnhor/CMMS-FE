import { mapStatusLabel, mapTypeLabel, toCurrency } from "./helpers";

function AssetTable({
  loading,
  pagedAssets,
  canManageAssets,
  openViewModal,
  openEditModal,
  openDeleteModal,
  filteredAssets,
  safePage,
  totalPages,
  pageSize,
  goPage,
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200/70 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-low">
          <tr>
            <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Mã tài sản</th>
            <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Tên tài sản</th>
            <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Loại</th>
            <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
            <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Vị trí</th>
            <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest text-right">Giá trị</th>
            <th className="px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest text-center">Thao tác</th>
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
                    <button className="app-icon-action" type="button" onClick={() => openViewModal(item._id)}><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                    {canManageAssets ? (
                      <>
                        <button className="app-icon-action" type="button" onClick={() => openEditModal(item._id)}><span className="material-symbols-outlined text-[20px]">edit</span></button>
                        <button className="app-icon-action hover:text-error" type="button" onClick={() => openDeleteModal(item)}><span className="material-symbols-outlined text-[20px]">delete</span></button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && pagedAssets.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-8 text-center text-sm text-on-surface-variant">Không có tài sản phù hợp.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
        <div className="text-xs text-on-surface-variant font-medium">
          Hiển thị <span className="font-bold text-primary">{filteredAssets.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-{Math.min(filteredAssets.length, safePage * pageSize)}</span> trong số <span className="font-bold text-primary">{filteredAssets.length}</span> tài sản
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(1)} disabled={safePage === 1}><span className="material-symbols-outlined text-[18px]">first_page</span></button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
          <div className="flex items-center px-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">{safePage}</button>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-slate-400 transition-colors" onClick={() => goPage(totalPages)} disabled={safePage === totalPages}><span className="material-symbols-outlined text-[18px]">last_page</span></button>
        </div>
      </div>
    </div>
  );
}

export default AssetTable;
