import { Platform } from 'react-native'

const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1'
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL
const configuredWebSocketUrl = process.env.EXPO_PUBLIC_WS_URL

export const API_BASE_URL = (configuredApiUrl || `http://${defaultHost}:8000/api`).replace(/\/$/, '')
const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '')

export const WEBSOCKET_BASE_URL = (configuredWebSocketUrl
  || apiOrigin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:'))
  .replace(/\/$/, '')

export const isUsingDefaultLocalHost = !configuredApiUrl
