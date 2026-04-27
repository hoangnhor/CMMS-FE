import api from "./api";

export async function listWorkOrdersApi(params = {}) {
  const response = await api.get("/work-orders", { params });
  return response.data;
}

export async function getWorkOrderByIdApi(id) {
  const response = await api.get(`/work-orders/${id}`);
  return response.data;
}

export async function createWorkOrderApi(payload) {
  const response = await api.post("/work-orders", payload);
  return response.data;
}

export async function updateWorkOrderApi(id, payload) {
  const response = await api.put(`/work-orders/${id}`, payload);
  return response.data;
}

export async function submitWorkOrderApi(id) {
  const response = await api.put(`/work-orders/${id}/submit`);
  return response.data;
}

export async function approveWorkOrderApi(id, payload = {}) {
  const response = await api.put(`/work-orders/${id}/approve`, payload);
  return response.data;
}

export async function rejectWorkOrderApi(id, payload) {
  const response = await api.put(`/work-orders/${id}/reject`, payload);
  return response.data;
}

export async function startWorkOrderApi(id) {
  const response = await api.put(`/work-orders/${id}/start`);
  return response.data;
}

export async function completeWorkOrderApi(id, payload) {
  const response = await api.put(`/work-orders/${id}/complete`, payload);
  return response.data;
}

export async function signOffWorkOrderApi(id, payload = { qcSignOff: true }) {
  const response = await api.put(`/work-orders/${id}/sign-off`, payload);
  return response.data;
}
