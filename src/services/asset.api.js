import { del, get, post, put } from "./http";

export async function listAssetsApi(params = {}) {
  return get("/assets", { params });
}

export async function getAssetByIdApi(id) {
  return get(`/assets/${id}`);
}

export async function updateAssetApi(id, payload) {
  return put(`/assets/${id}`, payload);
}

export async function createAssetApi(payload) {
  return post("/assets", payload);
}

export async function deleteAssetApi(id) {
  return del(`/assets/${id}`);
}
