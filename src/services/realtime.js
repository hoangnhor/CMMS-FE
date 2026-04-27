import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let socketInstance = null;

function getRealtimeUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
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
