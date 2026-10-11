import { useState } from 'react'
import { Send } from 'lucide-react'

export default function MessageComposer({ recipient, onSend }) {
  const [draft, setDraft] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const body = draft.trim()
    if (body && onSend(body)) setDraft('')
  }

  return (
    <div className="composer-area">
      <div className="composer">
        <form onSubmit={handleSubmit}>
          <input value={draft} onChange={event => setDraft(event.target.value)}
            placeholder={`Message @${recipient?.username}`} maxLength={5000} />
          <div className="compose-tools">
            <button className={`send-button ${draft.trim() ? 'send-ready' : ''}`}
              type="submit" aria-label="Send message">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
      <div className="composer-hint">
        <span>Messages send in real time</span>
        <span>{draft.length}/5000</span>
      </div>
    </div>
  )
}
