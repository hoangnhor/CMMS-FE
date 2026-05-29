import { get, post } from "./http";

export async function loginApi(payload) {
  return post("/auth/login", payload);
}

export async function meApi() {
  return get("/auth/me");
}

export async function refreshApi() {
  return post("/auth/refresh", {});
}

export async function logoutApi() {
  return post("/auth/logout", {});
}
