import { API_BASE_URL } from './config'

export async function apiRequest(path, token, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error(`Could not reach the Convo API at ${API_BASE_URL}. Check the mobile app's API URL and that Django is running.`)
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = body.detail || Object.values(body).flat().join(' ') || 'Something went wrong.'
    throw new Error(detail)
  }

  return body
}
