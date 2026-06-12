import { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { ragPost } from '@/shared/api/ragApi'

const isCanceled = (err) =>
  axios.isCancel?.(err) ||
  err.code === 'ERR_CANCELED' ||
  err.name === 'CanceledError' ||
  err.name === 'AbortError'

export function useSimpleChat({ lessonId, courseId }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingQuestion, setPendingQuestion] = useState(null)
  const abortRef = useRef(null)

  const collectionName = courseId ? `course_${courseId}` : 'default'
  const metadataFilter = {}
  if (lessonId) metadataFilter.lesson_id = String(lessonId)
  if (courseId) metadataFilter.course_id = String(courseId)

  const runAsk = async (userMsg) => {
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const r = await ragPost(
        'ask',
        {
          question: userMsg,
          collection_name: collectionName,
          top_k: 8,
          metadata_filter: Object.keys(metadataFilter).length ? metadataFilter : undefined,
        },
        { timeout: 60000, signal: controller.signal }
      )
      setMessages(prev => [...prev, { role: 'assistant', content: r.data?.answer ?? t('lessonChat.noAnswer') }])
      setPendingQuestion(null)
    } catch (err) {
      if (isCanceled(err)) {
        return
      }
      const status = err.response?.status
      const detail = err.response?.data?.detail || err.message || t('ragPage.genericError')
      let msg = `${t('ragPage.genericError')}: ${detail}`
      if (status === 502) {
        msg = t('lessonChat.ragGenerationError')
        if (typeof detail === 'string' && detail.length) msg += ` ${detail}`
      } else if (status === 503) {
        msg = t('lessonChat.ragUnavailable')
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        msg = t('lessonChat.ragConnectError')
      } else if (status === 404) {
        msg = t('lessonChat.ragRouteNotFound')
      }
      setError(msg)
      setPendingQuestion(userMsg)
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }

  const sendMessage = async (textOverride) => {
    const raw = typeof textOverride === 'string' ? textOverride : input.trim()
    if (!raw || loading) return
    const userMsg = raw.trim()
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    await runAsk(userMsg)
  }

  const retry = () => {
    if (!pendingQuestion || loading) return
    setError(null)
    runAsk(pendingQuestion)
  }

  const stop = () => {
    try {
      abortRef.current?.abort()
    } catch {}
  }

  const clear = useCallback(() => {
    setMessages([])
    setInput('')
    setError(null)
    setPendingQuestion(null)
    try {
      abortRef.current?.abort()
    } catch {}
  }, [])

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    retry,
    stop,
    clear
  }
}
