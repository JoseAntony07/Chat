const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail = body.detail || Object.values(body).flat().join(' ') || 'Something went wrong.'
    throw new Error(detail)
  }

  return body
}
