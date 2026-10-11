import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { registerAccount, signIn } from './authApi'

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const cleanUsername = username.trim()
      if (mode === 'register') await registerAccount(cleanUsername, password)
      const tokenPair = await signIn(cleanUsername, password)
      onAuthenticated(tokenPair)
      setPassword('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function toggleMode() {
    setMode(currentMode => currentMode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo"><MessageCircle size={20} /></div>
        <p className="eyebrow">YOUR SPACE</p>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to catch up with your people.' : 'Pick a username your friends can find.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input autoComplete="username" required minLength="2" value={username}
              onChange={event => setUsername(event.target.value)} placeholder="e.g. alex" />
          </label>
          <label>
            Password
            <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required minLength="8" type="password" value={password}
              onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" />
          </label>
          {error && <div className="error-message">{error}</div>}
          <button className="primary-button" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'New to Convo?' : 'Already have an account?'}{' '}
          <button onClick={toggleMode}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button>
        </p>
      </div>
    </main>
  )
}
