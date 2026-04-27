import { create } from "zustand";

const TOKEN_KEY = "am_token";
const USER_KEY = "am_user";

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  return readJson(localStorage, USER_KEY) || readJson(sessionStorage, USER_KEY);
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setAuth: ({ token, user, remember = true }) => {
    clearStoredAuth();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, hydrated: true });
  },
  logout: () => {
    clearStoredAuth();
    set({ token: null, user: null, hydrated: true });
  },
  hydrate: () => {
    const token = getStoredToken();
    const user = getStoredUser();
    set({ token: token || null, user, hydrated: true });
  },
}));
