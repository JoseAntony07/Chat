import { apiRequest } from '../../lib/apiClient'

export function registerAccount(username, password) {
  return apiRequest('/auth/register/', null, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function signIn(username, password) {
  return apiRequest('/auth/token/', null, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getCurrentUser(token) {
  return apiRequest('/auth/me/', token)
}
