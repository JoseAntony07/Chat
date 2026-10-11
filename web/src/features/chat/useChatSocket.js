import { useEffect, useRef, useState } from 'react'

const SOCKET_BASE_URL = import.meta.env.VITE_WS_URL
  || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

export default function useChatSocket({ conversationId, token, onMessage }) {
  const socketRef = useRef(null)
  const [connectionError, setConnectionError] = useState('')

  useEffect(() => {
    if (!conversationId || !token) return undefined

    let stopped = false
    let socket
    let retryTimer

    function connect() {
      socket = new WebSocket(
        `${SOCKET_BASE_URL}/ws/chat/${conversationId}/?token=${encodeURIComponent(token)}`,
      )
      socketRef.current = socket

      socket.onmessage = event => {
        const data = JSON.parse(event.data)
        if (data.type === 'message') onMessage(data.message)
        if (data.type === 'error') setConnectionError(data.message)
      }

      socket.onopen = () => setConnectionError('')
      socket.onerror = () => {
        setConnectionError('Chat connection failed. Check that the Django Daphne server is running.')
      }
      socket.onclose = event => {
        if (stopped) return
        if (event.code === 4403) {
          setConnectionError('Chat connection rejected. Sign in again and check conversation access.')
          return
        }
        setConnectionError(`Chat connection closed (${event.code}). Reconnecting…`)
        retryTimer = window.setTimeout(connect, 1200)
      }
    }

    connect()
    return () => {
      stopped = true
      window.clearTimeout(retryTimer)
      socket?.close()
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [conversationId, token, onMessage])

  function sendMessage(body) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return false
    socketRef.current.send(JSON.stringify({ body }))
    return true
  }

  return { sendMessage, connectionError }
}
