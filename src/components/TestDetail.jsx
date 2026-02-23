import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckSquare } from 'react-icons/fi'
import api from '../services/api'
import './TestDetail.css'

const TestDetail = () => {
  const { courseId, testId } = useParams()
  const [test, setTest] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTest()
  }, [courseId, testId])

  const loadTest = async () => {
    try {
      setLoading(true)
      const [testRes, courseRes] = await Promise.all([
        api.get(`/courses/tests/${testId}`),
        api.get(`/courses/${courseId}`)
      ])
      setTest(testRes.data)
      setCourse(courseRes.data)
      setError(null)
    } catch (err) {
      console.error('Error loading test:', err)
      setError('Не удалось загрузить тест')
    } finally {
      setLoading(false)
    }
  }

  const parseOptions = (optionsStr) => {
    if (!optionsStr) return []
    try {
      const parsed = JSON.parse(optionsStr)
      return Array.isArray(parsed) ? parsed : [optionsStr]
    } catch {
      return optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await api.post(`/courses/tests/${testId}/submit`, {
        answers: Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [k, String(v)])
        )
      })
      setResult(response.data)
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting test:', err)
      setError(err.response?.data?.message || 'Ошибка отправки теста')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="test-detail-loading">
        <p>Загрузка теста...</p>
      </div>
    )
  }

  if (error && !test) {
    return <div className="test-detail-error">{error}</div>
  }

  if (!test) {
    return <div className="test-detail-error">Тест не найден</div>
  }

  const questions = test.questions || []
  const sortedQuestions = [...questions].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))

  return (
    <div className="test-detail">
      <div className="test-detail-header">
        <Link to={`/courses/${courseId}`} className="back-link">
          <FiArrowLeft /> К курсу
        </Link>
        <h1>{test.title}</h1>
        {course && (
          <p className="test-course-name">Курс: {course.title}</p>
        )}
      </div>

      {error && <div className="test-detail-error-banner">{error}</div>}

      {submitted && result ? (
        <div className="test-result">
          <div className="result-card">
            <FiCheckSquare className="result-icon" />
            <h2>Тест пройден!</h2>
            <p className="result-score">
              {result.score} / {result.maxScore} баллов
            </p>
            <p className="result-percent">
              {result.maxScore > 0
                ? Math.round((result.score / result.maxScore) * 100)
                : 0}%
            </p>
            <Link to={`/courses/${courseId}`} className="btn btn-primary">
              Вернуться к курсу
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="test-questions">
            {sortedQuestions.map((q, idx) => (
              <div key={q.id} className="question-card">
                <h3 className="question-number">
                  Вопрос {idx + 1} из {sortedQuestions.length}
                </h3>
                <p className="question-text">{q.text}</p>
                <div className="question-options">
                  {q.type === 'MULTIPLE_CHOICE' || q.type === 'MULTIPLE_ANSWER' ? (
                    parseOptions(q.options).map((opt, i) => (
                      <label key={i} className="option-label">
                        <input
                          type={q.type === 'MULTIPLE_ANSWER' ? 'checkbox' : 'radio'}
                          name={`q-${q.id}`}
                          value={opt}
                          checked={
                            q.type === 'MULTIPLE_ANSWER'
                              ? (answers[q.id] || '').split(',').includes(opt)
                              : answers[q.id] === opt
                          }
                          onChange={(e) => {
                            if (q.type === 'MULTIPLE_ANSWER') {
                              const current = (answers[q.id] || '').split(',').filter(Boolean)
                              const next = e.target.checked
                                ? [...current, opt]
                                : current.filter((x) => x !== opt)
                              handleAnswerChange(q.id, next.join(','))
                            } else {
                              handleAnswerChange(q.id, opt)
                            }
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    ))
                  ) : q.type === 'TRUE_FALSE' ? (
                    <>
                      <label className="option-label">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value="true"
                          checked={answers[q.id] === 'true'}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        <span>Верно</span>
                      </label>
                      <label className="option-label">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value="false"
                          checked={answers[q.id] === 'false'}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        <span>Неверно</span>
                      </label>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="open-answer-input"
                      placeholder="Введите ответ..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="test-submit-section">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Отправка...' : 'Отправить ответы'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default TestDetail
