import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckSquare } from 'react-icons/fi'
import { getTest, submitTest, getMyTestAttempts } from '@/shared/api/testsApi'
import { getCourse } from '@/shared/api/coursesApi'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import { parseOptions } from './lib/testOptions'
import './TestDetail.css'

const fetchAttemptsForTest = async (testId) => {
  const res = await getMyTestAttempts()
  const all = Array.isArray(res.data) ? res.data : []
  return all.filter((a) => {
    const tid = a?.testId ?? a?.test?.id
    return String(tid) === String(testId)
  })
}

const normalizeAttempt = (a) => {
  if (!a) return null
  return {
    score: a.score ?? 0,
    maxScore: a.maxScore ?? 0,
    completedAt: a.completedAt ?? null
  }
}

const TestDetail = () => {
  const { t } = useTranslation()
  const { courseId, testId } = useParams()
  const [test, setTest] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [myAttempts, setMyAttempts] = useState([])
  const [attemptsLoading, setAttemptsLoading] = useState(false)
  const [retakeMode, setRetakeMode] = useState(false)

  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true)
        const [testRes, courseRes] = await Promise.all([
          getTest(testId),
          getCourse(courseId)
        ])
        setTest(testRes.data)
        setCourse(normalizeCourseViewerResponse(courseRes.data).course)
        setError(null)
      } catch {
        setError(t('testPage.loadError'))
      } finally {
        setLoading(false)
      }
    }
    loadTest()
  }, [courseId, testId])

  useEffect(() => {
    if (!testId) return
    const loadMyAttempts = async () => {
      try {
        setAttemptsLoading(true)
        const onlyThisTest = await fetchAttemptsForTest(testId)
        setMyAttempts(onlyThisTest)
        if (onlyThisTest.length === 0) {
          setRetakeMode(false)
        }
      } catch {
        setMyAttempts([])
      } finally {
        setAttemptsLoading(false)
      }
    }
    loadMyAttempts()
  }, [testId])

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }))
  }

  const latestAttempt = myAttempts && myAttempts.length > 0 ? myAttempts[0] : null
  const latestAttemptResult = normalizeAttempt(latestAttempt)
  const attemptsUsed = Array.isArray(myAttempts) ? myAttempts.length : 0
  const maxAttempts =
    test && (test.maxAttempts ?? test.allowedAttempts ?? test.attemptLimit) != null
      ? Number(test.maxAttempts ?? test.allowedAttempts ?? test.attemptLimit)
      : null
  const attemptsLeft = maxAttempts != null && Number.isFinite(maxAttempts) ? Math.max(0, maxAttempts - attemptsUsed) : null
  const isAttemptLimitReached = attemptsLeft === 0 && maxAttempts != null
  const shouldShowQuestions = retakeMode || (!submitted && !latestAttemptResult)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await submitTest(testId, {
        answers: Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [k, String(v)])
        )
      })
      setResult(response.data)
      setSubmitted(true)
      setRetakeMode(false)
      try {
        setMyAttempts(await fetchAttemptsForTest(testId))
      } catch {}
    } catch (err) {
      setError(err.response?.data?.message || t('testPage.loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="test-detail-loading">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (error && !test) {
    return <div className="test-detail-error">{error}</div>
  }

  if (!test) {
    return <div className="test-detail-error">{t('testPage.notFound')}</div>
  }

  const questions = test.questions || []
  const sortedQuestions = [...questions].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))

  return (
    <div className="test-detail">
      <div className="test-detail-header">
        <Link to={`/courses/${courseId}`} className="back-link">
          <FiArrowLeft /> {t('testPage.backToCourse')}
        </Link>
        <h1>{pickLocalized(test, 'title')}</h1>
        {course && (
          <p className="test-course-name">{t('testPage.coursePrefix')}: {pickLocalized(course, 'title')}</p>
        )}
      </div>

      {error && <div className="test-detail-error-banner">{error}</div>}

      {submitted && result ? (
        <div className="test-result">
          <div className="result-card">
            <FiCheckSquare className="result-icon" />
            <h2>{t('testPage.passed')}</h2>
            <p className="result-score">
              {result.score} / {result.maxScore} {t('testPage.points')}
            </p>
            <p className="result-percent">
              {result.maxScore > 0
                ? Math.round((result.score / result.maxScore) * 100)
                : 0}%
            </p>
            <Link to={`/courses/${courseId}`} className="btn btn-primary">
              {t('testPage.returnToCourse')}
            </Link>
          </div>
        </div>
      ) : !shouldShowQuestions && latestAttemptResult ? (
        <div className="test-result">
          <div className="result-card">
            <FiCheckSquare className="result-icon" />
            <h2>{t('testPage.lastResultTitle')}</h2>
            <p className="result-score">
              {latestAttemptResult.score} / {latestAttemptResult.maxScore} {t('testPage.points')}
            </p>
            <p className="result-percent">
              {latestAttemptResult.maxScore > 0
                ? Math.round((latestAttemptResult.score / latestAttemptResult.maxScore) * 100)
                : 0}%
            </p>
            <p className="test-attempts-hint">
              {maxAttempts != null
                ? t('testPage.attemptsUsedOf', { used: attemptsUsed, total: maxAttempts })
                : t('testPage.attemptsUsed', { used: attemptsUsed })}
            </p>
            <div className="test-result-actions">
              {isAttemptLimitReached ? (
                <div className="test-detail-error-banner" style={{ marginBottom: 0 }}>
                  {t('testPage.attemptLimitReached')}
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setAnswers({})
                    setError(null)
                    setResult(null)
                    setSubmitted(false)
                    setRetakeMode(true)
                  }}
                  disabled={attemptsLoading}
                >
                  {attemptsLoading ? t('common.loading') : t('testPage.tryAgain')}
                </button>
              )}
              <Link to={`/courses/${courseId}`} className="btn btn-outline">
                {t('testPage.returnToCourse')}
              </Link>
            </div>
          </div>
        </div>
      ) : !shouldShowQuestions && isAttemptLimitReached ? (
        <div className="test-detail-error-banner">{t('testPage.attemptLimitReached')}</div>
      ) : (
        <>
          {maxAttempts != null && (
            <div className="test-attempts-inline">
              {t('testPage.attemptsLeft', {
                left: attemptsLeft ?? 0,
                total: maxAttempts,
                used: attemptsUsed
              })}
            </div>
          )}
          <div className="test-questions">
            {sortedQuestions.map((q, idx) => (
              <div key={q.id} className="question-card">
                <h3 className="question-number">
                  {t('testPage.questionOf', { current: idx + 1, total: sortedQuestions.length })}
                </h3>
                <p className="question-text">{pickLocalized(q, 'text')}</p>
                <div className="question-options">
                  {q.type === 'MULTIPLE_CHOICE' || q.type === 'MULTIPLE_ANSWER' ? (
                    parseOptions(pickLocalized(q, 'options')).map((opt) => (
                      <label key={opt.key} className="option-label">
                        <input
                          type={q.type === 'MULTIPLE_ANSWER' ? 'checkbox' : 'radio'}
                          name={`q-${q.id}`}
                          value={opt.key}
                          checked={
                            q.type === 'MULTIPLE_ANSWER'
                              ? (answers[q.id] || '').split(',').includes(opt.key)
                              : answers[q.id] === opt.key
                          }
                          onChange={(e) => {
                            if (q.type === 'MULTIPLE_ANSWER') {
                              const current = (answers[q.id] || '').split(',').filter(Boolean)
                              const next = e.target.checked
                                ? [...current, opt.key]
                                : current.filter((x) => x !== opt.key)
                              handleAnswerChange(q.id, next.join(','))
                            } else {
                              handleAnswerChange(q.id, opt.key)
                            }
                          }}
                        />
                        <span>
                          {opt.key}. {opt.label}
                        </span>
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
                        <span>{t('testPage.true')}</span>
                      </label>
                      <label className="option-label">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value="false"
                          checked={answers[q.id] === 'false'}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        <span>{t('testPage.false')}</span>
                      </label>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="open-answer-input"
                      placeholder={t('testPage.enterAnswer')}
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
              disabled={submitting || isAttemptLimitReached}
            >
              {submitting ? t('testPage.submitting') : t('testPage.submit')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default TestDetail
