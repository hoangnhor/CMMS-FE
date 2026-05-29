import {
  approveWorkOrderApi,
  completeWorkOrderApi,
  createWorkOrderApi,
  getWorkOrderByIdApi,
  rejectWorkOrderApi,
  signOffWorkOrderApi,
  startWorkOrderApi,
  submitWorkOrderApi,
  updateWorkOrderApi,
} from "../../services/workOrder.api";

export async function submitCommand(id) {
  return submitWorkOrderApi(id);
}

export async function approveCommand(id, payload) {
  return approveWorkOrderApi(id, payload);
}

export async function rejectCommand(id, payload) {
  return rejectWorkOrderApi(id, payload);
}

export async function startCommand(id) {
  return startWorkOrderApi(id);
}

export async function completeCommand(id, payload) {
  return completeWorkOrderApi(id, payload);
}

export async function signOffCommand(id, payload) {
  return signOffWorkOrderApi(id, payload);
}

export async function updateCommand(id, payload) {
  return updateWorkOrderApi(id, payload);
}

export async function createCommand(payload) {
  return createWorkOrderApi(payload);
}

export async function detailCommand(id) {
  return getWorkOrderByIdApi(id);
}
