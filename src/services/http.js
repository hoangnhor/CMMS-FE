import api from "./api";
import { readQueryCache, writeQueryCache } from "../utils/queryCache";

async function unwrap(promise) {
  const response = await promise;
  const payload = response.data;
  if (payload?.success === false) {
    const err = new Error(payload.message || "Yêu cầu thất bại");
    err.response = { data: payload, status: response.status };
    throw err;
  }
  return payload;
}

function buildCacheConfig(config) {
  return {
    params: config?.params || {},
  };
}

async function requestWithCache(method, path, payload, config) {
  const canUseCache = method === "GET";
  const cacheConfig = buildCacheConfig(config);

  try {
    const response =
      method === "GET"
        ? await api.get(path, config)
        : method === "POST"
          ? await api.post(path, payload, config)
          : method === "PUT"
            ? await api.put(path, payload, config)
            : method === "PATCH"
              ? await api.patch(path, payload, config)
              : await api.delete(path, config);

    const payload = await unwrap(Promise.resolve(response));
    if (canUseCache) {
      writeQueryCache(method, path, cacheConfig, payload);
    }

    return payload;
  } catch (error) {
    if (canUseCache) {
      const cachedPayload = readQueryCache(method, path, cacheConfig);
      if (cachedPayload !== null) {
        return cachedPayload;
      }
    }

    throw error;
  }
}

export function get(path, config) {
  return requestWithCache("GET", path, null, config);
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
