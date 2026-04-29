import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { createUserApi, listUsersApi, updateUserStatusApi } from "../../services/user.api";
import { subscribeRealtime } from "../../services/realtime";
import {
  PAGE_SIZE,
  buildCreateUserForm,
  buildRoleStats,
  buildUserNotifications,
  buildUserSearchText,
} from "./helpers";

export function useUsersPage() {
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

  const [form, setForm] = useState(buildCreateUserForm);
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
    return users.filter((item) => buildUserSearchText(item).includes(keyword));
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goPage = (value) => {
    const next = Math.max(1, Math.min(totalPages, value));
    setPage(next);
  };

  const roleStats = useMemo(() => buildRoleStats(users), [users]);
  const notifications = useMemo(() => buildUserNotifications(users), [users]);

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
      setForm(buildCreateUserForm());
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

  return {
    user,
    isAdmin,
    users,
    loading,
    error,
    notice,
    setNotice,
    search,
    setSearch,
    showNotifications,
    setShowNotifications,
    showHelp,
    setShowHelp,
    notificationsRef,
    form,
    setForm,
    formError,
    formLoading,
    toggleLoadingId,
    page,
    setPage,
    filteredUsers,
    safePage,
    totalPages,
    pagedUsers,
    goPage,
    roleStats,
    notifications,
    handleLogout,
    createUser,
    toggleUserStatus,
    totalUsers: users.length,
  };
}
