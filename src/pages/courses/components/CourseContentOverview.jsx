import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
import {
  estimateLessonMinutes,
  formatTestDueDateInput,
  lessonHasVideo,
  resolveTestQuestionCount,
} from '../lib/courseDetailUi'

const CourseContentOverview = ({
  courseId,
  lessons,
  selectedLessonIds,
  onToggleLesson,
  tests,
  testMaxAttemptsDraft,
  testDueAtDraft,
  savingTestSettings,
  onMaxAttemptsChange,
  onDueAtChange,
  onSaveTestSettings,
}) => {
  const { t } = useTranslation()

  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div className="sec-head">
        <div className="row gap8" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--brand)' }}>
            <Icon name="layers" size={18} />
          </span>
          <h3 className="h3">{t('studio.overview')}</h3>
        </div>
        <span className="dim" style={{ fontSize: 12.5 }}>
          {t('studio.overviewMeta', { lessons: lessons.length, tests: tests.length })}
        </span>
      </div>

      <div style={{ padding: '4px 18px 18px' }}>
        {lessons.length === 0 ? (
          <div className="outline-empty" style={{ padding: '24px 16px' }}>
            <Icon name="book" size={26} style={{ color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginTop: 6 }}>{t('studio.overviewEmptyTitle')}</div>
            <div className="dim" style={{ fontSize: 12.5 }}>{t('studio.overviewEmptyDesc')}</div>
          </div>
        ) : (
          <div className="col gap5">
            {lessons.map((lesson, index) => {
              const minutes = estimateLessonMinutes(lesson)
              const hasVideo = lessonHasVideo(lesson)
              return (
                <div key={lesson.id} className="ov-lesson">
                  <button
                    type="button"
                    className={`ctx-check${selectedLessonIds.has(lesson.id) ? ' on' : ''}`}
                    onClick={() => onToggleLesson(lesson.id)}
                    title={t('courseEdit.include')}
                    aria-pressed={selectedLessonIds.has(lesson.id)}
                  >
                    {selectedLessonIds.has(lesson.id) && <Icon name="check" size={12} />}
                  </button>
                  <span className="lesson-num" style={{ width: 24, height: 24, fontSize: 11 }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 650, fontSize: 13.5 }}>{lesson.title}</div>
                    <div className="dim" style={{ fontSize: 11.5 }}>
                      {t('studio.lessonDuration', { minutes })}
                      {hasVideo ? ` · ${t('studio.hasVideo')}` : ''}
                    </div>
                  </div>
                  <Link
                    to={`/courses/${courseId}/lessons/${lesson.id}`}
                    className="btn btn-sm btn-ghost"
                  >
                    {t('studio.openLesson')}
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {tests.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {t('coursePage.tests')}
            </div>
            <div className="col gap8">
              {tests.map((testItem) => {
                const questionCount = resolveTestQuestionCount(testItem)
                const dueDateValue =
                  testDueAtDraft?.[testItem.id] ?? formatTestDueDateInput(testItem.dueAt)
                const attemptsValue =
                  testMaxAttemptsDraft?.[testItem.id] ??
                  (testItem.maxAttempts == null ? '' : String(testItem.maxAttempts))
                const isSaving = Boolean(savingTestSettings?.[testItem.id])

                return (
                  <div key={testItem.id} className="ov-test">
                    <div className="ov-test-main">
                      <span className="test-ic" style={{ width: 32, height: 32 }}>
                        <Icon name="target" size={16} />
                      </span>
                      <div className="ov-test-info">
                        <Link
                          to={`/courses/${courseId}/tests/${testItem.id}`}
                          className="ov-test-title"
                        >
                          {testItem.title}
                        </Link>
                        <div className="dim ov-test-meta">
                          {questionCount != null
                            ? t('studio.testQuestionsCount', { count: questionCount })
                            : t('studio.testQuestionsUnknown')}
                        </div>
                      </div>
                      <Link
                        to={`/courses/${courseId}/tests/${testItem.id}`}
                        className="btn btn-sm btn-ghost ov-test-open"
                      >
                        {t('studio.openTest', { defaultValue: 'Открыть' })}
                      </Link>
                    </div>

                    <div className="ov-test-settings">
                      <div className="ov-test-field">
                        <label className="ov-test-label" htmlFor={`test-attempts-${testItem.id}`}>
                          {t('studio.testAttempts')}
                        </label>
                        <div className="ov-test-input-wrap">
                          <Icon name="refresh" size={14} className="ov-test-input-icon" />
                          <input
                            id={`test-attempts-${testItem.id}`}
                            className="ov-test-input"
                            type="number"
                            min="1"
                            value={attemptsValue}
                            placeholder={t('studio.testAttemptsUnlimited')}
                            onChange={(e) => onMaxAttemptsChange(testItem.id, e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="ov-test-field ov-test-field--date">
                        <label className="ov-test-label" htmlFor={`test-deadline-${testItem.id}`}>
                          {t('studio.testDeadline')}
                        </label>
                        <div className="ov-test-input-wrap">
                          <Icon name="calendar" size={14} className="ov-test-input-icon" />
                          <input
                            id={`test-deadline-${testItem.id}`}
                            className="ov-test-input ov-test-input--date"
                            type="date"
                            value={dueDateValue}
                            onChange={(e) => onDueAtChange(testItem.id, e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-primary ov-test-save"
                        onClick={() => onSaveTestSettings(testItem.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          t('common.loading')
                        ) : (
                          <>
                            <Icon name="check" size={14} />
                            {t('common.save')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseContentOverview
