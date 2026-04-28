export const PAGE_SIZE = 10;

export function toCurrency(value) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

export function mapTypeLabel(type) {
  if (type === "machine") return "Máy móc";
  if (type === "mold") return "Khuôn";
  if (type === "jig_tool") return "Jig/Tool";
  if (type === "infrastructure") return "Hạ tầng";
  return type || "-";
}

export function mapStatusLabel(status) {
  if (status === "active") return { text: "Đang hoạt động", cls: "bg-[#4edea3]/10 text-[#005236]", dot: "bg-tertiary-fixed-dim" };
  if (status === "in_repair") return { text: "Bảo trì", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" };
  if (status === "idle") return { text: "Dừng máy", cls: "bg-error-container text-error", dot: "bg-error" };
  return { text: "Ngưng sử dụng", cls: "bg-slate-200 text-slate-700", dot: "bg-slate-400" };
}

export function parseCurrencyToNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s/g, "").replace(/[^\d.,]/g, "");
  if (!normalized) return null;

  const lastDot = normalized.lastIndexOf(".");
  const lastComma = normalized.lastIndexOf(",");
  const lastSeparator = Math.max(lastDot, lastComma);

  if (lastSeparator === -1) {
    const digitsOnly = normalized.replace(/\D/g, "");
    return digitsOnly ? Number(digitsOnly) : null;
  }

  const intPart = normalized.slice(0, lastSeparator).replace(/\D/g, "");
  const fracPart = normalized.slice(lastSeparator + 1).replace(/\D/g, "");

  if (fracPart.length > 0 && fracPart.length <= 2) {
    return Number(`${intPart || "0"}.${fracPart}`);
  }

  const digitsOnly = normalized.replace(/\D/g, "");
  return digitsOnly ? Number(digitsOnly) : null;
}

function buildAssetSearchText(item) {
  return [item.assetCode, item.name, item.location, item.serialNumber, item.model]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterAssets(assets, { search, typeFilter, statusFilter, advancedFilters }) {
  const keyword = search.trim().toLowerCase();
  const manufacturerKeyword = advancedFilters.manufacturer.trim().toLowerCase();
  const locationKeyword = advancedFilters.location.trim().toLowerCase();
  const minPriceValue = parseCurrencyToNumber(advancedFilters.minPrice);
  const maxPriceValue = parseCurrencyToNumber(advancedFilters.maxPrice);

  return assets.filter((item) => {
    if (typeFilter && item.assetType !== typeFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (manufacturerKeyword && !String(item.manufacturer || "").toLowerCase().includes(manufacturerKeyword)) return false;
    if (locationKeyword && !String(item.location || "").toLowerCase().includes(locationKeyword)) return false;
    if (minPriceValue !== null && Number(item.purchasePrice || 0) < minPriceValue) return false;
    if (maxPriceValue !== null && Number(item.purchasePrice || 0) > maxPriceValue) return false;
    if (!keyword) return true;
    return buildAssetSearchText(item).includes(keyword);
  });
}

export function buildAssetNotifications({ activeAssets, repairAssets, idleAssets }) {
  const result = [];
  if (idleAssets > 0) {
    result.push({ id: "idle", level: "error", text: `Có ${idleAssets} tài sản đang dừng máy.` });
  }
  if (repairAssets > 0) {
    result.push({ id: "repair", level: "warning", text: `Có ${repairAssets} tài sản đang bảo trì.` });
  }
  if (activeAssets > 0) {
    result.push({ id: "active", level: "info", text: `${activeAssets} tài sản đang hoạt động ổn định.` });
  }
  return result;
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

export function buildCreateAssetForm() {
  return {
    assetCode: "",
    name: "",
    assetType: "machine",
    status: "active",
    location: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: "",
  };
}

export function buildEditAssetForm() {
  return {
    name: "",
    status: "",
    location: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    purchasePrice: "",
  };
}

export function buildAdvancedFilters() {
  return {
    manufacturer: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  };
}

export function buildDeleteModalState() {
  return {
    open: false,
    loading: false,
    error: "",
    asset: null,
  };
}

export function escapeCsvValue(value) {
  const raw = value === null || value === undefined ? "" : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}
