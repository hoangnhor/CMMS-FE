import api from "./api";

export async function loginApi(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data;
}

export async function meApi() {
  const response = await api.get("/auth/me");
  return response.data;
}
