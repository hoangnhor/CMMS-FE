const CSRF_STORAGE_KEY = "am_csrf_token";

export function getStoredCsrfToken() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(CSRF_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredCsrfToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(CSRF_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(CSRF_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures and keep request flow working.
  }
}

export function clearStoredCsrfToken() {
  setStoredCsrfToken("");
}
