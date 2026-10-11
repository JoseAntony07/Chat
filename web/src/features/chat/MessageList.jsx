import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import Avatar from '../../components/Avatar'

export default function MessageList({ messages, currentUserId, otherUser }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="thread-scroll">
      <div className="thread-inner">
        <div className="profile-intro">
          <Avatar user={otherUser} large />
          <h2>@{otherUser?.username}</h2>
          <p>Your private conversation</p>
        </div>
        <div className="day-divider"><span />Messages<span /></div>
        <div className="messages">
          {messages.map(message => {
            const isMine = message.sender === currentUserId
            return (
              <div key={message.id} className={`message-row ${isMine ? 'message-mine' : ''}`}>
                {!isMine && <Avatar user={otherUser} />}
                <div className="message-content">
                  <div className={`bubble ${isMine ? 'bubble-mine' : ''}`}>{message.body}</div>
                  <div className="message-meta">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {isMine && <Check size={14} className="seen-icon" />}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
