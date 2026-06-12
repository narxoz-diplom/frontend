import React, {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { FiMessageCircle, FiSend, FiSquare, FiRefreshCw } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import { useSimpleChat } from '../hooks/useSimpleChat'

const SimpleLessonChat = forwardRef(function SimpleLessonChat(
  { lessonId, courseId, panelOpen },
  ref
) {
  const { t } = useTranslation()
  const {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    retry,
    stop,
    clear
  } = useSimpleChat({ lessonId, courseId })
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      clear,
      scrollToBottom: () => scrollToBottom(true),
      focusInput: () => textareaRef.current?.focus(),
    }),
    [clear, scrollToBottom]
  )

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  useEffect(() => {
    if (!panelOpen) return
    const id = requestAnimationFrame(() => textareaRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [panelOpen])

  useEffect(() => {
    scrollToBottom(true)
  }, [messages, loading, error, scrollToBottom])

  const suggestedChips = useMemo(
    () => [
      t('lessonChat.chipExplain'),
      t('lessonChat.chipSummary'),
      t('lessonChat.chipQuiz'),
      t('lessonChat.chipTerms'),
    ],
    [t]
  )

  return (
    <div className="lesson-chat simple-chat">
      <div className="lesson-chat-messages">
        {messages.length === 0 && (
          <div className="lesson-chat-empty">
            <FiMessageCircle />
            <p>{t('lessonChat.askMaterial')}</p>
            <div className="lesson-chat-suggestions" role="group" aria-label={t('lessonChat.suggestedPrompts')}>
              {suggestedChips.map((label, idx) => (
                <button
                  key={`chip-${idx}`}
                  type="button"
                  className="lesson-chat-chip"
                  disabled={loading}
                  onClick={() => requestAnimationFrame(() => sendMessage(label))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`lesson-chat-msg ${m.role}${m.role === 'assistant' ? ' lesson-chat-msg-md' : ''}`}>
            {m.role === 'assistant' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            ) : (
              m.content
            )}
          </div>
        ))}
        {loading && (
          <div className="lesson-chat-status" aria-live="polite">
            <span className="lesson-chat-status-label">{t('lessonChat.thinking')}</span>
            <div className="lesson-chat-msg assistant typing" aria-hidden>
              <span className="lesson-chat-typing-dot" />
              <span className="lesson-chat-typing-dot" />
              <span className="lesson-chat-typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="lesson-chat-messages-anchor" />
      </div>
      {error && (
        <div className="lesson-chat-error lesson-chat-error--with-action">
          <span>{error}</span>
          <button type="button" className="lesson-chat-retry-btn" onClick={retry} disabled={loading}>
            <FiRefreshCw aria-hidden />
            {t('lessonChat.retry')}
          </button>
        </div>
      )}
      <div className="lesson-chat-input-shell">
        <div className="lesson-chat-input-meta">
          <span className="lesson-chat-char-count">{input.length}/4000</span>
        </div>
        <div className="lesson-chat-input-wrap">
          <textarea
            ref={textareaRef}
            className="lesson-chat-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={t('lessonChat.messagePlaceholder')}
            disabled={loading}
            rows={1}
            maxLength={4000}
          />
          {loading ? (
            <button
              type="button"
              className="lesson-chat-stop"
              onClick={stop}
              title={t('lessonChat.stop')}
              aria-label={t('lessonChat.stop')}
            >
              <FiSquare />
            </button>
          ) : (
            <button type="button" className="lesson-chat-send" onClick={() => sendMessage()} disabled={loading} title={t('lessonChat.send')}>
              <FiSend />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
SimpleLessonChat.displayName = 'SimpleLessonChat'

export default SimpleLessonChat
