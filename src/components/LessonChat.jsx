/**
 * LessonChat — чат в контексте урока с AG-UI (Google ADK).
 * Интегрирован с RAG: вопросы по уроку, генерация тестов с тематическим оформлением.
 * По умолчанию чат идет через gateway на встроенный AG-UI endpoint внутри RAG service.
 */
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { FiMessageCircle, FiSend, FiX, FiTrash2, FiChevronDown } from 'react-icons/fi'
import { HttpAgent, randomUUID } from '@ag-ui/client'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import './LessonChat.css'

/** Убирает подряд идущие почти одинаковые блоки (частый артефакт LLM в резюме). */
function dedupeSummaryBlocks(text) {
  const raw = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
  if (raw.length <= 1) return text
  const norm = s => s.replace(/\s+/g, ' ').toLowerCase()
  const kept = []
  for (const block of raw) {
    const n = norm(block)
    if (n.length < 12) {
      kept.push(block)
      continue
    }
    const dup = kept.some(prev => {
      const p = norm(prev)
      if (n === p) return true
      const a = n.length >= p.length ? n : p
      const b = n.length >= p.length ? p : n
      if (b.length < 40) return false
      return a.includes(b.slice(0, Math.min(120, b.length)))
    })
    if (!dup) kept.push(block)
  }
  return kept.join('\n\n')
}

const RAG_DIRECT_URL = String(import.meta.env.VITE_RAG_URL || '').trim()
/** Prefer `/api/ag-ui` in dev: same origin as Vite, proxy to gateway — avoids browser CORS on SSE. */
const AG_UI_URL = String(import.meta.env.VITE_AG_UI_URL || '/api/ag-ui').trim().replace(/\/$/, '')

/** Совпадает с AG-UI лимитом на стороне RAG service (по умолчанию 48000) */
const LESSON_CONTENT_MAX_CHARS = Number(import.meta.env.VITE_LESSON_CONTENT_MAX_CHARS) || 48000

const PANEL_WIDTH_STORAGE_KEY = 'lesson-chat-panel-width'
const PANEL_MIN_WIDTH = 300
const PANEL_DEFAULT_WIDTH = 420

function clampPanelWidth(w) {
  if (typeof window === 'undefined') return w
  const max = Math.max(PANEL_MIN_WIDTH, Math.floor(window.innerWidth * 0.92))
  return Math.min(max, Math.max(PANEL_MIN_WIDTH, Math.round(w)))
}

function ragPost(gatewayPath, body) {
  if (RAG_DIRECT_URL) {
    const base = RAG_DIRECT_URL.replace(/\/$/, '')
    const path = gatewayPath.startsWith('/') ? gatewayPath.slice(1) : gatewayPath
    return axios.post(`${base}/api/v1/${path}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    })
  }
  return api.post('/rag/' + gatewayPath.replace(/^\//, ''), body)
}

/** Рендер одного сообщения или результата инструмента в чате AG-UI */
function renderAGUIMessage(msg) {
  if (msg.role === 'tool' && typeof msg.content === 'string') {
    let result
    try {
      result = JSON.parse(msg.content)
    } catch {
      return null
    }
    if (result?.questions?.length) {
      return (
        <div key={msg.id} className="lesson-chat ag-ui-inline-quiz">
          <QuizGenerativeUI result={result} theme={result?.theme || { primary: '#b83848', accent: '#dc8a95' }} />
        </div>
      )
    }
    if (result?.summary != null) {
      if (result?.ui_type === 'analytics') {
        return (
          <div key={msg.id} className="lesson-chat ag-ui-inline-gen">
            <AnalyticsGenerativeUI result={result} theme={result?.theme || { primary: '#b83848', accent: '#dc8a95' }} />
          </div>
        )
      }
      return (
        <div key={msg.id} className="lesson-chat ag-ui-inline-gen">
          <SummaryGenerativeUI result={result} theme={result?.theme || { primary: '#b83848', accent: '#dc8a95' }} />
        </div>
      )
    }
    return null
  }
  const text = msg.content ?? (Array.isArray(msg.content) ? msg.content.map(c => c?.text ?? c).join('') : '')
  if (!text && msg.role !== 'user') return null
  return (
    <div key={msg.id} className={`lesson-chat-msg ${msg.role}`}>
      {text}
    </div>
  )
}

/**
 * Чат через AG-UI endpoint по протоколу AG-UI (HttpAgent).
 * По умолчанию запросы идут в gateway на `/api/ag-ui`, который проксирует их в RAG service.
 */
const AGUIChat = forwardRef(function AGUIChat(
  { lessonId, courseId, lessonTitle, courseTitle, lessonContent },
  ref
) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const threadId = `lesson-${String(lessonId ?? '')}-${String(courseId ?? '')}`
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  const agent = useMemo(
    () => (AG_UI_URL ? new HttpAgent({ url: AG_UI_URL, threadId }) : null),
    [AG_UI_URL, threadId]
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

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        setMessages([])
        setError(null)
        setInput('')
        try {
          agent?.setMessages([])
        } catch {
          /* ignore */
        }
      },
      scrollToBottom: () => scrollToBottom(true),
    }),
    [agent, scrollToBottom]
  )

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  useEffect(() => {
    scrollToBottom(true)
  }, [messages, loading, error, scrollToBottom])

  const sendMessage = async () => {
    if (!input.trim() || loading || !agent) return
    const userContent = input.trim()
    const runId = randomUUID()
    setInput('')
    setError(null)
    const userMsg = { id: randomUUID(), role: 'user', content: userContent }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)
    try {
      agent.setMessages(nextMessages)
      agent.setState(lessonState)
      const result = await agent.runAgent({ runId })
      if (result?.newMessages?.length) {
        setMessages(prev => [...prev, ...result.newMessages])
      }
    } catch (err) {
      const errMsg = err?.message || String(err)
      setError(errMsg)
      setMessages(prev => [
        ...prev,
        { id: randomUUID(), role: 'assistant', content: t('lessonChat.aguiError', { error: errMsg, url: AG_UI_URL }) },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!AG_UI_URL) return null

  return (
    <div className="lesson-chat ag-ui-chat direct-ag-ui">
      <div className="lesson-chat-messages">
        {messages.length === 0 && (
          <div className="lesson-chat-empty">
            <FiMessageCircle />
            <p>{t('lessonChat.askLesson')}</p>
          </div>
        )}
        {messages.map(renderAGUIMessage)}
        {loading && (
          <div className="lesson-chat-msg assistant typing" aria-hidden>
            <span className="lesson-chat-typing-dot" />
            <span className="lesson-chat-typing-dot" />
            <span className="lesson-chat-typing-dot" />
          </div>
        )}
        <div ref={messagesEndRef} className="lesson-chat-messages-anchor" />
      </div>
      {error && <div className="lesson-chat-error">{error}</div>}
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
          <button type="button" className="lesson-chat-send" onClick={sendMessage} disabled={loading} title={t('lessonChat.send')}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  )
})
AGUIChat.displayName = 'AGUIChat'

/**
 * Простой чат — прямые запросы к RAG (без AG-UI агента).
 */
const SimpleLessonChat = forwardRef(function SimpleLessonChat(
  { lessonId, courseId, lessonTitle: _lessonTitle, courseTitle: _courseTitle },
  ref
) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        setMessages([])
        setInput('')
      },
      scrollToBottom: () => scrollToBottom(true),
    }),
    [scrollToBottom]
  )

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  const collectionName = courseId ? `course_${courseId}` : 'default'
  const metadataFilter = {}
  if (lessonId) metadataFilter.lesson_id = String(lessonId)
  if (courseId) metadataFilter.course_id = String(courseId)

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const r = await ragPost('ask', {
        question: userMsg,
        collection_name: collectionName,
        top_k: 8,
        metadata_filter: Object.keys(metadataFilter).length ? metadataFilter : undefined,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: r.data?.answer ?? t('lessonChat.noAnswer') }])
    } catch (err) {
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
      setMessages(prev => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scrollToBottom(true)
  }, [messages, loading, scrollToBottom])

  return (
    <div className="lesson-chat simple-chat">
      <div className="lesson-chat-messages">
        {messages.length === 0 && (
          <div className="lesson-chat-empty">
            <FiMessageCircle />
            <p>{t('lessonChat.askMaterial')}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`lesson-chat-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="lesson-chat-msg assistant typing" aria-hidden>
            <span className="lesson-chat-typing-dot" />
            <span className="lesson-chat-typing-dot" />
            <span className="lesson-chat-typing-dot" />
          </div>
        )}
        <div ref={messagesEndRef} className="lesson-chat-messages-anchor" />
      </div>
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
          <button type="button" className="lesson-chat-send" onClick={sendMessage} disabled={loading} title={t('lessonChat.send')}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  )
})
SimpleLessonChat.displayName = 'SimpleLessonChat'

/**
 * Генеративный UI для резюме урока — карточка с темой по курсу.
 */
function SummaryGenerativeUI({ result, theme = {}, onClose }) {
  const { t } = useTranslation()
  const summary = dedupeSummaryBlocks(String(result?.summary || ''))
  const primary = theme.primary || '#b83848'
  const accent = theme.accent || '#dc8a95'
  if (!summary) return null
  return (
    <div className="ag-ui-summary-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-summary-header">
        <span className="ag-ui-summary-icon">📋</span>
        <div>
          <h3>{t('lessonChat.lessonSummary')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="ag-ui-card-close" onClick={onClose} aria-label={t('lessonChat.close')}>
            <FiX />
          </button>
        )}
      </div>
      <div className="ag-ui-summary-body ag-ui-summary-body--md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
      </div>
    </div>
  )
}

/**
 * Генеративный UI для аналитики — карточка с фактами/тезисами и темой по курсу.
 */
function AnalyticsGenerativeUI({ result, theme = {}, onClose }) {
  const { t } = useTranslation()
  const summary = result?.summary || ''
  const pie = result?.pie_chart || null
  const bar = result?.bar_chart || null
  const statCards = Array.isArray(result?.stat_cards) ? result.stat_cards : []
  const topList = result?.top_list || null
  const trend = result?.trend_line || null
  const insights = Array.isArray(result?.insights) ? result.insights.filter(Boolean) : []
  const primary = theme.primary || '#b83848'
  const accent = theme.accent || '#dc8a95'
  if (!summary && !pie && !bar && !insights.length && !statCards.length && !topList && !trend) return null

  const pieData = pie && Array.isArray(pie.items)
    ? pie.items.map(item => ({ name: item.label, value: Number(item.value) || 0 }))
    : []

  const barData = bar && Array.isArray(bar.items)
    ? bar.items.map(item => ({ name: item.label, value: Number(item.value) || 0 }))
    : []

  const trendData = trend && Array.isArray(trend.points)
    ? trend.points.map(p => ({ name: p.label, value: Number(p.value) || 0 }))
    : []

  const chartColors = ['#b83848', '#8f2d39', '#dc8a95', '#5c2030', '#c85a68', '#7a2430']

  return (
    <div className="ag-ui-analytics-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-analytics-header">
        <span className="ag-ui-analytics-icon">📊</span>
        <div>
          <h3>{t('lessonChat.lessonAnalytics')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="ag-ui-card-close" onClick={onClose} aria-label={t('lessonChat.close')}>
            <FiX />
          </button>
        )}
      </div>
      <div className="ag-ui-analytics-body">
        {summary && (
          <div className="ag-ui-analytics-section">
            <h4>{t('lessonChat.analyticsSummary')}</h4>
            {summary.split(/\n\n+/).map((p, i) => (
              <p key={i}>{p.trim()}</p>
            ))}
          </div>
        )}

        {statCards.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{t('lessonChat.keyMetrics')}</h4>
            <div className="ag-ui-analytics-stat-cards">
              {statCards.map((card, i) => (
                <div key={i} className="ag-ui-analytics-stat-card">
                  <div className="stat-card-label">{card.label}</div>
                  <div className="stat-card-value">
                    {card.value}
                    {card.unit ? <span className="stat-card-unit">{card.unit}</span> : null}
                  </div>
                  {card.description && <div className="stat-card-desc">{card.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {pie && Array.isArray(pie.items) && pie.items.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{pie.title || t('lessonChat.distribution')}</h4>
            <div className="ag-ui-analytics-chart ag-ui-analytics-pie">
              <div className="ag-ui-analytics-pie-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ag-ui-analytics-pie-legend">
                {pie.items.map((item, i) => (
                  <div key={i} className="ag-ui-analytics-item">
                    <div className="ag-ui-analytics-item-header">
                      <span className="ag-ui-analytics-label">{item.label}</span>
                      <span className="ag-ui-analytics-value">
                        {typeof item.value === 'number' ? `${item.value}%` : String(item.value)}
                      </span>
                    </div>
                    <div className="ag-ui-analytics-bar-wrapper">
                      <div
                        className="ag-ui-analytics-bar-fill"
                        style={{ width: `${Math.max(0, Math.min(100, Number(item.value) || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {bar && Array.isArray(bar.items) && bar.items.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{bar.title || 'Сравнение показателей (столбчатый график)'}</h4>
            <div className="ag-ui-analytics-meta">
              {(bar.x_axis || bar.y_axis) && (
                <span>
                  {bar.x_axis && <strong>Ось X:</strong>} {bar.x_axis || ''}
                  {bar.x_axis && bar.y_axis && ' · '}
                  {bar.y_axis && <><strong>Ось Y:</strong> {bar.y_axis}</>}
                </span>
              )}
            </div>
            <div className="ag-ui-analytics-chart ag-ui-analytics-bars">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {topList && Array.isArray(topList.items) && topList.items.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{topList.title || t('lessonChat.topItems')}</h4>
            <div className="ag-ui-analytics-top-list">
              {topList.items.map((item, i) => (
                <div key={i} className="ag-ui-analytics-top-item">
                  <span className="top-rank">{i + 1}</span>
                  <span className="top-label">{item.label}</span>
                  {item.value != null && (
                    <span className="top-value">
                      {item.value}
                      {item.unit ? item.unit : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {trend && trendData.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{trend.title || t('lessonChat.trend')}</h4>
            <div className="ag-ui-analytics-chart ag-ui-analytics-trend">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={primary} strokeWidth={2.3} dot={{ r: 3.2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {insights.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{t('lessonChat.insights')}</h4>
            <ul className="ag-ui-analytics-insights">
              {insights.map((line, i) => (
                <li key={i}>{String(line).replace(/^[\s•\-*]+\s*/, '').trim()}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Генеративный UI для теста — рендерит вопросы с тематическим оформлением.
 * key должен меняться при каждой новой генерации теста, чтобы сбросить состояние.
 */
function QuizGenerativeUI({ args, result, theme = {}, onClose }) {
  const { t: tt } = useTranslation()
  const questions = result?.questions || []
  const t = theme.primary || '#b83848'
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(null)
  const [hintsVisible, setHintsVisible] = useState({})

  const handleAnswer = (i, key) => {
    if (checked) return
    setAnswers(prev => ({ ...prev, [i]: key }))
  }

  const toggleHint = (i) => {
    setHintsVisible(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const handleFinish = () => {
    if (!questions.length) return
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++
    })
    setScore({ correct, total: questions.length, pct: Math.round((correct / questions.length) * 100) })
    setChecked(true)
  }

  if (result?.status === 'error') {
    return <div className="quiz-gen-error">{result.message || tt('ragPage.generationError')}</div>
  }

  if (!questions.length) return null

  return (
    <div className="quiz-generative-ui" style={{ '--theme-primary': t, '--theme-accent': theme.accent || '#dc8a95' }}>
      <div className="quiz-gen-header">
        <div className="quiz-gen-header-text">
          <h3>{tt('lessonChat.lessonQuiz')}</h3>
          {result?.lesson_title && <span>{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="quiz-gen-header-close" onClick={onClose} title={tt('lessonChat.hideQuiz')} aria-label={tt('lessonChat.hideQuiz')}>
            <FiX />
          </button>
        )}
      </div>
      {questions.map((q, i) => (
        <div key={i} className={`quiz-gen-item ${checked ? (answers[i] === q.correct ? 'correct' : 'incorrect') : ''}`}>
          <p className="quiz-gen-question">{i + 1}. {q.question}</p>
          {q.hint != null && q.hint !== '' && (
            <div className="quiz-gen-hint-block">
              {!hintsVisible[i] ? (
                <button type="button" className="quiz-gen-hint-btn" onClick={() => toggleHint(i)}>
                  {tt('lessonChat.showHint')}
                </button>
              ) : (
                <p className="quiz-gen-hint-text">{q.hint}</p>
              )}
            </div>
          )}
          <div className="quiz-gen-options">
            {['A', 'B', 'C', 'D'].filter(k => q.options?.[k]).map(k => (
              <label key={k}>
                <input
                  type="radio"
                  name={`q${i}`}
                  value={k}
                  checked={answers[i] === k}
                  onChange={() => handleAnswer(i, k)}
                  disabled={checked}
                />
                {q.options[k]}
              </label>
            ))}
          </div>
          {checked && (
            <div className="quiz-gen-feedback">
              {answers[i] === q.correct ? (
                <span className="correct">{tt('lessonChat.right')}</span>
              ) : (
                <span className="incorrect">{tt('lessonChat.correctAnswer', { answer: q.options?.[q.correct] })}</span>
              )}
              {q.explanation && <p className="quiz-gen-explanation">{q.explanation}</p>}
            </div>
          )}
        </div>
      ))}
      {!checked && (
        <button className="quiz-gen-finish" onClick={handleFinish}>
          {tt('lessonChat.finishTest')}
        </button>
      )}
      {score != null && (
        <div className="quiz-gen-result-row">
          <div className={`quiz-gen-score ${score.pct >= 60 ? 'good' : 'bad'}`}>
            {tt('ragPage.result', { correct: score.correct, total: score.total, pct: score.pct })}
          </div>
          {onClose && (
            <button type="button" className="quiz-gen-close" onClick={onClose}>
              {tt('lessonChat.hideQuiz')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Основной компонент: AG-UI чат или простой fallback.
 */
export default function LessonChat({ lessonId, courseId, lessonTitle, courseTitle, lessonContent }) {
  const { t } = useTranslation()
  const chatRef = useRef(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelWidth, setPanelWidth] = useState(() => {
    try {
      const raw = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY)
      const n = raw ? parseInt(raw, 10) : PANEL_DEFAULT_WIDTH
      return Number.isFinite(n) ? n : PANEL_DEFAULT_WIDTH
    } catch {
      return PANEL_DEFAULT_WIDTH
    }
  })
  const panelWidthRef = useRef(panelWidth)
  useEffect(() => {
    panelWidthRef.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    setPanelWidth(w => clampPanelWidth(w))
  }, [])

  useEffect(() => {
    const onWinResize = () => setPanelWidth(w => clampPanelWidth(w))
    window.addEventListener('resize', onWinResize)
    return () => window.removeEventListener('resize', onWinResize)
  }, [])

  useEffect(() => {
    if (!panelOpen) return
    const onKey = e => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen])

  useEffect(() => {
    if (!panelOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [panelOpen])

  const beginPanelResize = useCallback(clientX => {
    const startX = clientX
    const startW = panelWidthRef.current
    const onMove = cx => {
      const delta = startX - cx
      const next = clampPanelWidth(startW + delta)
      panelWidthRef.current = next
      setPanelWidth(next)
    }
    const onMouseMove = e => onMove(e.clientX)
    const onTouchMove = e => {
      if (e.touches.length === 1) {
        e.preventDefault()
        onMove(e.touches[0].clientX)
      }
    }
    const end = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', end)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', end)
      document.removeEventListener('touchcancel', end)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      try {
        localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidthRef.current))
      } catch {
        /* ignore */
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', end)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', end)
    document.addEventListener('touchcancel', end)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const portalContent = (
    <>
      {!panelOpen && (
        <button
          type="button"
          className="lesson-chat-fab"
          onClick={() => setPanelOpen(true)}
          aria-label={t('lessonChat.openAssistant')}
          title={t('lessonChat.assistantChat')}
        >
          <FiMessageCircle className="lesson-chat-fab-icon" aria-hidden />
          {AG_UI_URL && <span className="lesson-chat-fab-badge" aria-hidden>AG</span>}
        </button>
      )}

      {panelOpen && (
        <>
          <div
            className="lesson-chat-backdrop"
            aria-hidden
            onClick={() => setPanelOpen(false)}
          />
          <aside
            className="lesson-chat-panel"
            style={{ width: panelWidth }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-chat-panel-title"
          >
            <div
              className="lesson-chat-panel-resize"
              onMouseDown={e => {
                e.preventDefault()
                beginPanelResize(e.clientX)
              }}
              onTouchStart={e => {
                if (e.touches.length === 1) {
                  beginPanelResize(e.touches[0].clientX)
                }
              }}
              role="separator"
              aria-orientation="vertical"
              aria-label={t('lessonChat.resizePanel')}
            />
            <div className="lesson-chat-panel-inner">
              <div className="lesson-chat-header lesson-chat-panel-header">
                <h2 id="lesson-chat-panel-title">
                  <FiMessageCircle aria-hidden /> {t('lessonChat.assistantTitle')}
                  {AG_UI_URL && <span className="lesson-chat-badge">AG-UI</span>}
                </h2>
                <button
                  type="button"
                  className="lesson-chat-panel-close"
                  onClick={() => setPanelOpen(false)}
                  aria-label={t('lessonChat.closeChat')}
                  title={t('lessonChat.close')}
                >
                  <FiX aria-hidden />
                </button>
              </div>

              <div className="lesson-chat-panel-toolbar" role="toolbar" aria-label={t('lessonChat.chatActions')}>
                <button
                  type="button"
                  className="lesson-chat-toolbar-btn"
                  onClick={() => chatRef.current?.clear()}
                  title={t('lessonChat.clearHistory')}
                >
                  <FiTrash2 aria-hidden />
                  <span>{t('lessonChat.clear')}</span>
                </button>
                <button
                  type="button"
                  className="lesson-chat-toolbar-btn lesson-chat-toolbar-btn--ghost"
                  onClick={() => chatRef.current?.scrollToBottom()}
                  title={t('lessonChat.scrollBottom')}
                >
                  <FiChevronDown aria-hidden />
                  <span>{t('lessonChat.down')}</span>
                </button>
              </div>

              <div className="lesson-chat-panel-body">
                <div className="lesson-chat-panel-chat-area">
                  {AG_UI_URL ? (
                    <AGUIChat
                      ref={chatRef}
                      lessonId={lessonId}
                      courseId={courseId}
                      lessonTitle={lessonTitle}
                      courseTitle={courseTitle}
                      lessonContent={lessonContent}
                    />
                  ) : (
                    <SimpleLessonChat
                      ref={chatRef}
                      lessonId={lessonId}
                      courseId={courseId}
                      lessonTitle={lessonTitle}
                      courseTitle={courseTitle}
                    />
                  )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )

  return createPortal(portalContent, document.body)
}
