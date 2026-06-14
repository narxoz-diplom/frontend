import React, { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getTest, submitTest, getMyTestAttempts } from '@/shared/api/testsApi'
import { getCourse } from '@/shared/api/coursesApi'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canEditCourseContent } from '@/shared/lib/roles'
import { PageHeader, Donut, Spinner, Icon } from '@/shared/ui/academis'
import { parseOptions } from './lib/testOptions'
import './TestDetail.css'
import './learning-academis.css'

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
    completedAt: a.completedAt ?? null,
  }
}

const scorePercent = (score, maxScore) => (maxScore > 0 ? Math.round((score / maxScore) * 100) : 0)

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
          getCourse(courseId),
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
  }, [courseId, testId, t])

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
          Object.entries(answers).map(([k, v]) => [k, String(v)]),
        ),
      })
      setResult(response.data)
      setSubmitted(true)
      setRetakeMode(false)
      try {
        setMyAttempts(await fetchAttemptsForTest(testId))
      } catch {
        /* ignore refresh failure */
      }
    } catch (err) {
      setError(err.response?.data?.message || t('testPage.loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page test-page test-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (error && !test) {
    return (
      <div className="page test-page">
        <div className="learning-flash learning-flash--error">{error}</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="page test-page">
        <div className="learning-flash learning-flash--error">{t('testPage.notFound')}</div>
      </div>
    )
  }

  if (canEditCourseContent(auth, course)) {
    return <Navigate to={`/courses/${courseId}/tests/${testId}/edit`} replace />
  }

  const questions = test.questions || []
  const sortedQuestions = [...questions].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
  const answeredCount = sortedQuestions.filter((q) => {
    const val = answers[q.id]
    return val != null && val !== ''
  }).length
  const answerProgress = sortedQuestions.length > 0
    ? Math.round((answeredCount / sortedQuestions.length) * 100)
    : 0
  const courseTitle = course ? (pickLocalized(course, 'title') || course.title) : ''

  const renderResultCard = (score, maxScore, title, hint, actions) => {
    const pct = scorePercent(score, maxScore)
    const passed = pct >= 60

    return (
      <div className="card card-pad result-card fade-up">
        <div className="result-ring">
          <Donut
            value={pct}
            size={150}
            stroke={14}
            color={passed ? 'var(--green-500)' : 'var(--brand)'}
            label={`${pct}%`}
            sub={`${score} / ${maxScore}`}
          />
        </div>
        <h2 className="h2" style={{ marginTop: 14 }}>
          {title}
        </h2>
        <p className="muted" style={{ marginTop: 4 }}>
          {score} / {maxScore} {t('testPage.points')}
        </p>
        {hint && (
          <p className="test-attempts-hint muted" style={{ marginTop: 8 }}>
            {hint}
          </p>
        )}
        <div className="row gap10 test-result-actions">{actions}</div>
      </div>
    )
  }

  const subtitleParts = [
    courseTitle,
    maxAttempts != null
      ? t('testPage.attemptsUsedOf', { used: attemptsUsed, total: maxAttempts })
      : null,
  ].filter(Boolean)

  return (
    <div className="page test-page">
      <PageHeader
        title={pickLocalized(test, 'title')}
        subtitle={subtitleParts.join(' · ')}
        back={`/courses/${courseId}`}
        breadcrumb={[
          { label: t('coursesPage.title'), to: '/courses' },
          { label: courseTitle, to: `/courses/${courseId}` },
          { label: t('testPage.coursePrefix') },
        ]}
      />

      {error && (
        <div className="learning-flash learning-flash--error" role="alert">
          {error}
        </div>
      )}

      {submitted && result ? (
        renderResultCard(
          result.score,
          result.maxScore,
          t('testPage.passed'),
          null,
          (
            <Link to={`/courses/${courseId}`} className="btn btn-primary">
              <Icon name="award" size={16} />
              {t('testPage.returnToCourse')}
            </Link>
          ),
        )
      ) : !shouldShowQuestions && latestAttemptResult ? (
        renderResultCard(
          latestAttemptResult.score,
          latestAttemptResult.maxScore,
          t('testPage.lastResultTitle'),
          maxAttempts != null
            ? t('testPage.attemptsUsedOf', { used: attemptsUsed, total: maxAttempts })
            : t('testPage.attemptsUsed', { used: attemptsUsed }),
          (
            <>
              {isAttemptLimitReached ? (
                <div className="learning-flash learning-flash--error" style={{ marginBottom: 0, width: '100%' }}>
                  {t('testPage.attemptLimitReached')}
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setAnswers({})
                    setError(null)
                    setResult(null)
                    setSubmitted(false)
                    setRetakeMode(true)
                  }}
                  disabled={attemptsLoading}
                >
                  <Icon name="refresh" size={16} />
                  {attemptsLoading ? t('common.loading') : t('testPage.tryAgain')}
                </button>
              )}
              <Link to={`/courses/${courseId}`} className="btn btn-primary">
                {t('testPage.returnToCourse')}
              </Link>
            </>
          ),
        )
      ) : !shouldShowQuestions && isAttemptLimitReached ? (
        <div className="learning-flash learning-flash--error">{t('testPage.attemptLimitReached')}</div>
      ) : (
        <div className="col gap14">
          <div className="quiz-progress">
            <div className="row between" style={{ marginBottom: 7, fontSize: 12.5, fontWeight: 600 }}>
              <span className="muted">
                {answeredCount} / {sortedQuestions.length}
              </span>
              <span style={{ color: 'var(--brand)', fontWeight: 800 }}>
                {answerProgress}%
              </span>
            </div>
            <div className="progress">
              <i style={{ width: `${answerProgress}%` }} />
            </div>
            {maxAttempts != null && (
              <p className="muted" style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600 }}>
                {t('testPage.attemptsLeft', {
                  left: attemptsLeft ?? 0,
                  total: maxAttempts,
                  used: attemptsUsed,
                })}
              </p>
            )}
          </div>

          {sortedQuestions.map((q, idx) => (
            <div key={q.id} className="card card-pad question-card">
              <div className="row gap10" style={{ marginBottom: 13 }}>
                <span className="q-num">{idx + 1}</span>
                <h3 className="h3" style={{ fontSize: 15.5, lineHeight: 1.4, fontWeight: 650, margin: 0 }}>
                  {pickLocalized(q, 'text')}
                </h3>
              </div>
              <div className="col gap8 question-options">
                {q.type === 'MULTIPLE_CHOICE' || q.type === 'MULTIPLE_ANSWER' ? (
                  parseOptions(pickLocalized(q, 'options')).map((opt) => {
                    const isSelected = q.type === 'MULTIPLE_ANSWER'
                      ? (answers[q.id] || '').split(',').includes(opt.key)
                      : answers[q.id] === opt.key

                    return (
                      <label
                        key={opt.key}
                        className={`quiz-opt option-label${isSelected ? ' sel' : ''}`}
                      >
                        <input
                          type={q.type === 'MULTIPLE_ANSWER' ? 'checkbox' : 'radio'}
                          name={`q-${q.id}`}
                          value={opt.key}
                          checked={isSelected}
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
                        <span style={{ fontSize: 14 }}>
                          {opt.key}. {opt.label}
                        </span>
                      </label>
                    )
                  })
                ) : q.type === 'TRUE_FALSE' ? (
                  <>
                    {['true', 'false'].map((val) => (
                      <label
                        key={val}
                        className={`quiz-opt option-label${answers[q.id] === val ? ' sel' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={val}
                          checked={answers[q.id] === val}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        <span>{val === 'true' ? t('testPage.true') : t('testPage.false')}</span>
                      </label>
                    ))}
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

          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={handleSubmit}
            disabled={submitting || isAttemptLimitReached || answeredCount < sortedQuestions.length}
          >
            {submitting ? (
              <Spinner size={18} color="#fff" />
            ) : (
              <Icon name="checkCircle" size={18} />
            )}
            {submitting
              ? t('testPage.submitting')
              : answeredCount < sortedQuestions.length
                ? t('testPage.questionOf', { current: answeredCount, total: sortedQuestions.length })
                : t('testPage.submit')}
          </button>
        </div>
      )}
    </div>
  )
}

export default TestDetail
