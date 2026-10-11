import { ArrowLeft, MessageCircle, Plus } from 'lucide-react'
import Avatar from '../../components/Avatar'
import MessageComposer from './MessageComposer'
import MessageList from './MessageList'

export default function ConversationView({
  conversation,
  messages,
  currentUserId,
  onSend,
  onFindFriend,
  onBack,
}) {
  const otherUser = conversation?.other_user

  return (
    <section className={`chat-panel ${conversation ? 'chat-visible' : ''}`}>
      <header className="chat-header">
        {conversation ? (
          <>
            <div className="mobile-back">
              <button className="icon-button" onClick={onBack} aria-label="Back to conversations">
                <ArrowLeft size={19} />
              </button>
            </div>
            <div className="header-person">
              <Avatar user={otherUser} />
              <div className="header-person-copy">
                <strong>@{otherUser?.username}</strong>
                <span>One-to-one conversation</span>
              </div>
            </div>
          </>
        ) : (
          <div className="header-person">
            <div className="avatar blank-avatar"><MessageCircle size={17} /></div>
            <div className="header-person-copy">
              <strong>Your messages</strong>
              <span>Choose a conversation to begin</span>
            </div>
          </div>
        )}
      </header>

      {conversation ? (
        <>
          <MessageList messages={messages} currentUserId={currentUserId} otherUser={otherUser} />
          <MessageComposer recipient={otherUser} onSend={onSend} />
        </>
      ) : (
        <div className="welcome-chat">
          <div className="welcome-mark"><MessageCircle size={28} /></div>
          <h2>A little more connected.</h2>
          <p>Pick a conversation or add a friend to say hello.</p>
          <button className="primary-button" onClick={onFindFriend}>
            <Plus size={16} /> Find a friend
          </button>
        </div>
      )}
    </section>
  )
}
