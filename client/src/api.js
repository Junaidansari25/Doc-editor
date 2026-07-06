const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, { method = 'GET', body, userId, headers = {} } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(userId ? { 'x-user-id': userId } : {}),
      ...headers
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Request failed.');
  }

  return data;
}

export const api = {
  getUsers: () => request('/api/users'),
  listDocuments: (userId) => request('/api/documents', { userId }),
  createDocument: (userId, payload) => request('/api/documents', { method: 'POST', userId, body: payload }),
  getDocument: (userId, id) => request(`/api/documents/${id}`, { userId }),
  updateDocument: (userId, id, payload) =>
    request(`/api/documents/${id}`, { method: 'PATCH', userId, body: payload }),
  shareDocument: (userId, id, targetUserId) =>
    request(`/api/documents/${id}/share`, { method: 'POST', userId, body: { userId: targetUserId } }),
  importNewDocument: (userId, formData) =>
    request('/api/documents/import', { method: 'POST', userId, body: formData }),
  importIntoDocument: (userId, id, formData) =>
    request(`/api/documents/${id}/import`, { method: 'POST', userId, body: formData })
};
