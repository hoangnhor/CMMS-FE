export const PAGE_SIZE = 12;

export function mapIntervalLabel(triggerType, intervalValue) {
  if (triggerType === "hours") return `${intervalValue} giờ`;
  if (triggerType === "days") return `${intervalValue} ngày`;
  if (triggerType === "shots") return `${intervalValue.toLocaleString("vi-VN")} shot`;
  if (triggerType === "usage_count") return `${intervalValue} lần`;
  return String(intervalValue || "-");
}

export function toDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

export function calcDayDiff(value) {
  if (!value) return null;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  return Math.round((dueStart.getTime() - todayStart.getTime()) / 86400000);
}

export function buildScheduleSearchText(item) {
  return [item.assetId?.assetCode, item.assetId?.name, item.assetId?.assetType, item.triggerType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function buildDueByAsset(workOrders) {
  const dueByAsset = new Map();

  workOrders.forEach((workOrder) => {
    if (["done", "rejected"].includes(workOrder.status)) return;
    if (!workOrder.assetId?._id || !workOrder.scheduledDate) return;

    const dueDate = new Date(workOrder.scheduledDate);
    if (Number.isNaN(dueDate.getTime())) return;

    const assetKey = String(workOrder.assetId._id);
    const currentDueDate = dueByAsset.get(assetKey);
    if (!currentDueDate || dueDate.getTime() < currentDueDate.getTime()) {
      dueByAsset.set(assetKey, dueDate);
    }
  });

  return dueByAsset;
}

export function buildScheduleStatus(item, dueDate) {
  const dayDiff = calcDayDiff(dueDate);

  if (dayDiff !== null) {
    if (dayDiff < 0) {
      return {
        dayDiff,
        statusTone: "bg-error-container text-error",
        statusDot: "bg-error",
        statusLabel: `Quá hạn ${Math.abs(dayDiff)} ngày`,
      };
    }

    if (dayDiff === 0) {
      return {
        dayDiff,
        statusTone: "bg-amber-100 text-amber-700",
        statusDot: "bg-amber-500",
        statusLabel: "Hôm nay",
      };
    }

    return {
      dayDiff,
      statusTone: "bg-surface-container text-on-surface-variant",
      statusDot: "bg-slate-400",
      statusLabel: `Còn ${dayDiff} ngày`,
    };
  }

  if (item.isActive) {
    return {
      dayDiff,
      statusTone: "bg-[#dcfce7] text-[#166534]",
      statusDot: "bg-[#4ade80]",
      statusLabel: "Đang hoạt động",
    };
  }

  return {
    dayDiff,
    statusTone: "bg-slate-200 text-slate-700",
    statusDot: "bg-slate-400",
    statusLabel: "Tạm dừng",
  };
}
