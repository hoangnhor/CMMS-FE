import api from "./api";

async function unwrap(promise) {
  const response = await promise;
  return response.data;
}

export function get(path, config) {
  return unwrap(api.get(path, config));
}

export function post(path, payload, config) {
  return unwrap(api.post(path, payload, config));
}

export function put(path, payload, config) {
  return unwrap(api.put(path, payload, config));
}

export function patch(path, payload, config) {
  return unwrap(api.patch(path, payload, config));
}

export function del(path, config) {
  return unwrap(api.delete(path, config));
}
