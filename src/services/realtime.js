import { io } from "socket.io-client";
import { resolveRealtimeBaseUrl } from "../utils/apiBase";

let socketInstance = null;
let activeSubscriptions = 0;
let pendingDisconnectTimer = null;

function clearPendingDisconnect() {
  if (pendingDisconnectTimer) {
    clearTimeout(pendingDisconnectTimer);
    pendingDisconnectTimer = null;
  }
}

function disconnectIfIdle() {
  clearPendingDisconnect();
  pendingDisconnectTimer = setTimeout(() => {
    if (activeSubscriptions > 0) return;
    if (socketInstance?.connected) {
      socketInstance.disconnect();
    }
  }, 0);
}

export function getRealtimeSocket() {
  if (socketInstance) return socketInstance;

  socketInstance = io(resolveRealtimeBaseUrl(), {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socketInstance;
}

export function ensureRealtimeConnected() {
  const socket = getRealtimeSocket();
  socket.auth = {};

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function subscribeRealtime(events, handler) {
  const socket = ensureRealtimeConnected();
  clearPendingDisconnect();
  activeSubscriptions += 1;

  events.forEach((event) => socket.on(event, handler));

  return () => {
    events.forEach((event) => socket.off(event, handler));
    activeSubscriptions = Math.max(0, activeSubscriptions - 1);
    disconnectIfIdle();
  };
}
