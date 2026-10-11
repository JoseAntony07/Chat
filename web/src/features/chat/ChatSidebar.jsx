import { useState } from 'react'
import { LogOut, MessageCircle, Plus, Search, Users } from 'lucide-react'
import Avatar from '../../components/Avatar'

export default function ChatSidebar({
  currentUser,
  conversations,
  activeConversation,
  mobileChat,
  onOpenConversation,
  onFindFriend,
  onLogout,
}) {
  const [query, setQuery] = useState('')
  const visibleConversations = conversations.filter(conversation =>
    (conversation.other_user?.username || '').toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <>
      <aside className="rail">
        <div className="brand-mark"><MessageCircle size={21} /></div>
        <div className="rail-nav">
          <button className="rail-button selected" title="Messages"><MessageCircle size={19} /></button>
          <button className="rail-button" onClick={onFindFriend} title="Find people"><Users size={19} /></button>
        </div>
        <div className="rail-bottom">
          <div className="my-avatar"><Avatar user={currentUser} /></div>
          <button className="rail-button" title="Sign out" onClick={onLogout}><LogOut size={18} /></button>
        </div>
      </aside>

      <section className={`inbox ${mobileChat ? 'inbox-hidden' : ''}`}>
        <header className="inbox-header">
          <div>
            <p className="eyebrow">SIGNED IN AS @{currentUser.username}</p>
            <h1>Messages</h1>
          </div>
          <button className="icon-button new-message" aria-label="Add a friend" onClick={onFindFriend}>
            <Plus size={19} />
          </button>
        </header>
        <div className="search-wrap">
          <Search size={17} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search conversations" />
        </div>
        <div className="filter-tabs">
          <button className="active">All <span>{conversations.length}</span></button>
          <button onClick={onFindFriend}>Find people</button>
        </div>

        <div className="conversation-list">
          {visibleConversations.length ? visibleConversations.map(conversation => (
            <button key={conversation.id}
              className={`conversation ${activeConversation?.id === conversation.id ? 'conversation-active' : ''}`}
              onClick={() => onOpenConversation(conversation)}>
              <div className="conversation-avatar"><Avatar user={conversation.other_user} /></div>
              <div className="conversation-copy">
                <div className="conversation-top">
                  <span className="person-name">@{conversation.other_user?.username}</span>
                  <time>{conversation.last_message
                    ? new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                    : ''}</time>
                </div>
                <div className="conversation-bottom">
                  <span className="preview">{conversation.last_message
                    ? `${conversation.last_message.sender === currentUser.id ? 'You: ' : ''}${conversation.last_message.body}`
                    : 'Say hello 👋'}</span>
                </div>
              </div>
            </button>
          )) : (
            <div className="empty-inbox">
              <div className="empty-icon"><MessageCircle size={20} /></div>
              <strong>{query ? 'No matching conversations' : 'No conversations yet'}</strong>
              <span>{query ? 'Try another username.' : 'Add a friend by username to start chatting.'}</span>
              <button onClick={onFindFriend}>Find a friend</button>
            </div>
          )}
        </div>

        <div className="inbox-footer">
          <div className="footer-profile">
            <Avatar user={currentUser} />
            <div><strong>@{currentUser.username}</strong><span>You're all caught up</span></div>
          </div>
          <button className="icon-button" title="Sign out" onClick={onLogout}><LogOut size={16} /></button>
        </div>
      </section>
    </>
  )
}
