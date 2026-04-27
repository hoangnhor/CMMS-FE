import api from "./api";

export async function listUsersApi(params = {}) {
  const response = await api.get("/users", { params });
  return response.data;
}

export async function createUserApi(payload) {
  const response = await api.post("/users", payload);
  return response.data;
}

export async function updateUserStatusApi(id, payload) {
  const response = await api.patch(`/users/${id}/status`, payload);
  return response.data;
}
