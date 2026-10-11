import { useEffect, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import Avatar from '../../components/Avatar'
import { searchUsers } from './chatApi'

export default function FriendSearchModal({ token, onClose, onChooseUser }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const cleanQuery = query.trim()
    if (!token || cleanQuery.length < 2) {
      setUsers([])
      setError('')
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      searchUsers(cleanQuery, token)
        .then(results => { if (!cancelled) { setUsers(results); setError('') } })
        .catch(requestError => { if (!cancelled) setError(requestError.message) })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, token])

  return (
    <div className="modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="add-modal">
        <header>
          <div><p className="eyebrow">GROW YOUR CIRCLE</p><h2>Find a friend</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <p className="modal-copy">Search their exact username to start a private chat.</p>
        <div className="search-wrap">
          <Search size={17} />
          <input autoFocus value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Search usernames…" />
        </div>
        <div className="user-results">
          {users.length ? users.map(user => (
            <button key={user.id} className="user-result" onClick={() => onChooseUser(user)}>
              <Avatar user={user} />
              <span><strong>@{user.username}</strong><small>Convo member</small></span>
              <span className="add-user"><Plus size={17} /></span>
            </button>
          )) : (
            <div className="search-empty">
              {error || (query.trim().length < 2
                ? 'Type at least 2 characters to search.'
                : 'No users found. Check the username and try again.')}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
