import { get, post, put } from "./http";

export async function listMaintenanceLogsApi(params = {}) {
  return get("/maintenance-logs", { params });
}

export async function getMaintenanceLogByIdApi(id) {
  return get(`/maintenance-logs/${id}`);
}

export async function listPmSchedulesApi(params = {}) {
  return get("/pm-schedules", { params });
}

export async function createPmScheduleApi(payload) {
  return post("/pm-schedules", payload);
}

export async function updatePmScheduleApi(id, payload) {
  return put(`/pm-schedules/${id}`, payload);
}
