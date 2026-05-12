function TableStateRow({ colSpan, type = "empty", message }) {
  const tone =
    type === "error"
      ? "text-error"
      : "text-on-surface-variant";

  const icon =
    type === "loading"
      ? "hourglass_top"
      : type === "error"
        ? "error"
        : "inbox";

  return (
    <tr>
      <td colSpan={colSpan} className={`px-6 py-10 text-center ${tone}`}>
        <div className="flex flex-col items-center gap-2" role={type === "error" ? "alert" : "status"}>
          <span className={`material-symbols-outlined text-2xl opacity-70 ${type === "loading" ? "animate-pulse" : ""}`}>
            {icon}
          </span>
          <span className="text-sm font-medium">{message}</span>
        </div>
      </td>
    </tr>
  );
}

export default TableStateRow;
