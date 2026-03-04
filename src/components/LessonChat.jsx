/**
 * LessonChat — чат в контексте урока с AG-UI (Google AdK).
 * Интегрирован с RAG: вопросы по уроку, генерация тестов с тематическим оформлением.
 * При заданном VITE_AG_UI_URL чат идёт через AG-UI агент (Google ADK).
 */
import React, { useState, useRef, useEffect, useMemo } from 'react'
import axios from 'axios'
import { FiMessageCircle, FiHelpCircle, FiSend, FiX } from 'react-icons/fi'
import { HttpAgent, randomUUID } from '@ag-ui/client'
import api from '../services/api'
import './LessonChat.css'

const RAG_DIRECT_URL = String(import.meta.env.VITE_RAG_URL || '').trim()
const AG_UI_URL = String(import.meta.env.VITE_AG_UI_URL || '').trim().replace(/\/$/, '')

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
          <QuizGenerativeUI result={result} theme={result?.theme || { primary: '#2d5016', accent: '#7cb342' }} />
        </div>
      )
    }
    if (result?.summary != null) {
      if (result?.ui_type === 'analytics') {
        return (
          <div key={msg.id} className="lesson-chat ag-ui-inline-gen">
            <AnalyticsGenerativeUI result={result} theme={result?.theme || { primary: '#6366f1', accent: '#a5b4fc' }} />
          </div>
        )
      }
      return (
        <div key={msg.id} className="lesson-chat ag-ui-inline-gen">
          <SummaryGenerativeUI result={result} theme={result?.theme || { primary: '#6366f1', accent: '#a5b4fc' }} />
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
 * Чат через AG-UI агент по протоколу AG-UI (HttpAgent). Запросы идут напрямую на VITE_AG_UI_URL.
 */
function AGUIChat({ lessonId, courseId, lessonTitle, courseTitle }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const threadId = `lesson-${String(lessonId ?? '')}-${String(courseId ?? '')}`
  const textareaRef = useRef(null)

  const agent = useMemo(
    () => (AG_UI_URL ? new HttpAgent({ url: AG_UI_URL, threadId }) : null),
    [AG_UI_URL, threadId]
  )

  const lessonState = useMemo(
    () => ({
      lesson_id: lessonId ? String(lessonId) : null,
      course_id: courseId ? String(courseId) : null,
      lesson_title: lessonTitle || '',
      course_title: courseTitle || '',
      collection_name: courseId ? `course_${courseId}` : 'default',
    }),
    [lessonId, courseId, lessonTitle, courseTitle]
  )

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  const sendMessage = async () => {
    if (!input.trim() || loading || !agent) return
    const userContent = input.trim()
    setInput('')
    setError(null)
    const userMsg = { id: randomUUID(), role: 'user', content: userContent }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)
    try {
      agent.setMessages(nextMessages)
      agent.setState(lessonState)
      const result = await agent.runAgent({ runId: randomUUID() })
      if (result?.newMessages?.length) {
        setMessages(prev => [...prev, ...result.newMessages])
      }
    } catch (err) {
      const errMsg = err?.message || String(err)
      setError(errMsg)
      setMessages(prev => [
        ...prev,
        { id: randomUUID(), role: 'assistant', content: `Ошибка: ${errMsg}. Проверьте, что AG-UI агент запущен на ${AG_UI_URL} (порт 5001) и CORS разрешён.` },
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
            <p>Задайте вопрос по уроку, попросите тест, резюме или аналитику</p>
          </div>
        )}
        {messages.map(renderAGUIMessage)}
        {loading && <div className="lesson-chat-msg assistant typing">...</div>}
      </div>
      {error && <div className="lesson-chat-error">{error}</div>}
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
          placeholder="Сообщение... (Enter — отправить)"
          disabled={loading}
          rows={1}
          maxLength={4000}
        />
        <button type="button" className="lesson-chat-send" onClick={sendMessage} disabled={loading} title="Отправить">
          <FiSend />
        </button>
      </div>
    </div>
  )
}

/**
 * Простой чат — прямые запросы к RAG (без AG-UI агента).
 */
function SimpleLessonChat({ lessonId, courseId, lessonTitle, courseTitle }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef(null)

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
      setMessages(prev => [...prev, { role: 'assistant', content: r.data?.answer ?? 'Нет ответа.' }])
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || err.message || 'Неизвестная ошибка'
      let msg = 'Ошибка: ' + detail
      if (status === 502) {
        msg = 'RAG вернул ошибку генерации. Проверьте LLM API key в RAG (OpenAI и т.д.).'
        if (typeof detail === 'string' && detail.length) msg += ' Детали: ' + detail
      } else if (status === 503) {
        msg = 'Векторная база RAG недоступна. Проверьте ChromaDB.'
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        msg = 'Не удалось подключиться к RAG. Запустите RAG на порту 8000. Если используете Gateway — также запустите его на 8083. Либо в .env задайте VITE_RAG_URL=http://localhost:8000 для прямого запроса к RAG.'
      } else if (status === 404) {
        msg = 'Маршрут RAG не найден. Задайте VITE_RAG_URL=http://localhost:8000 в .env фронтенда и перезапустите dev-сервер.'
      }
      setMessages(prev => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lesson-chat simple-chat">
      <div className="lesson-chat-messages">
        {messages.length === 0 && (
          <div className="lesson-chat-empty">
            <FiMessageCircle />
            <p>Задайте вопрос по материалу урока</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`lesson-chat-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="lesson-chat-msg assistant typing">...</div>}
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
          placeholder="Сообщение... (Enter — отправить)"
          disabled={loading}
          rows={1}
          maxLength={4000}
        />
        <button type="button" className="lesson-chat-send" onClick={sendMessage} disabled={loading} title="Отправить">
          <FiSend />
        </button>
      </div>
    </div>
  )
}

/**
 * Генеративный UI для резюме урока — карточка с темой по курсу.
 */
function SummaryGenerativeUI({ result, theme = {}, onClose }) {
  const summary = result?.summary || ''
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'
  if (!summary) return null
  return (
    <div className="ag-ui-summary-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-summary-header">
        <span className="ag-ui-summary-icon">📋</span>
        <div>
          <h3>Резюме урока</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="ag-ui-card-close" onClick={onClose} aria-label="Закрыть">
            <FiX />
          </button>
        )}
      </div>
      <div className="ag-ui-summary-body">
        {summary.split(/\n\n+/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  )
}

/**
 * Генеративный UI для аналитики — карточка с фактами/тезисами и темой по курсу.
 */
function AnalyticsGenerativeUI({ result, theme = {}, onClose }) {
  const summary = result?.summary || ''
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'
  if (!summary) return null
  const lines = summary.split(/\n/).filter(Boolean)
  return (
    <div className="ag-ui-analytics-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-analytics-header">
        <span className="ag-ui-analytics-icon">📊</span>
        <div>
          <h3>Аналитика по уроку</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="ag-ui-card-close" onClick={onClose} aria-label="Закрыть">
            <FiX />
          </button>
        )}
      </div>
      <div className="ag-ui-analytics-body">
        {lines.map((line, i) => (
          <div key={i} className="ag-ui-analytics-item">
            {line.replace(/^[\s•\-*]+\s*/, '').trim()}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Генеративный UI для теста — рендерит вопросы с тематическим оформлением.
 * key должен меняться при каждой новой генерации теста, чтобы сбросить состояние.
 */
function QuizGenerativeUI({ args, result, theme = {}, onClose }) {
  const questions = result?.questions || []
  const t = theme.primary || '#2d5016'
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
    return <div className="quiz-gen-error">{result.message || 'Ошибка генерации теста'}</div>
  }

  if (!questions.length) return null

  return (
    <div className="quiz-generative-ui" style={{ '--theme-primary': t, '--theme-accent': theme.accent || '#7cb342' }}>
      <div className="quiz-gen-header">
        <div className="quiz-gen-header-text">
          <h3>Тест по уроку</h3>
          {result?.lesson_title && <span>{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="quiz-gen-header-close" onClick={onClose} title="Скрыть тест" aria-label="Скрыть тест">
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
                  Показать подсказку
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
                <span className="correct">Верно!</span>
              ) : (
                <span className="incorrect">Правильный ответ: {q.options?.[q.correct]}</span>
              )}
              {q.explanation && <p className="quiz-gen-explanation">{q.explanation}</p>}
            </div>
          )}
        </div>
      ))}
      {!checked && (
        <button className="quiz-gen-finish" onClick={handleFinish}>
          Завершить тест
        </button>
      )}
      {score != null && (
        <div className="quiz-gen-result-row">
          <div className={`quiz-gen-score ${score.pct >= 60 ? 'good' : 'bad'}`}>
            Результат: {score.correct} из {score.total} ({score.pct}%)
          </div>
          {onClose && (
            <button type="button" className="quiz-gen-close" onClick={onClose}>
              Скрыть тест
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
export default function LessonChat({ lessonId, courseId, lessonTitle, courseTitle, onCreateTest }) {
  const [showChat, setShowChat] = useState(false)
  const [quizData, setQuizData] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizTheme, setQuizTheme] = useState({ primary: '#2d5016', accent: '#7cb342' })
  const [quizKey, setQuizKey] = useState(0)

  const getThemeForCourse = title => {
    if (!title) return { primary: '#2d5016', accent: '#7cb342' }
    const t = title.toLowerCase()
    if (t.includes('биолог') || t.includes('biology')) return { primary: '#2d5016', accent: '#7cb342' }
    if (t.includes('хими') || t.includes('chemistry')) return { primary: '#1565c0', accent: '#42a5f5' }
    if (t.includes('математ') || t.includes('math')) return { primary: '#6a1b9a', accent: '#ab47bc' }
    if (t.includes('истори') || t.includes('history')) return { primary: '#bf360c', accent: '#ff7043' }
    return { primary: '#6366f1', accent: '#a5b4fc' }
  }

  const handleCreateTest = async () => {
    if (quizLoading) return
    setQuizLoading(true)
    setQuizTheme(getThemeForCourse(courseTitle))
    try {
      const r = await ragPost('generate-quiz-lms', {
        collection_name: courseId ? `course_${courseId}` : 'default',
        prompt: 'Создай тест по материалу урока для подготовки.',
        top_k: 20,
        lesson_ids: lessonId ? [String(lessonId)] : undefined,
      })
      setQuizData(r.data)
      setQuizKey(k => k + 1)
      onCreateTest?.(r.data)
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || err.message || 'Неизвестная ошибка'
      let errorMsg = detail
      if (status === 502) errorMsg = 'RAG недоступен или ошибка генерации. Проверьте RAG (порт 8000) и LLM API key.'
      else if (status === 503) errorMsg = 'Векторная база RAG недоступна.'
      else if (err.code === 'ERR_NETWORK') errorMsg = 'Сеть недоступна. Запустите Gateway (8083) и RAG (8000).'
      setQuizData({ error: errorMsg })
    } finally {
      setQuizLoading(false)
    }
  }

  return (
    <div className="lesson-chat-container">
      <div className="lesson-chat-header">
        <h2><FiMessageCircle /> Помощник по уроку</h2>
        <button
          className="btn-create-test"
          onClick={handleCreateTest}
          disabled={quizLoading}
          style={{ '--btn-color': quizTheme.primary }}
        >
          <FiHelpCircle /> {quizLoading ? 'Создаю тест...' : 'Создать тест'}
        </button>
      </div>

      {quizData && !quizData.error && (
        <div className="lesson-quiz-block" style={{ '--theme-primary': quizTheme.primary }}>
          <QuizGenerativeUI
            key={quizKey}
            result={{ ...quizData, lesson_title: lessonTitle }}
            theme={quizTheme}
            onClose={() => setQuizData(null)}
          />
        </div>
      )}
      {quizData?.error && (
        <div className="lesson-quiz-error">
          <span>{quizData.error}</span>
          <button type="button" className="lesson-quiz-error-close" onClick={() => setQuizData(null)} aria-label="Закрыть">
            <FiX />
          </button>
        </div>
      )}

      <div className="lesson-chat-toggle">
        <button
          className={`btn-toggle-chat ${showChat ? 'active' : ''}`}
          onClick={() => setShowChat(!showChat)}
        >
          <FiMessageCircle /> {showChat ? 'Скрыть чат' : 'Открыть чат'}
          {AG_UI_URL && <span className="lesson-chat-badge">AG-UI</span>}
        </button>
      </div>

      {showChat &&
        (AG_UI_URL ? (
          <AGUIChat
            lessonId={lessonId}
            courseId={courseId}
            lessonTitle={lessonTitle}
            courseTitle={courseTitle}
          />
        ) : (
          <SimpleLessonChat
            lessonId={lessonId}
            courseId={courseId}
            lessonTitle={lessonTitle}
            courseTitle={courseTitle}
          />
        ))}
    </div>
  )
}
