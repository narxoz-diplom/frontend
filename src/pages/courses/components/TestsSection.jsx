import React from 'react'
import { useNavigate } from 'react-router-dom'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import { SectionCard, Icon } from '@/shared/ui/academis'
import { resolveTestQuestionCount } from '../lib/courseDetailUi'

const formatDeadline = (iso) => {
  if (!iso) return null
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  } catch {
    return null
  }
}

const TestsSection = ({
  courseId,
  previewMode,
  canViewContent = !previewMode,
  canEditTests = false,
  tests,
  highlightedTestId,
  testRefs,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (tests.length === 0) {
    return null
  }

  const openTest = (testId) => {
    if (canEditTests) {
      navigate(`/courses/${courseId}/tests/${testId}/edit`)
      return
    }
    if (canViewContent) {
      navigate(`/courses/${courseId}/tests/${testId}`)
    }
  }

  return (
    <SectionCard title={t('coursePage.tests')} icon="target">
      <div className="col gap8">
        {tests.map((test) => {
          const deadlineLabel = formatDeadline(test.dueAt || test.deadline)
          const bestScore = test.bestScore ?? test.lastScorePercent
          const questionsCount = resolveTestQuestionCount(test)

          return (
            <div
              key={test.id}
              ref={(node) => {
                if (node) testRefs.current[test.id] = node
                else delete testRefs.current[test.id]
              }}
              className={`test-row${String(test.id) === highlightedTestId ? ' test-card-link--search-hit' : ''}`}
              onClick={() => openTest(test.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openTest(test.id)
                }
              }}
              role="button"
              tabIndex={canEditTests || canViewContent ? 0 : -1}
              style={canEditTests || canViewContent ? undefined : { cursor: 'default', opacity: 0.75 }}
            >
              <span className="test-ic">
                <Icon name="target" size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650, fontSize: 14 }}>
                  {pickLocalized(test, 'title')}
                </div>
                <div className="row gap10 dim" style={{ fontSize: 12, marginTop: 2 }}>
                  {questionsCount != null && (
                    <span>
                      {t('studio.testQuestionsCount', { count: questionsCount })}
                    </span>
                  )}
                  {test.maxAttempts != null && (
                    <span>
                      · {t('coursePage.maxAttempts', { count: test.maxAttempts })}
                    </span>
                  )}
                  {deadlineLabel && (
                    <span className="row gap3">
                      <Icon name="calendar" size={12} />
                      {deadlineLabel}
                    </span>
                  )}
                </div>
              </div>
              {bestScore != null && (
                <span className="badge badge-published">{bestScore}%</span>
              )}
              <Icon
                name={canEditTests ? 'edit' : canViewContent ? 'chevRight' : 'lock'}
                size={16}
                style={{ color: 'var(--text-3)' }}
              />
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export default TestsSection
