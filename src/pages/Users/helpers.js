export const PAGE_SIZE = 12;

export function mapRoleText(role) {
  if (role === "admin") return "Quản trị viên";
  if (role === "site_manager") return "Quản lý";
  if (role === "technician") return "Kỹ thuật viên";
  if (role === "accountant") return "Kế toán";
  return role || "-";
}

export function mapRoleTone(role) {
  if (role === "admin") return "bg-[#4edea3]/20 text-[#005236]";
  if (role === "site_manager") return "bg-primary-container text-white";
  if (role === "technician") return "bg-surface-container-high text-on-surface";
  return "bg-amber-100 text-amber-700";
}

export function buildCreateUserForm() {
  return {
    name: "",
    email: "",
    password: "",
    role: "technician",
  };
}

export function buildUserSearchText(item) {
  return [item.name, item.email, item.role]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function buildRoleStats(users) {
  return {
    technician: users.filter((item) => item.role === "technician").length,
    manager: users.filter((item) => item.role === "site_manager").length,
    admin: users.filter((item) => item.role === "admin").length,
    accountant: users.filter((item) => item.role === "accountant").length,
  };
}

export function buildUserNotifications(users) {
  const rows = [];
  const inactiveCount = users.filter((item) => !item.isActive).length;
  if (inactiveCount > 0) {
    rows.push({ id: "inactive", tone: "bg-amber-50 text-amber-700", text: `Có ${inactiveCount} người dùng đang bị khóa.` });
  }
  if (users.length > 0) {
    rows.push({ id: "total", tone: "bg-blue-50 text-blue-700", text: `Tổng cộng ${users.length} tài khoản trong hệ thống.` });
  }
  return rows;
}
