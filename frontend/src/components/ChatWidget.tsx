import { useMemo, useRef, useState } from 'react'
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useAuiState,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
} from '@assistant-ui/react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import { createAdapter, submitFeedback } from '../lib/adapter'

const MarkdownText = (props: { text: string }) => <MarkdownTextPrimitive {...(props as object)} />

const SUGGESTIONS = ['Wanderwege', 'Tierbeobachtungen', 'Hütten & Unterkünfte', 'Anreise']
const DEFAULT_W = 580
const DEFAULT_H = 820


// ── Message sub-components ────────────────────────────────────────────────────

const MessageTimestamp = () => {
  const createdAt = useAuiState((s) => s.message.createdAt)
  return (
    <span className="chat-message-time">
      {createdAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}


const UserMessage = () => (
  <MessagePrimitive.Root className="chat-message chat-message-user">
    <div className="chat-message-body">
      <div className="chat-bubble chat-bubble-user">
        <MessagePrimitive.Content />
      </div>
      <div className="chat-message-meta chat-message-meta-user">
        <MessageTimestamp />
      </div>
    </div>
  </MessagePrimitive.Root>
)

const AssistantMessage = () => {
  const messageId = useAuiState((s) => s.message.id)
  const status = useAuiState((s) => s.message.status)
  const isError = status?.type === 'incomplete' && status.reason === 'error'
  const isRunning = status?.type === 'running'
  const hasContent = useAuiState((s) =>
    s.message.content.some((c) => c.type === 'text' && (c as { type: 'text'; text: string }).text.length > 0)
  )
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  const handleFeedback = (rating: 'up' | 'down') => {
    if (voted) return
    setVoted(rating)
    submitFeedback(messageId, rating)
  }

  return (
    <MessagePrimitive.Root className="chat-message chat-message-assistant">
      <img src="/assets/forrest.gif" className="chat-message-avatar" alt="Forrest" />
      <div className="chat-message-body">
        <div className={`chat-bubble ${isError ? 'chat-bubble-error' : 'chat-bubble-assistant'}`}>
          {isRunning && !hasContent
            ? <span className="chat-typing"><span /><span /><span /></span>
            : <>
                <MessagePrimitive.Content components={{ Text: MarkdownText }} />
                {isError
                  ? <code className="chat-error-code">Antwort fehlgeschlagen – bitte erneut versuchen.</code>
                  : null}
              </>
          }
        </div>
        <div className="chat-message-meta">
          <MessageTimestamp />
          <ActionBarPrimitive.Root
            className="chat-reactions"
            hideWhenRunning
            autohide="not-last"
          >
            <ActionBarPrimitive.FeedbackPositive asChild>
              <button
                className="chat-reaction-btn"
                title="Hilfreich"
                aria-label="Hilfreich"
                onClick={() => handleFeedback('up')}
                disabled={voted !== null && voted !== 'up'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </button>
            </ActionBarPrimitive.FeedbackPositive>
            <ActionBarPrimitive.FeedbackNegative asChild>
              <button
                className="chat-reaction-btn"
                title="Nicht hilfreich"
                aria-label="Nicht hilfreich"
                onClick={() => handleFeedback('down')}
                disabled={voted !== null && voted !== 'down'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"/>
                  <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
              </button>
            </ActionBarPrimitive.FeedbackNegative>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}

// ── Welcome screen ────────────────────────────────────────────────────────────

const WelcomeScreen = () => (
  <div className="chat-empty-state">
    <div className="chat-welcome">
      <img src="/assets/forrest.gif" className="chat-welcome-img" alt="Forrest" />
      <div className="chat-welcome-bubble">
        Grüß Gott! Ich bin <strong>Forrest</strong>, der digitale Assistent des Nationalparks Hohe Tauern.{' '}
        Wie kann ich Ihnen helfen?
        <span className="chat-welcome-en"><em>Tip: Feel free to chat in English too.</em> 🇬🇧</span>
      </div>
    </div>
    <div className="chat-suggestions">
      {SUGGESTIONS.map(s => (
        <ThreadPrimitive.Suggestion key={s} prompt={s} send asChild>
          <button className="chat-suggestion">{s}</button>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  </div>
)

// ── Panel (has runtime + full UI) ─────────────────────────────────────────────

interface PanelProps {
  onClose: () => void
  conversationId: string | null
  onConversationId: (id: string) => void
  copied: boolean
  onCopyId: () => void
  size: { w: number; h: number }
  onSetSize: (s: { w: number; h: number }) => void
  onReset: () => void
}

function ChatPanel({ onClose, conversationId, onConversationId, copied, onCopyId, size, onSetSize, onReset }: PanelProps) {
  const onConversationIdRef = useRef(onConversationId)
  onConversationIdRef.current = onConversationId
  const adapter = useMemo(() => createAdapter((id) => onConversationIdRef.current(id)), [])
  const runtime = useLocalRuntime(adapter)

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const startW = size.w, startH = size.h

    const onMouseMove = (ev: MouseEvent) => {
      const maxW = Math.floor(window.innerWidth / 2)
      const maxH = window.innerHeight - 48
      onSetSize({
        w: Math.max(320, Math.min(maxW, startW + (startX - ev.clientX))),
        h: Math.max(400, Math.min(maxH, startH + (startY - ev.clientY))),
      })
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="chat-panel" style={{ width: size.w, height: size.h }}>
        <div className="chat-resize-handle" onMouseDown={handleResizeMouseDown} aria-hidden="true" />

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-brand">
            <div className="chat-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div className="chat-header-text">
              <span className="chat-title">FragForrest</span>
              <span className="chat-subtitle">Nationalpark Hohe Tauern · Österreich</span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="chat-action-btn" disabled title="Sprache wechseln (demnächst)" aria-label="Sprache wechseln">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </button>
            <button className="chat-action-btn" onClick={onClose} title="Schließen" aria-label="Schließen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Thread */}
        <ThreadPrimitive.Root className="chat-thread-root">
          <ThreadPrimitive.Viewport className="chat-messages">
              <WelcomeScreen />
            <ThreadPrimitive.Messages
              components={{ UserMessage, AssistantMessage }}
            />
          </ThreadPrimitive.Viewport>

          {/* Input */}
          <ComposerPrimitive.Root className="chat-input-area">
              <button className="chat-mic-btn" disabled title="Spracheingabe (demnächst)" aria-label="Spracheingabe">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                </svg>
              </button>
              <ComposerPrimitive.Input
                className="chat-input"
                placeholder="Frage zum Nationalpark eingeben ..."
                autoFocus
                rows={1}
              />
              <ComposerPrimitive.Send className="chat-send-btn" aria-label="Senden">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
                </svg>
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>

        {/* Footer */}
        <div className="chat-footer">
          <button className="chat-footer-new" onClick={onReset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" />
            </svg>
            Neuer Chat
          </button>
          {conversationId && (
            <span className="chat-footer-id" onClick={onCopyId} title="Kopieren">
              ID: {conversationId}{copied ? ' ✓' : ''}
            </span>
          )}
        </div>
      </div>
    </AssistantRuntimeProvider>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export default function ChatWidget({ open, onOpen, onClose }: Props) {
  const [chatKey, setChatKey] = useState(0)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [copied, setCopied] = useState(false)

  const handleReset = () => { setChatKey(k => k + 1); setConversationId(null) }
  const handleCopyId = () => {
    if (!conversationId) return
    navigator.clipboard.writeText(conversationId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!open) {
    return (
      <button className="chat-fab" onClick={onOpen} aria-label="Chat öffnen" title="Chat öffnen">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    )
  }

  return (
    <ChatPanel
      key={chatKey}
      onClose={onClose}
      conversationId={conversationId}
      onConversationId={setConversationId}
      copied={copied}
      onCopyId={handleCopyId}
      size={size}
      onSetSize={setSize}
      onReset={handleReset}
    />
  )
}
