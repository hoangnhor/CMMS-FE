import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { createUserApi, listUsersApi, updateUserStatusApi } from "../../services/user.api";
import { subscribeRealtime } from "../../services/realtime";
import { getDisplayName, getInitials, mapRoleLabel } from "../../utils/userDisplay";
import "./style.css";

const PAGE_SIZE = 12;

function mapRoleText(role) {
  if (role === "admin") return "Quản trị viên";
  if (role === "site_manager") return "Quản lý";
  if (role === "technician") return "Kỹ thuật viên";
  if (role === "accountant") return "Kế toán";
  return role || "-";
}

function mapRoleTone(role) {
  if (role === "admin") return "bg-[#4edea3]/20 text-[#005236]";
  if (role === "site_manager") return "bg-primary-container text-white";
  if (role === "technician") return "bg-surface-container-high text-on-surface";
  return "bg-amber-100 text-amber-700";
}

function UsersPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const notificationsRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "technician",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState("");
  const [page, setPage] = useState(1);

  const showNotice = (type, text) => setNotice({ type, text });

  const loadUsers = useCallback(async ({ silent = false } = {}) => {
    if (!isAdmin) {
      setUsers([]);
      setError("");
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError("");
      const res = await listUsersApi();
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không tải được danh sách người dùng");
      setUsers([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadUsers();
    });
  }, [loadUsers]);

  useEffect(() => {
    let timeoutId = null;
    const onChanged = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        loadUsers({ silent: true });
      }, 250);
    };
    const unsub = subscribeRealtime(["user.changed"], onChanged);
    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadUsers]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showNotifications]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((item) => [item.name, item.email, item.role].filter(Boolean).join(" ").toLowerCase().includes(keyword));
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goPage = (value) => {
    const next = Math.max(1, Math.min(totalPages, value));
    setPage(next);
  };

  const roleStats = useMemo(() => ({
    technician: users.filter((item) => item.role === "technician").length,
    manager: users.filter((item) => item.role === "site_manager").length,
    admin: users.filter((item) => item.role === "admin").length,
    accountant: users.filter((item) => item.role === "accountant").length,
  }), [users]);

  const notifications = useMemo(() => {
    const rows = [];
    const inactiveCount = users.filter((item) => !item.isActive).length;
    if (inactiveCount > 0) {
      rows.push({ id: "inactive", tone: "bg-amber-50 text-amber-700", text: `Có ${inactiveCount} người dùng đang bị khóa.` });
    }
    if (users.length > 0) {
      rows.push({ id: "total", tone: "bg-blue-50 text-blue-700", text: `Tổng cộng ${users.length} tài khoản trong hệ thống.` });
    }
    return rows;
  }, [users]);

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    navigate("/auth", { replace: true });
  };

  const createUser = async () => {
    if (!isAdmin) {
      showNotice("error", "Bạn không có quyền tạo người dùng.");
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      return;
    }
    try {
      setFormError("");
      setFormLoading(true);
      await createUserApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setForm({ name: "", email: "", password: "", role: "technician" });
      await loadUsers({ silent: true });
      showNotice("success", "Đã tạo người dùng mới.");
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Tạo người dùng thất bại.");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleUserStatus = async (target) => {
    if (!isAdmin) {
      showNotice("error", "Bạn không có quyền cập nhật trạng thái người dùng.");
      return;
    }
    try {
      setToggleLoadingId(target._id);
      await updateUserStatusApi(target._id, { isActive: !target.isActive });
      await loadUsers({ silent: true });
      showNotice("success", "Đã cập nhật trạng thái người dùng.");
    } catch (err) {
      showNotice("error", err?.response?.data?.message || err?.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setToggleLoadingId("");
    }
  };

  const totalUsers = users.length;

  return (
    <div className="bg-[#eef3f8] text-on-surface min-h-screen">
      <aside className="bg-[#001e40] dark:bg-[#000511] h-screen w-64 fixed left-0 top-0 shadow-2xl shadow-black/20 flex flex-col py-6 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4edea3] flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
            </div>
            <div>
              <h1 className="shell-brand-title tracking-tighter text-white uppercase font-headline">Digital Foreman</h1>
              <p className="shell-brand-subtitle">Hệ thống Kỹ nghệ Số</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 text-left" href="#" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="font-['Inter'] shell-nav-text">Bảng điều khiển</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 text-left" href="#" onClick={(e) => { e.preventDefault(); navigate("/assets"); }}>
            <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
            <span className="font-['Inter'] shell-nav-text">Tài sản</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 text-left" href="#" onClick={(e) => { e.preventDefault(); navigate("/work-orders"); }}>
            <span className="material-symbols-outlined text-xl">engineering</span>
            <span className="font-['Inter'] shell-nav-text">Lệnh công việc</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 text-left" href="#" onClick={(e) => { e.preventDefault(); navigate("/maintenance"); }}>
            <span className="material-symbols-outlined text-xl">build</span>
            <span className="font-['Inter'] shell-nav-text">Bảo trì</span>
          </a>
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-[#4edea3] border-r-4 border-[#4edea3] transition-all duration-200 active:scale-95 text-left" href="#" onClick={(e) => e.preventDefault()}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <span className="font-['Inter'] shell-nav-text">Người dùng</span>
          </a>
        </nav>

        <div className="px-3 mt-auto">
          <a className="side-nav-btn w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 text-left" href="#" onClick={handleLogout}>
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-['Inter'] shell-nav-text">Đăng xuất</span>
          </a>
        </div>
      </aside>

      <main className="ml-64 pt-16 min-h-screen bg-[#eef3f8]">
        <header className="shell-header fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-8 w-full z-40">
          <div className="shell-search-wrap relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              className="shell-search-input w-full border-none rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#4edea3]/50 transition-all outline-none"
              placeholder="Tìm kiếm tài khoản, email hoặc vai trò..."
              type="text"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 relative" ref={notificationsRef}>
              <button className="text-slate-500 hover:text-[#4edea3] transition-colors relative" type="button" onClick={() => setShowNotifications((prev) => !prev)}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: showNotifications ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
                {notifications.length > 0 ? <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" /> : null}
              </button>
              <button className="text-slate-500 hover:text-[#4edea3] transition-colors" type="button" onClick={() => setShowHelp(true)}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: showHelp ? "'FILL' 1" : "'FILL' 0" }}>help</span>
              </button>

              {showNotifications ? (
                <div className="absolute right-0 top-10 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                  <div className="text-sm font-bold text-primary px-2 pb-2 border-b border-slate-100">Thông báo người dùng</div>
                  <div className="max-h-72 overflow-auto mt-2 space-y-2">
                    {notifications.length === 0 ? <div className="text-sm text-slate-500 px-2 py-3">Không có thông báo mới.</div> : notifications.map((item) => (
                      <div key={item.id} className={`px-3 py-2 rounded-lg text-sm ${item.tone}`}>{item.text}</div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center space-x-3 pl-6 border-l border-slate-200/50">
              <div className="text-right">
                <p className="app-user-name">{getDisplayName(user)}</p>
                <p className="app-user-role">{mapRoleLabel(user?.role)}</p>
              </div>
              <div className="shell-user-avatar shell-user-avatar-initials ring-2 ring-surface-container">
                {getInitials(user)}
              </div>
            </div>
          </div>
        </header>

        <div className="shell-page-wrap space-y-8">
          {notice.text ? (
            <div className={`app-notice ${notice.type === "error" ? "app-notice-error" : "app-notice-success"}`}>
              <span>{notice.text}</span>
              <button type="button" className="app-notice-close" onClick={() => setNotice({ type: "", text: "" })}>
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : null}
          {error ? <div className="app-notice app-notice-error">{error}</div> : null}
          {!isAdmin ? <div className="app-notice app-notice-info">Trang người dùng chỉ dành cho quản trị viên (admin).</div> : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <h2 className="app-page-title uppercase">Quản lý người dùng</h2>
              <p className="app-page-subtitle">Phân quyền, theo dõi trạng thái và quản lý nhân sự trong hệ thống kỹ nghệ số chính xác.</p>
            </div>

            <div className="bg-surface-container-low rounded-xl p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phân bổ nhân sự</p>
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-[#4edea3]" />
                  <span className="text-xs text-slate-600">Kỹ thuật: {totalUsers ? Math.round((roleStats.technician / totalUsers) * 100) : 0}%</span>
                </div>
              </div>

              <div className="flex items-end gap-1 h-12">
                <div className="w-3 bg-[#001e40] rounded-t-sm" style={{ height: `${Math.max(20, Math.min(100, roleStats.admin * 20))}%` }} />
                <div className="w-3 bg-[#4edea3] rounded-t-sm" style={{ height: `${Math.max(20, Math.min(100, roleStats.technician * 6))}%` }} />
                <div className="w-3 bg-secondary rounded-t-sm" style={{ height: `${Math.max(20, Math.min(100, roleStats.manager * 12))}%` }} />
                <div className="w-3 bg-error rounded-t-sm" style={{ height: `${Math.max(20, Math.min(100, roleStats.accountant * 12))}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
            <div className="xl:col-span-3">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Người dùng</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Vai trò</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {pagedUsers.map((item) => (
                        <tr key={item._id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg shell-user-avatar-initials">
                                {getInitials(item)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">{item.name}</p>
                                <p className="text-xs text-on-surface-variant">{item.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`text-[11px] px-2 py-1 rounded-md font-bold uppercase tracking-tighter ${mapRoleTone(item.role)}`}>
                              {mapRoleText(item.role)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${item.isActive ? "bg-tertiary-fixed-dim shadow-[0_0_8px_#4edea3]" : "bg-slate-300"}`} />
                              <span className="text-xs font-medium text-slate-700">{item.isActive ? "Hoạt động" : "Tạm khóa"}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <button
                              className="text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
                              type="button"
                              disabled={!isAdmin || toggleLoadingId === item._id}
                              onClick={() => toggleUserStatus(item)}
                              title={item.isActive ? "Khóa tài khoản" : "Mở tài khoản"}
                            >
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!loading && filteredUsers.length === 0 ? (
                        <tr>
                          <td className="px-6 py-8 text-center text-sm text-slate-500" colSpan="4">Không có người dùng phù hợp.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-surface-container-low/50 flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant">Hiển thị {filteredUsers.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(filteredUsers.length, safePage * PAGE_SIZE)} trên {filteredUsers.length} người dùng</span>
                  <div className="flex space-x-2">
                    <button className="p-1.5 rounded bg-white text-slate-400 hover:text-primary shadow-sm disabled:opacity-50" type="button" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}>
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button className="p-1.5 rounded bg-[#001e40] text-white shadow-sm disabled:opacity-50" type="button" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}>
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="bg-surface-container-low rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-primary mb-1 uppercase tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container">add_task</span>
                    Thêm người dùng
                  </h3>
                  <p className="text-xs text-on-surface-variant">Tạo tài khoản mới và cấp quyền truy cập.</p>
                </div>

                {formError ? <div className="app-notice-compact app-notice-error">{formError}</div> : null}

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createUser(); }}>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Họ và tên</label>
                    <input
                      className="w-full bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-[#4edea3]/50 py-2.5"
                      placeholder="VD: Nguyễn Văn A"
                      value={form.name}
                      disabled={!isAdmin}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Email liên hệ</label>
                    <input
                      className="w-full bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-[#4edea3]/50 py-2.5"
                      placeholder="email@foreman.vn"
                      type="email"
                      value={form.email}
                      disabled={!isAdmin}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Mật khẩu tạm thời</label>
                    <input
                      className="w-full bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-[#4edea3]/50 py-2.5"
                      placeholder="••••••••"
                      type="password"
                      value={form.password}
                      disabled={!isAdmin}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Phân quyền vai trò</label>
                    <select
                      className="w-full bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-[#4edea3]/50 py-2.5"
                      value={form.role}
                      disabled={!isAdmin}
                      onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                    >
                      <option value="technician">Kỹ thuật viên</option>
                      <option value="site_manager">Quản lý</option>
                      <option value="admin">Quản trị viên</option>
                      <option value="accountant">Kế toán</option>
                    </select>
                  </div>

                  <button
                    className="w-full bg-primary hover:bg-primary-container text-[#4edea3] font-bold text-sm py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50"
                    type="submit"
                    disabled={!isAdmin || formLoading}
                  >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span>{formLoading ? "Đang tạo..." : "Xác nhận thêm mới"}</span>
                  </button>

                  <p className="text-[10px] text-center text-slate-500 italic">Admin cần gửi mật khẩu tạm thời cho người dùng mới qua kênh nội bộ.</p>
                </form>
              </div>

              <div className="mt-8 bg-surface-container-lowest rounded-xl p-6 border border-slate-100">
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-6 text-center">Tỉ lệ vai trò</h4>

                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle className="stroke-[#001e40]" cx="18" cy="18" fill="none" r="16" strokeDasharray="100,100" strokeWidth="4" />
                    <circle className="stroke-[#4edea3]" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${totalUsers ? (roleStats.technician / totalUsers) * 100 : 0},100`} strokeWidth="4" />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-primary">{totalUsers}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Tổng số</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-sm bg-[#4edea3]" /><span className="text-[10px] font-medium">Kỹ thuật ({roleStats.technician})</span></div>
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-sm bg-amber-400" /><span className="text-[10px] font-medium">Quản lý ({roleStats.manager})</span></div>
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-sm bg-[#001e40]" /><span className="text-[10px] font-medium">Admin ({roleStats.admin})</span></div>
                  <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-sm bg-error" /><span className="text-[10px] font-medium">Kế toán ({roleStats.accountant})</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showHelp ? (
        <div className="app-modal-overlay z-[60]" onClick={() => setShowHelp(false)}>
          <div className="app-modal-panel max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-lg font-bold text-primary">Hướng dẫn nhanh</h3></div>
            <div className="px-6 py-5 text-sm text-slate-700 space-y-3">
              <p>1. Dùng ô tìm kiếm để lọc nhanh theo tên, email hoặc vai trò.</p>
              <p>2. Chỉ admin mới được tạo tài khoản và khóa/mở khóa người dùng.</p>
              <p>3. Chấm ba dọc ở cột Hành động để đổi trạng thái người dùng.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UsersPage;
