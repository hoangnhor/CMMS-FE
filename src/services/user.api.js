import { get, patch, post } from "./http";

export async function listUsersApi(params = {}) {
  return get("/users", { params });
}

export async function createUserApi(payload) {
  return post("/users", payload);
}

export async function updateUserStatusApi(id, payload) {
  return patch(`/users/${id}/status`, payload);
}
