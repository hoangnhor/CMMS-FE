import { useCallback, useMemo, useState } from "react";
import { loginApi } from "../services/auth.api";
import { useAuthStore } from "../store/authStore";

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

  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const hydrateStore = useAuthStore((state) => state.hydrate);

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const hydrate = useCallback(() => {
    hydrateStore();
  }, [hydrateStore]);

  const submit = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await loginApi({
        email: form.email.trim(),
        password: form.password,
      });

      if (!result?.success || !result?.data?.token) {
        throw new Error(result?.message || "Đăng nhập thất bại");
      }

      if (remember) {
        localStorage.setItem(
          REMEMBER_CREDENTIALS_KEY,
          JSON.stringify({
            email: form.email.trim(),
            remember: true,
          })
        );
      } else {
        localStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
      }

      setAuth({ token: result.data.token, user: result.data.user, remember });
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Đăng nhập thất bại";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [form.email, form.password, remember, setAuth]);

  return useMemo(
    () => ({
      form,
      remember,
      loading,
      error,
      isAuthenticated: Boolean(token),
      setField,
      setRemember,
      clearError,
      submit,
      hydrate,
    }),
    [form, remember, loading, error, token, setField, clearError, submit, hydrate]
  );
}
