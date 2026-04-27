import api from "./api";

export async function listMaintenanceLogsApi(params = {}) {
  const response = await api.get("/maintenance-logs", { params });
  return response.data;
}

export async function getMaintenanceLogByIdApi(id) {
  const response = await api.get(`/maintenance-logs/${id}`);
  return response.data;
}

export async function listPmSchedulesApi(params = {}) {
  const response = await api.get("/pm-schedules", { params });
  return response.data;
}

export async function createPmScheduleApi(payload) {
  const response = await api.post("/pm-schedules", payload);
  return response.data;
}

export async function updatePmScheduleApi(id, payload) {
  const response = await api.put(`/pm-schedules/${id}`, payload);
  return response.data;
}
