export function formatNowTime(value) {
  return new Date(value || Date.now()).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mapPriority(priority) {
  if (priority === "urgent") return { label: "Khẩn cấp", tone: "text-error", dot: "bg-error" };
  if (priority === "high") return { label: "Cao", tone: "text-amber-600", dot: "bg-amber-500" };
  if (priority === "medium") return { label: "Trung bình", tone: "text-blue-600", dot: "bg-blue-600" };
  return { label: "Thấp", tone: "text-slate-500", dot: "bg-slate-400" };
}

export function mapStatus(status) {
  if (status === "in_progress") return { label: "Đang thực hiện", cls: "bg-[#4edea3]/10 text-tertiary-fixed-dim" };
  if (status === "pending_approval") return { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700" };
  if (status === "approved") return { label: "Đã duyệt", cls: "bg-blue-100 text-blue-700" };
  if (status === "done") return { label: "Hoàn thành", cls: "bg-slate-100 text-slate-500" };
  if (status === "rejected") return { label: "Từ chối", cls: "bg-error-container text-error" };
  return { label: "Bản nháp", cls: "bg-violet-100 text-violet-700" };
}

export function buildDashboardNotifications(stats, workOrders) {
  const items = [];
  if (stats.overdueOrders > 0) {
    items.push({ id: "overdue", level: "error", text: `Có ${stats.overdueOrders} lệnh công việc quá hạn cần xử lý.` });
  }
  if (stats.maintenanceNeeded > 0) {
    items.push({ id: "maintenance", level: "warning", text: `Có ${stats.maintenanceNeeded} tài sản cần bảo trì.` });
  }
  const pendingCount = workOrders.filter((item) => item.status === "pending_approval").length;
  if (pendingCount > 0) {
    items.push({ id: "pending", level: "info", text: `Có ${pendingCount} work order đang chờ duyệt.` });
  }
  return items;
}

export function mapNotificationTone(item) {
  return {
    ...item,
    tone:
      item.level === "error"
        ? "bg-red-50 text-red-700"
        : item.level === "warning"
          ? "bg-amber-50 text-amber-700"
          : "bg-blue-50 text-blue-700",
  };
}

export function buildWorkOrderSearchText(workOrder) {
  return [
    workOrder.woCode,
    workOrder.assetId?.name,
    workOrder.assetId?.assetCode,
    workOrder.assignedTo?.name,
    workOrder.createdBy?.name,
    workOrder.woType,
    workOrder.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function buildChartHeights(chart, maxBarValue) {
  return chart.map((item) => {
    const total = item.completed + item.inProgress;
    if (!total) return { topHeight: 0, bottomHeight: 0 };
    const totalHeight = (total / maxBarValue) * 80;
    return {
      topHeight: (item.inProgress / total) * totalHeight,
      bottomHeight: (item.completed / total) * totalHeight,
    };
  });
}
