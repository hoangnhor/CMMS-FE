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

export function buildEditWorkOrderModal(item = null) {
  return {
    open: false,
    loading: false,
    error: "",
    item,
    form: {
      assetId: item?.assetId?._id || item?.assetId || "",
      woType: item?.woType || "CM",
      triggerSource: item?.triggerSource || "production_request",
      priority: item?.priority || "medium",
      scheduledDate: toInputDate(item?.scheduledDate),
    },
  };
}

export function buildSubmitModal(item = null) {
  return { open: false, loading: false, error: "", item };
}

export function buildApproveModal(item = null, assignedTo = "") {
  return { open: false, loading: false, error: "", item, assignedTo };
}

export function buildRejectModal(item = null) {
  return { open: false, loading: false, error: "", item, reason: item?.rejectedReason || "" };
}

export function buildCompleteModal(item = null) {
  return {
    open: false,
    loading: false,
    error: "",
    item,
    laborHours: String(item?.laborHours ?? 0),
    findings: "",
  };
}

export function buildSmartFilters() {
  return {
    priority: "",
    woType: "",
    triggerSource: "",
    onlyMine: false,
    overdueOnly: false,
    actionableOnly: false,
  };
}

export function buildWorkOrderSearchText(item) {
  return [
    item.woCode,
    item.assetId?.assetCode,
    item.assetId?.name,
    item.assignedTo?.name,
    item.createdBy?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterWorkOrders(workOrders, { search, smartFilters, user }) {
  const keyword = search.trim().toLowerCase();
  const now = Date.now();

  return workOrders.filter((item) => {
    if (keyword && !buildWorkOrderSearchText(item).includes(keyword)) return false;
    if (smartFilters.priority && item.priority !== smartFilters.priority) return false;
    if (smartFilters.woType && item.woType !== smartFilters.woType) return false;
    if (smartFilters.triggerSource && item.triggerSource !== smartFilters.triggerSource) return false;

    if (smartFilters.onlyMine) {
      const mine = String(user?._id || "");
      const creator = String(item.createdBy?._id || item.createdBy || "");
      const assignee = String(item.assignedTo?._id || item.assignedTo || "");
      if (mine !== creator && mine !== assignee) return false;
    }

    if (smartFilters.overdueOnly) {
      const due = item?.scheduledDate ? new Date(item.scheduledDate).getTime() : null;
      if (!due || Number.isNaN(due) || due >= now) return false;
      if (["done", "rejected"].includes(item.status)) return false;
    }

    if (smartFilters.actionableOnly) {
      const hasAction = canEdit(user, item)
        || canApprove(user, item)
        || canStart(user, item)
        || canComplete(user, item)
        || canSignOff(user, item);
      if (!hasAction) return false;
    }

    return true;
  });
}

export function buildWorkOrderStats(workOrders) {
  const inProgress = workOrders.filter((item) => item.status === "in_progress").length;
  const pending = workOrders.filter((item) => item.status === "pending_approval").length;
  const done = workOrders.filter((item) => item.status === "done").length;
  const urgentOpen = workOrders.filter((item) => item.priority === "urgent" && !["done", "rejected"].includes(item.status)).length;
  const doneRate = workOrders.length ? Math.round((done / workOrders.length) * 100) : 0;
  const todayNew = workOrders.filter((item) => {
    const createdLikeDate = new Date(item._id?.toString().slice(0, 8).replace(/(..)(..)(..)(..)/, "$1-$2-$3-$4"));
    return !Number.isNaN(createdLikeDate.getTime()) && createdLikeDate.toDateString() === new Date().toDateString();
  }).length;

  return { inProgress, pending, doneRate, urgentOpen, todayNew };
}

export function buildWorkOrderNotifications(stats) {
  const rows = [];
  if (stats.pending > 0) rows.push({ id: "pending", tone: "bg-amber-50 text-amber-700", text: `Có ${stats.pending} lệnh đang chờ phê duyệt.` });
  if (stats.urgentOpen > 0) rows.push({ id: "urgent", tone: "bg-red-50 text-red-700", text: `Có ${stats.urgentOpen} lệnh khẩn cấp đang mở.` });
  if (stats.inProgress > 0) rows.push({ id: "running", tone: "bg-emerald-50 text-emerald-700", text: `${stats.inProgress} lệnh đang thực hiện.` });
  return rows;
}

export function countActiveSmartFilters(smartFilters) {
  let count = 0;
  if (smartFilters.priority) count += 1;
  if (smartFilters.woType) count += 1;
  if (smartFilters.triggerSource) count += 1;
  if (smartFilters.onlyMine) count += 1;
  if (smartFilters.overdueOnly) count += 1;
  if (smartFilters.actionableOnly) count += 1;
  return count;
}
