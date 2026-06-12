import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { HttpAgent, randomUUID } from '@ag-ui/client'
import { useTranslation } from 'react-i18next'
import { AG_UI_URL } from '@/shared/api/ragApi'
import { cloneMessages, getMessageText } from '../lib/chatMessages'

const LESSON_CONTENT_MAX_CHARS = Number(import.meta.env.VITE_LESSON_CONTENT_MAX_CHARS) || 48000

const isAbortError = (err) => {
  const errStr = String(err?.message || err || '')
  return (
    err?.name === 'AbortError' ||
    errStr.toLowerCase().includes('abort') ||
    errStr.includes('signal is aborted')
  )
}

export function useAguiChat({ lessonId, courseId, lessonTitle, courseTitle, lessonContent }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('idle')
  const [error, setError] = useState(null)
  const messagesRef = useRef(messages)
  const threadId = `lesson-${String(lessonId ?? '')}-${String(courseId ?? '')}`

  const agent = useMemo(
    () => (AG_UI_URL ? new HttpAgent({ url: AG_UI_URL, threadId }) : null),
    [threadId]
  )

  const lessonState = useMemo(() => {
    const raw = typeof lessonContent === 'string' ? lessonContent : ''
    const trimmed = raw.length > LESSON_CONTENT_MAX_CHARS
      ? `${raw.slice(0, LESSON_CONTENT_MAX_CHARS)}\n\n[…текст обрезан для чата]`
      : raw
    return {
      lesson_id: lessonId ? String(lessonId) : null,
      course_id: courseId ? String(courseId) : null,
      lesson_title: lessonTitle || '',
      course_title: courseTitle || '',
      collection_name: courseId ? `course_${courseId}` : 'default',
      lesson_content: trimmed,
    }
  }, [lessonId, courseId, lessonTitle, courseTitle, lessonContent])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const streamSubscriber = useMemo(
    () => ({
      onMessagesChanged: ({ messages: agentMessages }) => {
        const cloned = cloneMessages(agentMessages)
        messagesRef.current = cloned
        setMessages(cloned)
        const hasAssistantText = cloned.some(
          m => m.role === 'assistant' && getMessageText(m).trim().length > 0
        )
        setLoadingPhase(hasAssistantText ? 'streaming' : 'thinking')
      },
    }),
    []
  )

  const runAgent = async (nextMessages, { syncOnAbort }) => {
    setLoading(true)
    setLoadingPhase('thinking')
    const runId = randomUUID()
    try {
      agent.setMessages(nextMessages)
      agent.setState(lessonState)
      await agent.runAgent({ runId }, streamSubscriber)
      const final = cloneMessages(agent.messages)
      messagesRef.current = final
      setMessages(final)
    } catch (err) {
      if (isAbortError(err)) {
        if (syncOnAbort) {
          const final = cloneMessages(agent.messages)
          messagesRef.current = final
          setMessages(final)
        }
      } else {
        setError(t('lessonChat.aguiError', { error: String(err?.message || err || ''), url: AG_UI_URL }))
      }
    } finally {
      setLoading(false)
      setLoadingPhase('idle')
    }
  }

  const sendMessage = async (textOverride) => {
    const raw = typeof textOverride === 'string' ? textOverride : input.trim()
    if (!raw || loading || !agent) return
    setInput('')
    setError(null)
    const userMsg = { id: randomUUID(), role: 'user', content: raw.trim() }
    const nextMessages = [...messagesRef.current, userMsg]
    setMessages(nextMessages)
    messagesRef.current = nextMessages
    await runAgent(nextMessages, { syncOnAbort: true })
  }

  const retry = async () => {
    if (!agent || loading) return
    setError(null)
    await runAgent(messagesRef.current, { syncOnAbort: false })
  }

  const stop = () => {
    try {
      agent?.abortRun()
    } catch {}
  }

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
    setInput('')
    setLoadingPhase('idle')
    messagesRef.current = []
    try {
      agent?.setMessages([])
    } catch {}
  }, [agent])

  return {
    messages,
    input,
    setInput,
    loading,
    loadingPhase,
    error,
    sendMessage,
    retry,
    stop,
    clear
  }
}
