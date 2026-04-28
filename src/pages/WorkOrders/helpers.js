export const PAGE_SIZE = 8;

export function toDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

export function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function mapPriority(priority) {
  if (priority === "urgent") return { label: "Khẩn cấp", tone: "text-error", dot: "bg-error status-glow-error" };
  if (priority === "high") return { label: "Cao", tone: "text-amber-600", dot: "bg-amber-500 status-glow-amber" };
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

export function mapTypeLabel(type) {
  if (type === "PM") return "Bảo trì định kỳ";
  if (type === "CM") return "Sửa chữa";
  return type || "-";
}

export function mapTriggerLabel(trigger) {
  if (trigger === "machine_alert") return "Máy báo lỗi";
  if (trigger === "pm_schedule") return "Lịch PM";
  if (trigger === "production_request") return "Yêu cầu sản xuất";
  return trigger || "-";
}

export function mapAssetIcon(assetType) {
  if (assetType === "machine") return "precision_manufacturing";
  if (assetType === "mold") return "view_in_ar";
  if (assetType === "jig_tool") return "construction";
  if (assetType === "infrastructure") return "home_repair_service";
  return "settings_suggest";
}

export function buildTitle(item) {
  if (item.woType === "PM") return "Bảo trì định kỳ";
  if (item.triggerSource === "machine_alert") return "Xử lý sự cố";
  return "Công việc bảo trì";
}

export function canEdit(actor, item) {
  if (!actor || !item) return false;
  if (!["draft", "rejected"].includes(item.status)) return false;
  if (["admin", "site_manager"].includes(actor.role)) return true;
  return String(item.createdBy?._id || item.createdBy) === String(actor._id);
}

export function canApprove(actor, item) {
  if (!actor || !item) return false;
  if (item.priority === "urgent") {
    return ["admin", "site_manager"].includes(actor.role) && ["draft", "pending_approval"].includes(item.status);
  }
  return ["admin", "technician"].includes(actor.role) && item.status === "pending_approval";
}

export function canStart(actor, item) {
  if (!actor || !item) return false;
  if (actor.role !== "technician" || item.status !== "approved") return false;
  if (!item.assignedTo) return item.priority === "urgent";
  return String(item.assignedTo?._id || item.assignedTo) === String(actor._id);
}

export function canComplete(actor, item) {
  if (!actor || !item) return false;
  if (actor.role !== "technician" || item.status !== "in_progress") return false;
  return String(item.assignedTo?._id || item.assignedTo) === String(actor._id);
}

export function canSignOff(actor, item) {
  if (!actor || !item) return false;
  return ["admin", "technician"].includes(actor.role) && item.status === "done";
}

export function buildCreateWorkOrderForm() {
  return {
    assetId: "",
    woType: "CM",
    triggerSource: "production_request",
    priority: "medium",
    scheduledDate: "",
  };
}
