import axios from "axios";

const TOKEN_KEY = "am_token";

function readToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("am_user");
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem("am_user");
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthStorage();
    }
    return Promise.reject(error);
  }
);

export default api;
