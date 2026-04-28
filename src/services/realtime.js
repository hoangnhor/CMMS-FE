import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { resolveRealtimeBaseUrl } from "../utils/apiBase";

let socketInstance = null;

export function getRealtimeSocket() {
  if (socketInstance) return socketInstance;

  socketInstance = io(resolveRealtimeBaseUrl(), {
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
