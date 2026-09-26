import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowLeft, Check, CheckCheck, LogOut, MessageCircle, Plus, Search, Send, Users, X } from 'lucide-react'
import './styles.css'

const API = import.meta.env.VITE_API_URL || '/api'
const SOCKET = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
const initials = name => (name || '?').slice(0, 1).toUpperCase()

function Avatar({ user, large = false }) {
  return <div className={`avatar ${large ? 'avatar-large' : ''}`} aria-hidden="true"><span>{initials(user?.username)}</span></div>
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = body.detail || Object.values(body).flat().join(' ') || 'Something went wrong.'
    throw new Error(detail)
  }
  return body
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('convo.access'))
  const [me, setMe] = useState(null)
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [mobileChat, setMobileChat] = useState(false)
  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  const loadConversations = useCallback(async currentToken => {
    const result = await request('/conversations/', currentToken)
    setConversations(result)
    return result
  }, [])

  const logout = useCallback(() => {
    socketRef.current?.close()
    localStorage.removeItem('convo.access')
    localStorage.removeItem('convo.refresh')
    setToken(null); setMe(null); setConversations([]); setActive(null); setMessages([])
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([request('/auth/me/', token), request('/conversations/', token)])
      .then(([user, chats]) => { if (!cancelled) { setMe(user); setConversations(chats) } })
      .catch(() => { if (!cancelled) logout() })
    return () => { cancelled = true }
  }, [token, logout])

  useEffect(() => {
    if (!token || search.trim().length < 2) { setUsers([]); return }
    let cancelled = false
    const timer = setTimeout(() => request(`/users/?q=${encodeURIComponent(search.trim())}`, token)
      .then(result => { if (!cancelled) setUsers(result) }).catch(err => { if (!cancelled) setError(err.message) }), 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [search, token])

  useEffect(() => {
    if (!token || !active) { socketRef.current?.close(); socketRef.current = null; return }
    let stopped = false
    let socket
    let retryTimer
    const connect = () => {
      socket = new WebSocket(`${SOCKET}/ws/chat/${active.id}/?token=${encodeURIComponent(token)}`)
      socketRef.current = socket
      socket.onmessage = event => {
        const data = JSON.parse(event.data)
        if (data.type === 'message') {
          setMessages(previous => previous.some(message => message.id === data.message.id) ? previous : [...previous, data.message])
          loadConversations(token).catch(() => {})
        } else if (data.type === 'error') setError(data.message)
      }
      socket.onopen = () => setError(previous => previous.startsWith('Chat connection') ? '' : previous)
      socket.onerror = () => setError('Chat connection failed. Check that the Django Daphne server is running.')
      socket.onclose = event => {
        if (stopped) return
        if (event.code === 4403) {
          setError('Chat connection rejected. Sign in again and make sure this account is a member of the conversation.')
          return
        }
        setError(`Chat connection closed (${event.code}). Reconnecting…`)
        retryTimer = setTimeout(connect, 1200)
      }
    }
    connect()
    return () => { stopped = true; clearTimeout(retryTimer); socket?.close(); if (socketRef.current === socket) socketRef.current = null }
  }, [active?.id, token, loadConversations])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function submitAuth(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      if (authMode === 'register') await request('/auth/register/', null, { method: 'POST', body: JSON.stringify({ username: username.trim(), password }) })
      const pair = await request('/auth/token/', null, { method: 'POST', body: JSON.stringify({ username: username.trim(), password }) })
      localStorage.setItem('convo.access', pair.access); localStorage.setItem('convo.refresh', pair.refresh)
      setToken(pair.access); setPassword('')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function openConversation(conversation) {
    setActive(conversation); setMessages([]); setError(''); setMobileChat(true)
    try { setMessages(await request(`/conversations/${conversation.id}/messages/`, token)) }
    catch (err) { setError(err.message) }
  }

  async function addFriend(user) {
    setError('')
    try {
      const conversation = await request('/conversations/', token, { method: 'POST', body: JSON.stringify({ username: user.username }) })
      const chats = await loadConversations(token)
      const saved = chats.find(chat => chat.id === conversation.id) || conversation
      setShowAdd(false); setSearch(''); setUsers([]); await openConversation(saved)
    } catch (err) { setError(err.message) }
  }

  function sendMessage(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      if (body) setError('Connecting to chat… try sending again in a moment.')
      return
    }
    socketRef.current.send(JSON.stringify({ body })); setDraft(''); setError('')
  }

  if (!token || !me) return <main className="auth-shell"><div className="auth-card"><div className="auth-logo"><MessageCircle size={20} /></div><p className="eyebrow">YOUR SPACE</p><h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="auth-subtitle">{authMode === 'login' ? 'Sign in to catch up with your people.' : 'Pick a username your friends can find.'}</p><form onSubmit={submitAuth} className="auth-form"><label>Username<input autoComplete="username" required minLength="2" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. alex" /></label><label>Password<input autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required minLength="8" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>{error && <div className="error-message">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button></form><p className="auth-switch">{authMode === 'login' ? 'New to Convo?' : 'Already have an account?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError('') }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></p></div></main>

  const visible = conversations.filter(chat => (chat.other_user?.username || '').toLowerCase().includes(query.toLowerCase()))
  const activeUser = active?.other_user
  return <main className="app-shell">
    <aside className="rail"><div className="brand-mark"><MessageCircle size={21} /></div><div className="rail-nav"><button className="rail-button selected" title="Messages"><MessageCircle size={19} /></button><button className="rail-button" onClick={() => setShowAdd(true)} title="Find people"><Users size={19} /></button></div><div className="rail-bottom"><div className="my-avatar"><Avatar user={me} /></div><button className="rail-button" title="Sign out" onClick={logout}><LogOut size={18} /></button></div></aside>
    <section className={`inbox ${mobileChat ? 'inbox-hidden' : ''}`}><header className="inbox-header"><div><p className="eyebrow">SIGNED IN AS @{me.username}</p><h1>Messages</h1></div><button className="icon-button new-message" aria-label="Add a friend" onClick={() => setShowAdd(true)}><Plus size={19} /></button></header><div className="search-wrap"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations" /></div><div className="filter-tabs"><button className="active">All <span>{conversations.length}</span></button><button onClick={() => setShowAdd(true)}>Find people</button></div><div className="conversation-list">{visible.length ? visible.map(chat => <button key={chat.id} className={`conversation ${active?.id === chat.id ? 'conversation-active' : ''}`} onClick={() => openConversation(chat)}><div className="conversation-avatar"><Avatar user={chat.other_user} /></div><div className="conversation-copy"><div className="conversation-top"><span className="person-name">@{chat.other_user?.username}</span><time>{chat.last_message ? new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</time></div><div className="conversation-bottom"><span className="preview">{chat.last_message ? `${chat.last_message.sender === me.id ? 'You: ' : ''}${chat.last_message.body}` : 'Say hello 👋'}</span></div></div></button>) : <div className="empty-inbox"><div className="empty-icon"><MessageCircle size={20} /></div><strong>No conversations yet</strong><span>Add a friend by username to start chatting.</span><button onClick={() => setShowAdd(true)}>Find a friend</button></div>}</div><div className="inbox-footer"><div className="footer-profile"><Avatar user={me} /><div><strong>@{me.username}</strong><span>You're all caught up</span></div></div><button className="icon-button" title="Sign out" onClick={logout}><LogOut size={16} /></button></div></section>
    <section className={`chat-panel ${mobileChat ? 'chat-visible' : ''}`}><header className="chat-header">{active ? <><div className="mobile-back"><button className="icon-button" onClick={() => setMobileChat(false)}><ArrowLeft size={19} /></button></div><div className="header-person"><Avatar user={activeUser} /><div className="header-person-copy"><strong>@{activeUser?.username}</strong><span>One-to-one conversation</span></div></div></> : <div className="header-person"><div className="avatar blank-avatar"><MessageCircle size={17} /></div><div className="header-person-copy"><strong>Your messages</strong><span>Choose a conversation to begin</span></div></div>}</header>{active ? <><div className="thread-scroll"><div className="thread-inner"><div className="profile-intro"><Avatar user={activeUser} large /><h2>@{activeUser?.username}</h2><p>Your private conversation</p></div><div className="day-divider"><span />Messages<span /></div><div className="messages">{messages.map(message => <div key={message.id} className={`message-row ${message.sender === me.id ? 'message-mine' : ''}`}>{message.sender !== me.id && <Avatar user={activeUser} />}<div className="message-content"><div className={`bubble ${message.sender === me.id ? 'bubble-mine' : ''}`}>{message.body}</div><div className="message-meta">{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}{message.sender === me.id && <Check size={14} className="seen-icon" />}</div></div></div>)}<div ref={bottomRef} /></div></div></div><div className="composer-area"><div className="composer"><form onSubmit={sendMessage}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Message @${activeUser?.username}`} maxLength={5000} /><div className="compose-tools"><button className={`send-button ${draft.trim() ? 'send-ready' : ''}`} type="submit" aria-label="Send message"><Send size={16} /></button></div></form></div><div className="composer-hint"><span>Messages send in real time</span><span>{draft.length}/5000</span></div></div></> : <div className="welcome-chat"><div className="welcome-mark"><MessageCircle size={28} /></div><h2>A little more connected.</h2><p>Pick a conversation or add a friend to say hello.</p><button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={16} /> Find a friend</button></div>}</section>
    {error && <div className="toast-error" role="alert">{error}<button onClick={() => setError('')}><X size={14} /></button></div>}
    {showAdd && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowAdd(false) }}><section className="add-modal"><header><div><p className="eyebrow">GROW YOUR CIRCLE</p><h2>Find a friend</h2></div><button className="icon-button" onClick={() => { setShowAdd(false); setSearch(''); setUsers([]) }}><X size={18} /></button></header><p className="modal-copy">Search their exact username to start a private chat.</p><div className="search-wrap"><Search size={17} /><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search usernames…" /></div><div className="user-results">{users.length ? users.map(user => <button key={user.id} className="user-result" onClick={() => addFriend(user)}><Avatar user={user} /><span><strong>@{user.username}</strong><small>Convo member</small></span><span className="add-user"><Plus size={17} /></span></button>) : <div className="search-empty">{search.length < 2 ? 'Type at least 2 characters to search.' : 'No users found. Check the username and try again.'}</div>}</div></section></div>}
  </main>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
