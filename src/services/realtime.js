import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let socketInstance = null;

function resolveApiBaseUrl() {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawBaseUrl && import.meta.env.PROD) {
    throw new Error("VITE_API_BASE_URL is required for production builds");
  }
  const normalizedBaseUrl = (rawBaseUrl || "http://localhost:5000/api").replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/api") ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;
}

function getRealtimeUrl() {
  const apiBase = resolveApiBaseUrl();
  return apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
}

export function getRealtimeSocket() {
  if (socketInstance) return socketInstance;

  socketInstance = io(getRealtimeUrl(), {
    autoConnect: false,
    transports: ["websocket", "polling"],
  });

  return socketInstance;
}

export function ensureRealtimeConnected() {
  const socket = getRealtimeSocket();
  const token = useAuthStore.getState().token;
  socket.auth = token ? { token } : {};
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function subscribeRealtime(events, handler) {
  const socket = ensureRealtimeConnected();
  events.forEach((event) => socket.on(event, handler));

  return () => {
    events.forEach((event) => socket.off(event, handler));
  };
}
