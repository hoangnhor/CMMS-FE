import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import heroImage from "../../assets/hero.png";
import "./style.css";

const QUICK_ACCOUNTS = [
  {
    label: "Admin",
    role: "Toàn quyền",
    email: "admin@factory.local",
    password: "password123",
    icon: "shield_person",
  },
  {
    label: "Manager",
    role: "Site Manager",
    email: "manager@factory.local",
    password: "password123",
    icon: "factory",
  },
  {
    label: "Technician",
    role: "Technician",
    email: "tech1@factory.local",
    password: "password123",
    icon: "build_circle",
  },
  {
    label: "Accountant",
    role: "Accountant",
    email: "accountant@factory.local",
    password: "password123",
    icon: "account_balance_wallet",
  },
];

function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [supportNotice, setSupportNotice] = useState("");
  const {
    form,
    remember,
    loading,
    error,
    isAuthenticated,
    setField,
    setRemember,
    submit,
    clearError,
    hydrate,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit();
  };

  const quickLogin = async (account) => {
    clearError();
    setSupportNotice("");
    setField("email", account.email);
    setField("password", account.password);
    setRemember(true);
    await submit({
      email: account.email,
      password: account.password,
      remember: true,
    });
  };

  const openSupportNotice = (event) => {
    event.preventDefault();
    setSupportNotice("Vui lòng liên hệ quản trị hệ thống để được cấp lại mật khẩu.");
  };

  return (
    <div className="bg-surface text-on-surface antialiased overflow-hidden">
      <main className="flex min-h-screen w-full">
        <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-primary">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover opacity-40 grayscale-[0.2]"
              data-alt="Modern high-tech factory interior with robotic arms and blue atmospheric lighting, shallow depth of field, premium industrial aesthetic"
              src={heroImage}
              alt="Factory"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/80 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-tertiary-fixed-dim p-2 rounded-lg">
              <span
                className="material-symbols-outlined text-primary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                precision_manufacturing
              </span>
            </div>
            <div>
              <h1 className="shell-brand-title tracking-tighter text-white uppercase leading-none">
                Digital Foreman
              </h1>
              <p className="shell-brand-subtitle mt-1 text-tertiary-fixed-dim">
                Hệ thống Kỹ nghệ số
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Sự chính xác trong <br />
              <span className="text-tertiary-fixed-dim">từng chuyển động.</span>
            </h2>
            <div className="mt-8 flex gap-4">
              <div className="h-1 w-12 bg-tertiary-fixed-dim rounded-full" />
              <p className="text-on-primary-container text-sm leading-relaxed max-w-xs">
                Tối ưu hóa quy trình bảo trì và vận hành nhà máy với giải pháp kỹ thuật
                số chính xác tuyệt đối.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-on-primary-container/60 font-medium tracking-widest uppercase">
            <span>Precision Architecture v2.4</span>
            <div className="flex gap-6">
              <span>Active Monitoring</span>
              <span>AI-Driven Maintenance</span>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-1/2 flex flex-col justify-start items-center p-6 pt-6 md:p-12 md:pt-8 lg:p-24 lg:pt-10 bg-surface-container-lowest">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <span
                className="material-symbols-outlined text-primary-container text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                precision_manufacturing
              </span>
              <h1 className="shell-brand-title tracking-tighter text-primary uppercase">
                Digital Foreman
              </h1>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-primary tracking-tight mb-2">
                Đăng nhập hệ thống
              </h2>
              <p className="text-on-surface-variant text-sm">
                Vui lòng nhập thông tin tài khoản của bạn.
              </p>
            </div>

            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Tài khoản truy cập nhanh
                </h3>
                <span className="text-[11px] text-outline">1 chạm để đăng nhập</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {QUICK_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className="rounded-md border border-surface-container bg-surface px-2 py-1.5 text-left transition-colors hover:border-tertiary-fixed-dim hover:bg-surface-container-low disabled:opacity-60"
                    onClick={() => quickLogin(account)}
                    disabled={loading}
                  >
                    <div className="flex items-start gap-1.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-container/10 text-primary-container">
                        <span className="material-symbols-outlined text-[15px]">{account.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold text-primary leading-none">{account.label}</p>
                          <span className="rounded-full bg-surface-container-low px-1 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            {account.role}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-on-surface leading-snug">{account.name}</p>
                        <p className="truncate text-[9px] text-on-surface-variant">{account.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    id="email"
                    className="block w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-tertiary-fixed-dim/50 transition-all duration-200 text-sm"
                    placeholder="admin@factory.local"
                    type="email"
                    value={form.email}
                    autoComplete="email"
                    onChange={(event) => {
                      clearError();
                      setField("email", event.target.value);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="password">
                    Mật khẩu
                  </label>
                  <a
                    className="text-xs font-semibold text-primary-container hover:text-tertiary-fixed-dim transition-colors"
                    href="#"
                    onClick={openSupportNotice}
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    id="password"
                    className="block w-full pl-11 pr-12 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-tertiary-fixed-dim/50 transition-all duration-200 text-sm"
                    placeholder="********"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    autoComplete="current-password"
                    onChange={(event) => {
                      clearError();
                      setField("password", event.target.value);
                    }}
                    required
                  />
                  <button
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center ml-1">
                <input
                  className="w-4 h-4 rounded-lg border-outline-variant text-primary-container focus:ring-tertiary-fixed-dim/50 cursor-pointer"
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <label className="ml-3 text-sm text-on-surface-variant select-none cursor-pointer" htmlFor="remember">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              {error ? (
                <div className="app-notice app-notice-error">
                  {error}
                </div>
              ) : null}

              {supportNotice ? (
                <div className="app-notice app-notice-info">
                  <span>{supportNotice}</span>
                  <button
                    type="button"
                    className="app-notice-close"
                    onClick={() => setSupportNotice("")}
                    aria-label="Đóng thông báo hỗ trợ"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ) : null}

              <button
                className="w-full py-4 bg-primary-container text-white font-bold rounded-xl shadow-xl shadow-primary-container/10 hover:shadow-primary-container/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                <span>Hỗ trợ kỹ thuật: 1900 6789</span>
              </div>
              <div className="text-[10px] font-bold text-outline uppercase tracking-widest">
                Phiên bản 4.0.2-Stable
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 right-0 p-8 opacity-10 pointer-events-none">
        <span
          className="material-symbols-outlined text-[200px]"
          style={{ fontVariationSettings: "'wght' 100" }}
        >
          engineering
        </span>
      </div>
    </div>
  );
}

export default SignInPage;
