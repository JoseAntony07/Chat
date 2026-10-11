import { apiRequest } from '../../lib/apiClient'

export function listConversations(token) {
  return apiRequest('/conversations/', token)
}

export function listMessages(conversationId, token) {
  return apiRequest(`/conversations/${conversationId}/messages/`, token)
}

export function searchUsers(query, token) {
  return apiRequest(`/users/?q=${encodeURIComponent(query)}`, token)
}

export function getOrCreateConversation(username, token) {
  return apiRequest('/conversations/', token, {
    method: 'POST',
    body: JSON.stringify({ username }),
  })
}
