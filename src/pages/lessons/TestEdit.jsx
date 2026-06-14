import React, { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canEditCourseContent } from '@/shared/lib/roles'
import { getCourse } from '@/shared/api/coursesApi'
import { getTest, updateTest } from '@/shared/api/testsApi'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { pickLocalized } from '@/i18n/localize'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import {
  addOptionToQuestion,
  createEmptyQuestionDraft,
  draftToUpdatePayload,
  removeOptionFromQuestion,
  testToDraft,
  validateTestDraft,
} from './lib/testDraft'
import './TestEdit.css'
import './learning-academis.css'

const TestEdit = () => {
  const { t } = useTranslation()
  const { courseId, testId } = useParams()
  const [test, setTest] = useState(null)
  const [course, setCourse] = useState(null)
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [testRes, courseRes] = await Promise.all([
          getTest(testId),
          getCourse(courseId),
        ])
        const coursePayload = normalizeCourseViewerResponse(courseRes.data).course
        setTest(testRes.data)
        setCourse(coursePayload)
        setDraft(testToDraft(testRes.data))
        setError(null)
      } catch {
        setError(t('testEditPage.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, testId, t])

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setSaved(false)
  }

  const updateQuestion = (localId, patch) => {
    setDraft((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q) => (
        q.localId === localId ? { ...q, ...patch } : q
      )),
    }))
    setSaved(false)
  }

  const updateQuestionOption = (localId, optionKey, label) => {
    setDraft((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q) => {
        if (q.localId !== localId) return q
        return {
          ...q,
          options: (q.options || []).map((opt) => (
            opt.key === optionKey ? { ...opt, label } : opt
          )),
        }
      }),
    }))
    setSaved(false)
  }

  const addQuestion = () => {
    setDraft((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), createEmptyQuestionDraft((prev.questions?.length ?? 0) + 1)],
    }))
    setSaved(false)
  }

  const removeQuestion = (localId) => {
    setDraft((prev) => {
      const next = (prev.questions || []).filter((q) => q.localId !== localId)
      return {
        ...prev,
        questions: next.length > 0 ? next : [createEmptyQuestionDraft()],
      }
    })
    setSaved(false)
  }

  const handleSave = async () => {
    const validationError = validateTestDraft(draft, t)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const response = await updateTest(testId, draftToUpdatePayload(draft))
      setTest(response.data)
      setDraft(testToDraft(response.data))
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message || t('testEditPage.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page test-edit-page test-edit-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (!course || !test || !draft) {
    return (
      <div className="page test-edit-page">
        <div className="learning-flash learning-flash--error">{error || t('testEditPage.notFound')}</div>
      </div>
    )
  }

  if (!canEditCourseContent(auth, course)) {
    return <Navigate to={`/courses/${courseId}/tests/${testId}`} replace />
  }

  const courseTitle = pickLocalized(course, 'title') || course.title || ''

  return (
    <div className="page test-edit-page">
      <PageHeader
        title={t('testEditPage.title')}
        subtitle={pickLocalized(test, 'title') || test.title}
        back={`/courses/${courseId}/edit`}
        breadcrumb={[
          { label: t('coursesPage.title'), to: '/courses' },
          { label: courseTitle, to: `/courses/${courseId}/edit` },
          { label: t('testEditPage.breadcrumb') },
        ]}
        actions={(
          <div className="row gap8 wrap">
            {saved && (
              <span className="badge badge-published row gap4">
                <Icon name="check" size={12} />
                {t('testEditPage.saved')}
              </span>
            )}
            <Link to={`/courses/${courseId}/edit`} className="btn btn-outline btn-sm">
              {t('testEditPage.backToStudio')}
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Spinner size={16} color="#fff" /> : <Icon name="check" size={16} />}
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        )}
      />

      {error && (
        <div className="learning-flash learning-flash--error" role="alert">
          {error}
        </div>
      )}

      <div className="card card-pad test-edit-settings">
        <h2 className="h3">{t('testEditPage.settingsTitle')}</h2>
        <div className="test-edit-settings-grid">
          <label className="test-edit-field">
            <span className="test-edit-label">{t('studio.testTitle')}</span>
            <input
              className="test-edit-input"
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder={t('studio.testTitle')}
            />
          </label>

          <label className="test-edit-field">
            <span className="test-edit-label">{t('studio.testAttempts')}</span>
            <input
              className="test-edit-input"
              type="number"
              min="1"
              value={draft.maxAttempts}
              placeholder={t('studio.testAttemptsUnlimited')}
              onChange={(e) => updateDraft({ maxAttempts: e.target.value })}
            />
          </label>

          <label className="test-edit-field">
            <span className="test-edit-label">{t('studio.testDeadline')}</span>
            <input
              className="test-edit-input"
              type="date"
              value={draft.dueAt}
              onChange={(e) => updateDraft({ dueAt: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="row between wrap gap12 test-edit-questions-head">
        <div>
          <h2 className="h3">{t('testEditPage.questionsTitle')}</h2>
          <p className="muted test-edit-hint">{t('testEditPage.questionsHint')}</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={addQuestion}>
          <Icon name="plus" size={14} />
          {t('testEditPage.addQuestion')}
        </button>
      </div>

      <div className="col gap14">
        {(draft.questions || []).map((question, idx) => (
          <div key={question.localId} className="card card-pad test-edit-question">
            <div className="row between gap12 test-edit-question-head">
              <div className="row gap10">
                <span className="q-num">{idx + 1}</span>
                <h3 className="h3" style={{ margin: 0, fontSize: 15 }}>
                  {t('testEditPage.questionLabel', { number: idx + 1 })}
                </h3>
              </div>
              {(draft.questions?.length ?? 0) > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost test-edit-remove"
                  onClick={() => removeQuestion(question.localId)}
                >
                  <Icon name="trash" size={14} />
                  {t('common.delete')}
                </button>
              )}
            </div>

            <label className="test-edit-field">
              <span className="test-edit-label">{t('testEditPage.questionText')}</span>
              <textarea
                className="test-edit-textarea"
                rows={3}
                value={question.text}
                onChange={(e) => updateQuestion(question.localId, { text: e.target.value })}
                placeholder={t('testEditPage.questionText')}
              />
            </label>

            <div className="test-edit-options">
              <div className="row between gap8">
                <span className="test-edit-label">{t('testEditPage.optionsTitle')}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => updateQuestion(question.localId, addOptionToQuestion(question))}
                >
                  <Icon name="plus" size={14} />
                  {t('testEditPage.addOption')}
                </button>
              </div>

              <div className="col gap8">
                {(question.options || []).map((opt) => (
                  <div key={opt.key} className="test-edit-option-row">
                    <label className="test-edit-correct">
                      <input
                        type="radio"
                        name={`correct-${question.localId}`}
                        checked={question.correctAnswer === opt.key}
                        onChange={() => updateQuestion(question.localId, { correctAnswer: opt.key })}
                      />
                      <span className="test-edit-option-key">{opt.key}</span>
                    </label>
                    <input
                      className="test-edit-input"
                      value={opt.label}
                      onChange={(e) => updateQuestionOption(question.localId, opt.key, e.target.value)}
                      placeholder={t('testEditPage.optionPlaceholder', { key: opt.key })}
                    />
                    {(question.options?.length ?? 0) > 2 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => updateQuestion(question.localId, removeOptionFromQuestion(question, opt.key))}
                        aria-label={t('common.delete')}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="test-edit-extra-grid">
              <label className="test-edit-field">
                <span className="test-edit-label">{t('testEditPage.explanation')}</span>
                <textarea
                  className="test-edit-textarea"
                  rows={2}
                  value={question.explanation}
                  onChange={(e) => updateQuestion(question.localId, { explanation: e.target.value })}
                  placeholder={t('testEditPage.explanation')}
                />
              </label>
              <label className="test-edit-field">
                <span className="test-edit-label">{t('testEditPage.hint')}</span>
                <textarea
                  className="test-edit-textarea"
                  rows={2}
                  value={question.hint}
                  onChange={(e) => updateQuestion(question.localId, { hint: e.target.value })}
                  placeholder={t('testEditPage.hint')}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="test-edit-footer">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Spinner size={18} color="#fff" /> : <Icon name="check" size={18} />}
          {saving ? t('common.loading') : t('testEditPage.saveTest')}
        </button>
      </div>
    </div>
  )
}

export default TestEdit
