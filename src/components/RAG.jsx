import React, { useState, useMemo, useEffect } from 'react'
import { FiUpload, FiFileText, FiMessageSquare, FiHelpCircle, FiEdit3 } from 'react-icons/fi'
import api from '../services/api'
import { isTeacher } from '../utils/roles'
import { useTranslation } from 'react-i18next'
import './RAG.css'

const RAG = () => {
  const { t } = useTranslation()
  const keycloak = typeof window !== 'undefined' ? window.keycloak : null
  const isTeacherRole = useMemo(() => isTeacher(keycloak), [keycloak?.token])
  const TEACHER_FUNCTIONS = useMemo(() => [
    { value: 'ingest', label: t('ragPage.ingest'), icon: FiUpload },
    { value: 'module', label: t('ragPage.generateModule'), icon: FiFileText },
    { value: 'summary', label: t('ragPage.createSummary'), icon: FiMessageSquare },
    { value: 'quiz', label: t('ragPage.quiz'), icon: FiHelpCircle },
    { value: 'exam', label: t('ragPage.examQuestions'), icon: FiEdit3 }
  ], [t])
  const STUDENT_FUNCTIONS = useMemo(() => [
    { value: 'summary', label: t('ragPage.getSummary'), icon: FiMessageSquare },
    { value: 'quiz', label: t('ragPage.takeQuiz'), icon: FiHelpCircle }
  ], [t])
  const functions = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
  const [selectedFunction, setSelectedFunction] = useState(functions[0]?.value ?? 'ingest')
  useEffect(() => {
    const allowed = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
    const valid = allowed.some(f => f.value === selectedFunction)
    if (!valid && allowed.length) setSelectedFunction(allowed[0].value)
  }, [isTeacherRole, selectedFunction])
  const [ingestFile, setIngestFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
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

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setIngestFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setIngestFile(e.target.files[0])
        }
    }

  const handleIngest = async (e) => {
    e.preventDefault()
    if (!ingestFile) {
      setIngestResult({ error: t('ragPage.selectFile') })
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
        error: err.response?.data?.detail || err.message || t('ragPage.uploadError')
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
        error: err.response?.data?.detail || err.message || t('ragPage.generationError')
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
        error: err.response?.data?.detail || err.message || t('ragPage.genericError')
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
        error: err.response?.data?.detail || err.message || t('ragPage.genericError')
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
        error: err.response?.data?.detail || err.message || t('ragPage.genericError')
      })
    } finally {
      setExamLoading(false)
    }
  }

  return (
    <div className="rag-page">
      <header className="rag-header">
        <h1>{t('ragPage.title')}</h1>
        <p className="rag-subtitle">
          {isTeacherRole
            ? t('ragPage.teacherSubtitle')
            : t('ragPage.studentSubtitle')}
        </p>
      </header>

      <div className="rag-toolbar">
        <span className={`rag-role-badge ${isTeacherRole ? 'teacher' : 'student'}`}>
          {isTeacherRole ? t('ragPage.teacher') : t('ragPage.student')}
        </span>
        <label className="rag-toolbar-label">{t('ragPage.function')}:</label>
        <select
          className="rag-function-select"
          value={selectedFunction}
          onChange={(e) => setSelectedFunction(e.target.value)}
          aria-label={t('ragPage.chooseFunction')}
        >
          {functions.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {selectedFunction === 'ingest' && (
      <section className="rag-card">
        <h2><FiUpload /> {t('ragPage.ingest')}</h2>
        <form onSubmit={handleIngest}>
          <label>{t('ragPage.fileLabel')}</label>
            <div
              className={`file-upload ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >

            <input
              type="file"
              id="fileInput"
              className="file-input"
              accept=".pdf,.docx,.doc,.mp4,.mov,.mp3,.wav,.m4a,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              required
            />

            <label htmlFor="fileInput" className="file-label">
              {ingestFile ? (
                <>
                  <span className="file-name">📄 {ingestFile.name}</span>
                  <span className="file-sub">{t('ragPage.fileChosen')}</span>
                </>
              ) : (
                <>
                  <span className="file-main">
                    {t('ragPage.uploadPrompt')}<br />
                  </span>

                  <span className="file-sub">
                    ({t('ragPage.dragPrompt')})
                  </span>
                </>
              )}
            </label>
            </div>
          <label>{t('ragPage.collectionOptional')}</label>
          <input
            type="text"
            value={ingestCollection}
            onChange={(e) => setIngestCollection(e.target.value)}
            placeholder="default"
          />
          <label>{t('ragPage.metadataOptional')}</label>
          <input
            type="text"
            value={ingestMetadata}
            onChange={(e) => setIngestMetadata(e.target.value)}
            placeholder='{"course_name": "...", "topic": "..."}'
          />
          <button type="submit" disabled={ingestLoading}>
            {ingestLoading ? t('common.loading') : t('ragPage.upload')}
          </button>
        </form>
        {ingestResult && (
          <div className={`rag-out ${ingestResult.error ? 'error' : 'success'}`}>
            {ingestResult.error || (
              <>{t('ragPage.uploadedChunks', { chunks: ingestResult.chunks_count, document: ingestResult.document_id, collection: ingestResult.collection_name })}</>
            )}
          </div>
        )}
      </section>
      )}

      {selectedFunction === 'module' && (
      <section className="rag-card">
        <h2><FiFileText /> {t('ragPage.generateModule')}</h2>
        <form onSubmit={handleGenerateModule}>
          <label>{t('ragPage.request')}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('ragPage.modulePromptPlaceholder')}
            rows={3}
          />
          <label>{t('ragPage.collectionOptional')}</label>
          <input
            type="text"
            value={genCollection}
            onChange={(e) => setGenCollection(e.target.value)}
            placeholder="default"
          />
          <label>{t('ragPage.chunkCount')}</label>
          <input
            type="number"
            min={1}
            max={50}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value) || 8)}
          />
          <button type="submit" disabled={moduleLoading}>
            {moduleLoading ? t('common.loading') : t('ragPage.generate')}
          </button>
        </form>
        {moduleResult && (
          <div className={`rag-out ${moduleResult.error ? 'error' : 'text'}`}>
            {moduleResult.error || (
              <>
                {moduleResult.module_text}
                {moduleResult.chunks_used != null && (
                  <p className="rag-meta">{t('ragPage.chunksUsed', { chunks: moduleResult.chunks_used, collection: moduleResult.collection_name })}</p>
                )}
              </>
            )}
          </div>
        )}
      </section>
      )}

      {selectedFunction === 'summary' && (
      <section className="rag-card">
        <h2><FiMessageSquare /> {t('ragPage.createSummary')}</h2>
        <form onSubmit={handleSummary}>
          <label>{t('ragPage.collection')}</label>
          <input
            type="text"
            value={summaryCollection}
            onChange={(e) => setSummaryCollection(e.target.value)}
            placeholder="default"
          />
          <button type="submit" disabled={summaryLoading}>
            {summaryLoading ? t('common.loading') : t('ragPage.generateSummary')}
          </button>
        </form>
        {summaryResult && (
          <div className={`rag-out ${summaryResult.error ? 'error' : 'text'}`}>
            {summaryResult.error || (
              <>
                {summaryResult.text}
                {summaryResult.chunks_used != null && (
                  <p className="rag-meta">{t('ragPage.chunksShort', { chunks: summaryResult.chunks_used, collection: summaryResult.collection_name })}</p>
                )}
              </>
            )}
          </div>
        )}
      </section>
      )}

      {selectedFunction === 'quiz' && (
      <section className="rag-card">
        <h2><FiHelpCircle /> {isTeacherRole ? t('ragPage.createQuiz') : t('ragPage.quiz')}</h2>
        <form onSubmit={handleQuiz}>
          <label>{t('ragPage.collection')}</label>
          <input
            type="text"
            value={quizCollection}
            onChange={(e) => setQuizCollection(e.target.value)}
            placeholder="default"
          />
          <button type="submit" disabled={quizLoading}>
            {quizLoading ? t('common.loading') : t('ragPage.generateQuiz')}
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
                              {t('ragPage.hint')}
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
                              <p className="quiz-feedback-correct">{t('ragPage.correct')}</p>
                              <p className="correct-answer">{t('ragPage.rightAnswer', { answer: q.options?.[q.correct] ?? q.correct })}</p>
                              {q.explanation && <p className="quiz-explanation">{q.explanation}</p>}
                            </>
                          ) : (
                            <>
                              <p className="quiz-feedback-incorrect">{t('ragPage.incorrect')}</p>
                              <p className="quiz-your-answer">{t('ragPage.yourAnswer', { answer: userAnswer ? (q.options?.[userAnswer] ?? userAnswer) : '—' })}</p>
                              <p className="correct-answer">{t('ragPage.rightAnswer', { answer: q.options?.[q.correct] ?? q.correct })}</p>
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
                    {t('ragPage.finishQuiz')}
                  </button>
                )}
                {quizScore != null && (
                  <div className={`quiz-result ${quizScore.pct >= 60 ? 'good' : 'bad'}`}>
                    {t('ragPage.result', { correct: quizScore.correct, total: quizScore.total, pct: quizScore.pct })}
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
        <h2><FiEdit3 /> {t('ragPage.examQuestions')}</h2>
        <form onSubmit={handleExam}>
          <label>{t('ragPage.collection')}</label>
          <input
            type="text"
            value={examCollection}
            onChange={(e) => setExamCollection(e.target.value)}
            placeholder="default"
          />
          <button type="submit" disabled={examLoading}>
            {examLoading ? t('common.loading') : t('ragPage.generateQuestions')}
          </button>
        </form>
        {examResult && (
          <div className={`rag-out ${examResult.error ? 'error' : 'text'}`}>
            {examResult.error || (
              <>
                {examResult.text}
                {examResult.chunks_used != null && (
                  <p className="rag-meta">{t('ragPage.chunksShort', { chunks: examResult.chunks_used, collection: examResult.collection_name })}</p>
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
