import { useCallback, useMemo, useState } from "react";
import { loginApi } from "../services/auth.api";
import { useAuthStore } from "../store/authStore";
import { setStoredCsrfToken } from "../utils/csrfToken";

const REMEMBER_CREDENTIALS_KEY = "am_remember_credentials";

function readRememberedCredentials() {
  try {
    const raw = localStorage.getItem(REMEMBER_CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      email: typeof parsed.email === "string" ? parsed.email : "",
      remember: Boolean(parsed.remember),
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const remembered = readRememberedCredentials();
  const [form, setForm] = useState({
    email: remembered?.email || "",
    password: "",
  });
  const [remember, setRemember] = useState(remembered?.remember ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const hydrateStore = useAuthStore((state) => state.hydrate);

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const hydrate = useCallback(async () => {
    await hydrateStore();
  }, [hydrateStore]);

  const submit = useCallback(
    async (override = null) => {
      const email = override?.email ?? form.email;
      const password = override?.password ?? form.password;
      const rememberValue = override?.remember ?? remember;

      try {
        setLoading(true);
        setError("");

        const result = await loginApi({
          email: email.trim(),
          password,
        });

        if (!result?.success || !result?.data?.user) {
          throw new Error(result?.message || "Đăng nhập thất bại");
        }

        setStoredCsrfToken(result?.data?.csrfToken || "");

        if (rememberValue) {
          localStorage.setItem(
            REMEMBER_CREDENTIALS_KEY,
            JSON.stringify({
              email: email.trim(),
              remember: true,
            })
          );
        } else {
          localStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
        }

        setAuth({ user: result.data.user });
        return true;
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || "Đăng nhập thất bại";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [form.email, form.password, remember, setAuth]
  );

  return useMemo(
    () => ({
      form,
      remember,
      loading,
      error,
      isAuthenticated: Boolean(user?._id),
      setField,
      setRemember,
      clearError,
      submit,
      hydrate,
    }),
    [form, remember, loading, error, user?._id, setField, clearError, submit, hydrate]
  );
}
