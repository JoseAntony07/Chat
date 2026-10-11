import { useCallback, useEffect, useRef, useState } from 'react'
import { WEBSOCKET_BASE_URL } from '../../lib/config'

export default function useChatSocket({ conversationId, token, enabled, onMessage }) {
  const socketRef = useRef(null)
  const callbackRef = useRef(onMessage)
  const [connection, setConnection] = useState({ conversationId: null, status: 'connecting' })
  const status = connection.conversationId === String(conversationId)
    ? connection.status
    : enabled ? 'connecting' : 'disconnected'

  useEffect(() => { callbackRef.current = onMessage }, [onMessage])

  useEffect(() => {
    if (!enabled || !conversationId || !token) return undefined

    let stopped = false
    let reconnectTimer
    let retryDelay = 1200
    let socket

    function connect() {
      const url = `${WEBSOCKET_BASE_URL}/ws/chat/${conversationId}/?token=${encodeURIComponent(token)}`
      socket = new WebSocket(url)
      socketRef.current = socket

      socket.onopen = () => {
        if (stopped) return
        retryDelay = 1200
        setConnection({ conversationId: String(conversationId), status: 'connected' })
      }

      socket.onmessage = event => {
        if (stopped) return
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'message') callbackRef.current(data.message)
          if (data.type === 'error') setConnection({ conversationId: String(conversationId), status: data.message })
        } catch {
          setConnection({ conversationId: String(conversationId), status: 'Received an unreadable message from the server.' })
        }
      }

      socket.onerror = () => {
        if (!stopped) setConnection({ conversationId: String(conversationId), status: 'Connection interrupted. Reconnecting…' })
      }
      socket.onclose = event => {
        if (stopped) return
        if (event.code === 4403) {
          setConnection({ conversationId: String(conversationId), status: 'Access to this conversation was rejected. Sign in again and check membership.' })
          return
        }
        setConnection({ conversationId: String(conversationId), status: `Disconnected (${event.code}). Reconnecting…` })
        reconnectTimer = setTimeout(connect, retryDelay)
        retryDelay = Math.min(retryDelay * 1.7, 8000)
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(reconnectTimer)
      socket?.close()
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [conversationId, enabled, token])

  const sendMessage = useCallback(body => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return false
    socketRef.current.send(JSON.stringify({ body }))
    return true
  }, [])

  return { status, sendMessage }
}
