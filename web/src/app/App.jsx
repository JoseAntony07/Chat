import { useCallback, useEffect, useState } from 'react'
import AuthPage from '../features/auth/AuthPage'
import { getCurrentUser } from '../features/auth/authApi'
import ChatPage from '../features/chat/ChatPage'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('convo.access'))
  const [currentUser, setCurrentUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(Boolean(token))

  const logout = useCallback(() => {
    localStorage.removeItem('convo.access')
    localStorage.removeItem('convo.refresh')
    setCurrentUser(null)
    setToken(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setCheckingSession(false)
      return undefined
    }

    let cancelled = false
    setCheckingSession(true)
    getCurrentUser(token)
      .then(user => { if (!cancelled) setCurrentUser(user) })
      .catch(() => { if (!cancelled) logout() })
      .finally(() => { if (!cancelled) setCheckingSession(false) })

    return () => { cancelled = true }
  }, [token, logout])

  function handleAuthenticated(tokenPair) {
    localStorage.setItem('convo.access', tokenPair.access)
    localStorage.setItem('convo.refresh', tokenPair.refresh)
    setCurrentUser(null)
    setToken(tokenPair.access)
  }

  if (checkingSession) {
    return <main className="auth-shell"><div className="auth-card">Loading your account…</div></main>
  }

  if (!token || !currentUser) return <AuthPage onAuthenticated={handleAuthenticated} />
  return <ChatPage token={token} currentUser={currentUser} onLogout={logout} />
}
