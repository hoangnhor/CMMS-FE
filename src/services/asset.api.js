import api from "./api";

export async function listAssetsApi(params = {}) {
  const response = await api.get("/assets", { params });
  return response.data;
}

export async function getAssetByIdApi(id) {
  const response = await api.get(`/assets/${id}`);
  return response.data;
}

export async function updateAssetApi(id, payload) {
  const response = await api.put(`/assets/${id}`, payload);
  return response.data;
}

export async function createAssetApi(payload) {
  const response = await api.post("/assets", payload);
  return response.data;
}

export async function deleteAssetApi(id) {
  const response = await api.delete(`/assets/${id}`);
  return response.data;
}
