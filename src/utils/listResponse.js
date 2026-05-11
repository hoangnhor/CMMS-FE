export function normalizeListResponse(response) {
  if (Array.isArray(response?.data)) {
    return {
      items: response.data,
      pagination: null,
    };
  }

  if (response?.data && Array.isArray(response.data.items)) {
    return {
      items: response.data.items,
      pagination: response.data.pagination || null,
    };
  }

  return {
    items: [],
    pagination: null,
  };
}
