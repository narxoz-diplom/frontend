import React, { useState, useMemo, useEffect } from 'react'
import { FiUpload, FiFileText, FiMessageSquare, FiHelpCircle, FiEdit3 } from 'react-icons/fi'
import api from '../services/api'
import { isTeacher } from '../utils/roles'
import './RAG.css'

// Ключи функций для учителя и студента
const TEACHER_FUNCTIONS = [
  { value: 'ingest', label: 'Загрузить контент', icon: FiUpload },
  { value: 'module', label: 'Сгенерировать модуль', icon: FiFileText },
  { value: 'summary', label: 'Создать сводку', icon: FiMessageSquare },
  { value: 'quiz', label: 'Викторина', icon: FiHelpCircle },
  { value: 'exam', label: 'Экзаменационные вопросы', icon: FiEdit3 }
]
const STUDENT_FUNCTIONS = [
  { value: 'summary', label: 'Получить резюме', icon: FiMessageSquare },
  { value: 'quiz', label: 'Пройти викторину', icon: FiHelpCircle }
]

const RAG = () => {
  const keycloak = typeof window !== 'undefined' ? window.keycloak : null
  const isTeacherRole = useMemo(() => isTeacher(keycloak), [keycloak?.token])
  const functions = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
  const [selectedFunction, setSelectedFunction] = useState(functions[0]?.value ?? 'ingest')
  useEffect(() => {
    const allowed = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
    const valid = allowed.some(f => f.value === selectedFunction)
    if (!valid && allowed.length) setSelectedFunction(allowed[0].value)
  }, [isTeacherRole, selectedFunction])
  const [ingestFile, setIngestFile] = useState(null)
  const [ingestCollection, setIngestCollection] = useState('')
  const [ingestMetadata, setIngestMetadata] = useState('')
  const [ingestResult, setIngestResult] = useState(null)
  const [ingestLoading, setIngestLoading] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [genCollection, setGenCollection] = useState('')
  const [topK, setTopK] = useState(8)
  const [moduleResult, setModuleResult] = useState(null)
  const [moduleLoading, setModuleLoading] = useState(false)

  const [summaryCollection, setSummaryCollection] = useState('')
  const [summaryResult, setSummaryResult] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [quizCollection, setQuizCollection] = useState('')
  const [quizData, setQuizData] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizAnsweredQuestions, setQuizAnsweredQuestions] = useState(new Set())
  const [quizHintsVisible, setQuizHintsVisible] = useState(new Set())
  const [quizChecked, setQuizChecked] = useState(false)
  const [quizScore, setQuizScore] = useState(null)

  const [examCollection, setExamCollection] = useState('')
  const [examResult, setExamResult] = useState(null)
  const [examLoading, setExamLoading] = useState(false)

  const ragPost = (path, body, isJson = true) => {
    const config = isJson ? {} : { headers: { 'Content-Type': undefined } }
    return api.post(`/rag${path}`, body, config)
  }

  const handleIngest = async (e) => {
    e.preventDefault()
    if (!ingestFile) {
      setIngestResult({ error: 'Выберите файл' })
      return
    }
    setIngestLoading(true)
    setIngestResult(null)
    try {
      const formData = new FormData()
      formData.append('file', ingestFile)
      if (ingestCollection.trim()) formData.append('collection_name', ingestCollection.trim())
      if (ingestMetadata.trim()) formData.append('metadata', ingestMetadata.trim())
      const r = await ragPost('/ingest', formData, false)
      setIngestResult({ success: true, ...r.data })
    } catch (err) {
      setIngestResult({
        error: err.response?.data?.detail || err.message || 'Ошибка загрузки'
      })
    } finally {
      setIngestLoading(false)
    }
  }

  const handleGenerateModule = async (e) => {
    e.preventDefault()
    setModuleLoading(true)
    setModuleResult(null)
    try {
      const r = await ragPost('/generate-module', {
        prompt: prompt.trim() || 'Создай обучающий модуль по загруженным материалам.',
        collection_name: genCollection.trim() || undefined,
        top_k: topK
      })
      setModuleResult(r.data)
    } catch (err) {
      setModuleResult({
        error: err.response?.data?.detail || err.message || 'Ошибка генерации'
      })
    } finally {
      setModuleLoading(false)
    }
  }

  const handleSummary = async (e) => {
    e.preventDefault()
    setSummaryLoading(true)
    setSummaryResult(null)
    try {
      const r = await ragPost('/generate-summary', {
        prompt: 'Сгенерируй по загруженным материалам.',
        collection_name: summaryCollection.trim() || undefined,
        top_k: 8
      })
      setSummaryResult(r.data)
    } catch (err) {
      setSummaryResult({
        error: err.response?.data?.detail || err.message || 'Ошибка'
      })
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleQuiz = async (e) => {
    e.preventDefault()
    setQuizLoading(true)
    setQuizData(null)
    setQuizChecked(false)
    setQuizScore(null)
    setQuizAnswers({})
    setQuizAnsweredQuestions(new Set())
    setQuizHintsVisible(new Set())
    try {
      const r = await ragPost('/generate-quiz-interactive', {
        prompt: 'Создай тест.',
        collection_name: quizCollection.trim() || undefined,
        top_k: 8
      })
      setQuizData(r.data)
    } catch (err) {
      setQuizData({
        error: err.response?.data?.detail || err.message || 'Ошибка'
      })
    } finally {
      setQuizLoading(false)
    }
  }

  const handleQuizAnswer = (questionIndex, optionKey) => {
    if (!quizData?.questions) return
    const newAnswers = { ...quizAnswers, ['q' + questionIndex]: optionKey }
    setQuizAnswers(newAnswers)
    setQuizAnsweredQuestions(prev => {
      const next = new Set([...prev, questionIndex])
      if (next.size === quizData.questions.length) {
        let correct = 0
        quizData.questions.forEach((q, i) => {
          if (newAnswers['q' + i] === q.correct) correct++
        })
        const total = quizData.questions.length
        setQuizScore({ correct, total, pct: total ? Math.round((correct / total) * 100) : 0 })
        setQuizChecked(true)
      }
      return next
    })
  }

  const handleFinishQuiz = () => {
    if (!quizData?.questions) return
    let correct = 0
    quizData.questions.forEach((q, i) => {
      if (quizAnswers['q' + i] === q.correct) correct++
    })
    const total = quizData.questions.length
    setQuizScore({ correct, total, pct: total ? Math.round((correct / total) * 100) : 0 })
    setQuizChecked(true)
  }

  const handleExam = async (e) => {
    e.preventDefault()
    setExamLoading(true)
    setExamResult(null)
    try {
      const r = await ragPost('/generate-exam-questions', {
        prompt: 'Сгенерируй по загруженным материалам.',
        collection_name: examCollection.trim() || undefined,
        top_k: 8
      })
      setExamResult(r.data)
    } catch (err) {
      setExamResult({
        error: err.response?.data?.detail || err.message || 'Ошибка'
      })
    } finally {
      setExamLoading(false)
    }
  }

  return (
    <div className="rag-page">
      <header className="rag-header">
        <h1>RAG — образовательные модули</h1>
        <p className="rag-subtitle">
          {isTeacherRole
            ? 'Загружайте контент в векторную базу и создавайте модули, презентации, тесты и экзаменационные вопросы.'
            : 'Задавайте вопросы по курсу, получайте резюме и проходите викторины по материалам.'}
        </p>
      </header>

      <div className="rag-toolbar">
        <span className={`rag-role-badge ${isTeacherRole ? 'teacher' : 'student'}`}>
          {isTeacherRole ? 'Учитель' : 'Студент'}
        </span>
        <label className="rag-toolbar-label">Функция:</label>
        <select
          className="rag-function-select"
          value={selectedFunction}
          onChange={(e) => setSelectedFunction(e.target.value)}
          aria-label="Выберите функцию"
        >
          {functions.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {selectedFunction === 'ingest' && (
      <section className="rag-card">
        <h2><FiUpload /> Загрузить контент</h2>
        <form onSubmit={handleIngest}>
          <label>Файл (PDF, DOCX, видео, аудио, изображение)</label>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.mp4,.mov,.mp3,.wav,.m4a,.png,.jpg,.jpeg"
            onChange={(e) => setIngestFile(e.target.files?.[0] || null)}
            required
          />
          <label>Коллекция (необязательно)</label>
          <input
            type="text"
            value={ingestCollection}
            onChange={(e) => setIngestCollection(e.target.value)}
            placeholder="default"
          />
          <label>Метаданные JSON (необязательно)</label>
          <input
            type="text"
            value={ingestMetadata}
            onChange={(e) => setIngestMetadata(e.target.value)}
            placeholder='{"course_name": "...", "topic": "..."}'
          />
          <button type="submit" disabled={ingestLoading}>
            {ingestLoading ? 'Загрузка…' : 'Загрузить'}
          </button>
        </form>
        {ingestResult && (
          <div className={`rag-out ${ingestResult.error ? 'error' : 'success'}`}>
            {ingestResult.error || (
              <>Загружено: {ingestResult.chunks_count} чанков. Документ: {ingestResult.document_id}. Коллекция: {ingestResult.collection_name}</>
            )}
          </div>
        )}
      </section>
      )}

      {selectedFunction === 'module' && (
      <section className="rag-card">
        <h2><FiFileText /> Сгенерировать модуль</h2>
        <form onSubmit={handleGenerateModule}>
          <label>Запрос</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Создай обучающий модуль по теме из загруженных материалов..."
            rows={3}
          />
          <label>Коллекция (необязательно)</label>
          <input
            type="text"
            value={genCollection}
            onChange={(e) => setGenCollection(e.target.value)}
            placeholder="default"
          />
          <label>Число чанков (1–50)</label>
          <input
            type="number"
            min={1}
            max={50}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value) || 8)}
          />
          <button type="submit" disabled={moduleLoading}>
            {moduleLoading ? 'Генерация…' : 'Сгенерировать'}
          </button>
        </form>
        {moduleResult && (
          <div className={`rag-out ${moduleResult.error ? 'error' : 'text'}`}>
            {moduleResult.error || (
              <>
                {moduleResult.module_text}
                {moduleResult.chunks_used != null && (
                  <p className="rag-meta">Использовано чанков: {moduleResult.chunks_used}, коллекция: {moduleResult.collection_name}</p>
                )}
              </>
            )}
          </div>
        )}
      </section>
      )}

      {selectedFunction === 'summary' && (
      <section className="rag-card">
        <h2><FiMessageSquare /> Создать сводку</h2>
        <form onSubmit={handleSummary}>
          <label>Коллекция</label>
          <input
            type="text"
            value={summaryCollection}
            onChange={(e) => setSummaryCollection(e.target.value)}
            placeholder="default"
          />
          <button type="submit" disabled={summaryLoading}>
            {summaryLoading ? 'Генерация…' : 'Сгенерировать резюме'}
          </button>
        </form>
        {summaryResult && (
          <div className={`rag-out ${summaryResult.error ? 'error' : 'text'}`}>
            {summaryResult.error || (
              <>
                {summaryResult.text}
                {summaryResult.chunks_used != null && (
                  <p className="rag-meta">Чанков: {summaryResult.chunks_used}, коллекция: {summaryResult.collection_name}</p>
                )}
              </>
            )}
          </div>
        )}
      </section>
      )}

      {selectedFunction === 'quiz' && (
      <section className="rag-card">
        <h2><FiHelpCircle /> {isTeacherRole ? 'Создать викторину' : 'Викторина'}</h2>
        <form onSubmit={handleQuiz}>
          <label>Коллекция</label>
          <input
            type="text"
            value={quizCollection}
            onChange={(e) => setQuizCollection(e.target.value)}
            placeholder="default"
          />
          <button type="submit" disabled={quizLoading}>
            {quizLoading ? 'Генерация…' : 'Сгенерировать викторину'}
          </button>
        </form>
        {quizData && (
          <div className="rag-out text">
            {quizData.error ? (
              quizData.error
            ) : (
              <>
                {(quizData.questions || []).map((q, i) => {
                  const answered = quizAnsweredQuestions.has(i)
                  const userAnswer = quizAnswers['q' + i]
                  const isCorrect = userAnswer === q.correct
                  return (
                    <div
                      key={i}
                      className={`quiz-item ${answered ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                    >
                      <p><strong>{i + 1}. {q.question}</strong></p>
                      {(q.hint != null && q.hint !== '') && (
                        <div className="quiz-hint-block">
                          {!quizHintsVisible.has(i) ? (
                            <button
                              type="button"
                              className="btn-quiz-hint"
                              onClick={() => setQuizHintsVisible(prev => new Set([...prev, i]))}
                            >
                              Подсказка
                            </button>
                          ) : (
                            <p className="quiz-hint-text">{q.hint}</p>
                          )}
                        </div>
                      )}
                      {['A', 'B', 'C', 'D'].filter(k => q.options?.[k]).map(k => (
                        <label key={k}>
                          <input
                            type="radio"
                            name={'q' + i}
                            value={k}
                            checked={userAnswer === k}
                            onChange={() => handleQuizAnswer(i, k)}
                            disabled={answered}
                          />
                          {q.options[k]}
                        </label>
                      ))}
                      {answered && (
                        <div className="quiz-feedback">
                          {isCorrect ? (
                            <>
                              <p className="quiz-feedback-correct">Верно!</p>
                              <p className="correct-answer">Правильный ответ: {q.options?.[q.correct] ?? q.correct}</p>
                              {q.explanation && <p className="quiz-explanation">{q.explanation}</p>}
                            </>
                          ) : (
                            <>
                              <p className="quiz-feedback-incorrect">Неверно.</p>
                              <p className="quiz-your-answer">Ваш ответ: {userAnswer ? (q.options?.[userAnswer] ?? userAnswer) : '—'}</p>
                              <p className="correct-answer">Правильный ответ: {q.options?.[q.correct] ?? q.correct}</p>
                              {q.explanation && <p className="quiz-explanation">{q.explanation}</p>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {quizData.questions?.length && !quizChecked && (
                  <button type="button" className="btn-finish-quiz" onClick={handleFinishQuiz}>
                    Завершить тест
                  </button>
                )}
                {quizScore != null && (
                  <div className={`quiz-result ${quizScore.pct >= 60 ? 'good' : 'bad'}`}>
                    Результат: {quizScore.correct} из {quizScore.total} ({quizScore.pct}%)
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
      )}

      {selectedFunction === 'exam' && (
      <section className="rag-card">
        <h2><FiEdit3 /> Экзаменационные вопросы</h2>
        <form onSubmit={handleExam}>
          <label>Коллекция</label>
          <input
            type="text"
            value={examCollection}
            onChange={(e) => setExamCollection(e.target.value)}
            placeholder="default"
          />
          <button type="submit" disabled={examLoading}>
            {examLoading ? 'Генерация…' : 'Сгенерировать вопросы'}
          </button>
        </form>
        {examResult && (
          <div className={`rag-out ${examResult.error ? 'error' : 'text'}`}>
            {examResult.error || (
              <>
                {examResult.text}
                {examResult.chunks_used != null && (
                  <p className="rag-meta">Чанков: {examResult.chunks_used}, коллекция: {examResult.collection_name}</p>
                )}
              </>
            )}
          </div>
        )}
      </section>
      )}
    </div>
  )
}

export default RAG
