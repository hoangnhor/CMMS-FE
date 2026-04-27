export function mapRoleLabel(role) {
  if (role === "admin") return "Admin Hệ Thống";
  if (role === "site_manager") return "Quản lý xưởng";
  if (role === "technician") return "Tổ trưởng bảo trì";
  if (role === "accountant") return "Kế toán";
  return "Người dùng";
}

export function getDisplayName(user) {
  return user?.name || "Admin Hệ Thống";
}

export function getInitials(user) {
  const source = user?.name || user?.email || "DF";
  const words = String(source)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "DF";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
