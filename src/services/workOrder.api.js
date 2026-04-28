import { get, post, put } from "./http";

export async function listWorkOrdersApi(params = {}) {
  return get("/work-orders", { params });
}

export async function getWorkOrderByIdApi(id) {
  return get(`/work-orders/${id}`);
}

export async function createWorkOrderApi(payload) {
  return post("/work-orders", payload);
}

export async function updateWorkOrderApi(id, payload) {
  return put(`/work-orders/${id}`, payload);
}

export async function submitWorkOrderApi(id) {
  return put(`/work-orders/${id}/submit`);
}

export async function approveWorkOrderApi(id, payload = {}) {
  return put(`/work-orders/${id}/approve`, payload);
}

export async function rejectWorkOrderApi(id, payload) {
  return put(`/work-orders/${id}/reject`, payload);
}

export async function startWorkOrderApi(id) {
  return put(`/work-orders/${id}/start`);
}

export async function completeWorkOrderApi(id, payload) {
  return put(`/work-orders/${id}/complete`, payload);
}

export async function signOffWorkOrderApi(id, payload = { qcSignOff: true }) {
  return put(`/work-orders/${id}/sign-off`, payload);
}
