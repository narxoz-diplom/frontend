import React from 'react'
import { Link } from 'react-router-dom'
import { FiCheckSquare, FiTrash2, FiClipboard, FiUsers } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const CourseContentOverview = ({
  courseId,
  participants,
  lessons,
  selectedLessonIds,
  onToggleLesson,
  onDeleteLesson,
  tests,
  testMaxAttemptsDraft,
  testDueAtDraft,
  savingTestSettings,
  onMaxAttemptsChange,
  onDueAtChange,
  onSaveTestSettings
}) => {
  const { t } = useTranslation()

  return (
    <div className="gen-results">
      <div className="gen-results__head">
        <h3 className="gen-results__heading">{t('courseEdit.content')}</h3>
        <p className="gen-results__sub">{t('courseEdit.contentDesc')}</p>
      </div>
    <div className="course-sections">
      {participants && (
        <section className="course-section course-edit-participants">
          <div className="course-edit-participants__head">
            <h3>
              <FiUsers aria-hidden /> {t('coursePage.participantsTitle')}
            </h3>
            <p className="empty-hint">{t('coursePage.participantsSubtitle')}</p>
          </div>
          <div className="course-edit-participants__grid">
            <div>
              <div className="course-edit-participants__label">{t('coursePage.participantsInstructor')}</div>
              <code className="course-edit-participants__id">{participants.instructor?.userId}</code>
              {participants.instructor?.displayLabel && (
                <div className="course-edit-participants__email">{participants.instructor.displayLabel}</div>
              )}
            </div>
            <div>
              <div className="course-edit-participants__label">
                {t('coursePage.participantsStudents')} (
                {t('coursePage.participantsCount', { count: participants.studentCount ?? 0 })})
              </div>
              {(participants.students?.length ?? 0) === 0 ? (
                <p className="empty-hint">{t('coursePage.participantsEmptyStudents')}</p>
              ) : (
                <ul className="course-edit-participants__list">
                  {participants.students.map((s) => (
                    <li key={s.userId}>
                      <code>{s.userId}</code>
                      {s.displayLabel ? <span>{s.displayLabel}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
      <section className="course-section">
        <h3>{t('courseEdit.lessons')} ({lessons.length})</h3>
        {lessons.length === 0 ? (
          <p className="empty-hint">{t('courseEdit.noLessons')}</p>
        ) : (
          <div className="lessons-grid">
            {lessons.map((l) => (
              <div key={l.id} className="lesson-item">
                <label className="lesson-check">
                  <input
                    type="checkbox"
                    checked={selectedLessonIds.has(l.id)}
                    onChange={() => onToggleLesson(l.id)}
                  />
                  <Link to={`/courses/${courseId}/lessons/${l.id}`}>{l.title}</Link>
                </label>
                <button
                  type="button"
                  className="btn-icon danger lesson-delete-btn"
                  onClick={() => onDeleteLesson(l.id)}
                  title={t('courseEdit.deleteLessonTitle')}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="course-section">
        <div className="tests-section-head">
          <h3>{t('common.tests')} ({tests.length})</h3>
          <Link
            to={`/courses/${courseId}/test-results`}
            className="btn btn-outline tests-results-page-link"
          >
            <FiClipboard aria-hidden /> {t('courseEdit.testResultsTitle')}
          </Link>
        </div>
        {tests.length === 0 ? (
          <p className="empty-hint">{t('courseEdit.noTests')}</p>
        ) : (
          <div className="tests-grid">
            {tests.map((testItem) => (
              <div key={testItem.id} className="test-card">
                <Link to={`/courses/${courseId}/tests/${testItem.id}`} className="test-card-link-inner">
                  <FiCheckSquare />
                  <span>{testItem.title}</span>
                </Link>
                <div className="test-card-settings">
                  <label className="test-attempts-label">
                    {t('courseEdit.testMaxAttemptsLabel')}
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      className="test-attempts-input"
                      value={testMaxAttemptsDraft?.[testItem.id] ?? (testItem.maxAttempts == null ? '' : String(testItem.maxAttempts))}
                      placeholder={t('courseEdit.testMaxAttemptsUnlimited')}
                      onChange={(e) => onMaxAttemptsChange(testItem.id, e.target.value)}
                    />
                  </label>
                  <label className="test-attempts-label">
                    {t('courseEdit.testDeadlineLabel')}
                    <input
                      type="datetime-local"
                      className="test-attempts-input"
                      value={testDueAtDraft?.[testItem.id] ?? (testItem.dueAt ? String(testItem.dueAt).slice(0, 16) : '')}
                      onChange={(e) => onDueAtChange(testItem.id, e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => onSaveTestSettings(testItem.id)}
                    disabled={Boolean(savingTestSettings?.[testItem.id])}
                  >
                    {savingTestSettings?.[testItem.id]
                      ? t('common.loading')
                      : t('courseEdit.testMaxAttemptsSave')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
    </div>
  )
}

export default CourseContentOverview
