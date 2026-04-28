import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDisplayName, getInitials, mapRoleLabel } from "../../utils/userDisplay";

const NAV_ITEMS = [
  { key: "dashboard", label: "Bảng điều khiển", icon: "dashboard", path: "/dashboard" },
  { key: "assets", label: "Tài sản", icon: "precision_manufacturing", path: "/assets" },
  { key: "work-orders", label: "Lệnh công việc", icon: "engineering", path: "/work-orders" },
  { key: "maintenance", label: "Bảo trì", icon: "build", path: "/maintenance" },
  { key: "users", label: "Người dùng", icon: "group", path: "/users" },
];

function NotificationPanel({ notifications }) {
  return (
    <div className="absolute right-0 top-12 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="border-b border-slate-100 px-2 pb-2 text-sm font-bold text-primary">
        Thông báo hệ thống
      </div>
      <div className="mt-2 max-h-72 space-y-2 overflow-auto">
        {notifications.length === 0 ? (
          <div className="px-2 py-3 text-sm text-slate-500">Không có thông báo mới.</div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className={`rounded-lg px-3 py-2 text-sm ${item.tone || ""}`}>
              {item.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ShellNav({ currentKey, onNavigate, onLogout }) {
  return (
    <>
      <div className="mb-8 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#4edea3]">
            <span
              className="material-symbols-outlined text-sm text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              precision_manufacturing
            </span>
          </div>
          <div>
            <h1 className="shell-brand-title font-headline uppercase tracking-tighter text-white">
              Digital Foreman
            </h1>
            <p className="shell-brand-subtitle">Hệ thống Kỹ nghệ Số</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.key === currentKey;
          return (
            <button
              key={item.key}
              className={`side-nav-btn flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 active:scale-95 ${
                active
                  ? "border-r-4 border-[#4edea3] bg-white/10 text-[#4edea3]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
              type="button"
              onClick={() => onNavigate(item.path)}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="shell-nav-text font-['Inter']">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-3">
        <button
          className="side-nav-btn flex w-full items-center gap-3 px-4 py-3 text-left text-slate-300 transition-all duration-200 hover:bg-white/5 hover:text-white active:scale-95"
          type="button"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="shell-nav-text font-['Inter']">Đăng xuất</span>
        </button>
      </div>
    </>
  );
}

function AppShell({
  currentKey,
  user,
  search = "",
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  notifications = [],
  notificationsRef,
  showNotifications,
  setShowNotifications,
  setShowHelp,
  onLogout,
  headerActions = null,
  children,
}) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mobileCurrent = useMemo(
    () => NAV_ITEMS.find((item) => item.key === currentKey)?.label || "Digital Foreman",
    [currentKey]
  );

  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] text-on-surface">
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-200 lg:hidden ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col bg-[#001e40] py-6 shadow-2xl shadow-black/20 transition-transform duration-200 lg:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ShellNav currentKey={currentKey} onNavigate={handleNavigate} onLogout={onLogout} />
      </aside>

      <header className="shell-header fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200/70 px-4 lg:left-[17rem] lg:px-8">
        <div className="flex h-full items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở điều hướng"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="shell-search-wrap relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                  search
                </span>
                <input
                  className="shell-search-input w-full rounded-lg border-none py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-[#4edea3]/50"
                  placeholder={searchPlaceholder}
                  type="text"
                  value={search}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                />
              </div>
              <div className="min-w-0 sm:hidden">
                <p className="truncate text-sm font-bold text-primary">{mobileCurrent}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Digital Foreman</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {headerActions}
            <div className="relative flex items-center gap-2 sm:gap-4" ref={notificationsRef}>
              <button
                className="relative text-slate-500 transition-colors hover:text-[#4edea3]"
                type="button"
                onClick={() => setShowNotifications?.((prev) => !prev)}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: showNotifications ? "'FILL' 1" : "'FILL' 0" }}
                >
                  notifications
                </span>
                {notifications.length > 0 ? (
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-error" />
                ) : null}
              </button>
              <button
                className="text-slate-500 transition-colors hover:text-[#4edea3]"
                type="button"
                onClick={() => setShowHelp?.(true)}
              >
                <span className="material-symbols-outlined">help</span>
              </button>
              {showNotifications ? <NotificationPanel notifications={notifications} /> : null}
            </div>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="text-right">
                <p className="app-user-name">{getDisplayName(user)}</p>
                <p className="app-user-role">{mapRoleLabel(user?.role)}</p>
              </div>
              <div className="shell-user-avatar shell-user-avatar-initials ring-2 ring-surface-container">
                {getInitials(user)}
              </div>
            </div>
          </div>
        </div>

        <div className="pb-3 sm:hidden">
          <div className="shell-search-wrap relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              search
            </span>
            <input
              className="shell-search-input w-full rounded-lg border-none py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-[#4edea3]/50"
              placeholder={searchPlaceholder}
              type="text"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-[#eef3f8] pt-28 lg:ml-[17rem] lg:pt-16">
        {children}
      </main>
    </div>
  );
}

export default AppShell;
