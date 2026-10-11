import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import ChatSidebar from './ChatSidebar'
import ConversationView from './ConversationView'
import FriendSearchModal from './FriendSearchModal'
import useChatSocket from './useChatSocket'
import {
  getOrCreateConversation,
  listConversations,
  listMessages,
} from './chatApi'

export default function ChatPage({ token, currentUser, onLogout }) {
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [showFriendSearch, setShowFriendSearch] = useState(false)
  const [mobileChat, setMobileChat] = useState(false)
  const [error, setError] = useState('')

  const refreshConversations = useCallback(async () => {
    const result = await listConversations(token)
    setConversations(result)
    return result
  }, [token])

  useEffect(() => {
    refreshConversations().catch(requestError => setError(requestError.message))
  }, [refreshConversations])

  const handleIncomingMessage = useCallback(message => {
    setMessages(previous => previous.some(item => item.id === message.id)
      ? previous
      : [...previous, message])
    refreshConversations().catch(() => {})
  }, [refreshConversations])

  const { sendMessage, connectionError } = useChatSocket({
    conversationId: activeConversation?.id,
    token,
    onMessage: handleIncomingMessage,
  })

  useEffect(() => {
    if (connectionError) setError(connectionError)
    else if (error.startsWith('Chat connection')) setError('')
  }, [connectionError])

  async function openConversation(conversation) {
    setActiveConversation(conversation)
    setMessages([])
    setError('')
    setMobileChat(true)

    try {
      setMessages(await listMessages(conversation.id, token))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function addFriend(user) {
    setError('')
    try {
      const createdConversation = await getOrCreateConversation(user.username, token)
      const latestConversations = await refreshConversations()
      const conversation = latestConversations.find(item => item.id === createdConversation.id)
        || createdConversation
      setShowFriendSearch(false)
      await openConversation(conversation)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function handleSendMessage(body) {
    const sent = sendMessage(body)
    if (!sent) {
      setError('Connecting to chat… try sending again in a moment.')
      return false
    }
    setError('')
    return true
  }

  return (
    <main className="app-shell">
      <ChatSidebar
        currentUser={currentUser}
        conversations={conversations}
        activeConversation={activeConversation}
        mobileChat={mobileChat}
        onOpenConversation={openConversation}
        onFindFriend={() => setShowFriendSearch(true)}
        onLogout={onLogout}
      />
      <ConversationView
        conversation={activeConversation}
        messages={messages}
        currentUserId={currentUser.id}
        onSend={handleSendMessage}
        onFindFriend={() => setShowFriendSearch(true)}
        onBack={() => setMobileChat(false)}
      />

      {error && (
        <div className="toast-error" role="alert">
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss error"><X size={14} /></button>
        </div>
      )}
      {showFriendSearch && (
        <FriendSearchModal
          token={token}
          onClose={() => setShowFriendSearch(false)}
          onChooseUser={addFriend}
        />
      )}
    </main>
  )
}
