import React from 'react'
import { FiPlus } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { MIN_LESSON_CONTENT_LENGTH } from '../hooks/useCourseDetail'

const LessonCreateForm = ({ lesson, onChange, onSubmit, onCancel }) => {
  const { t } = useTranslation()

  return (
    <div className="card create-lesson-form">
      <h3>{t('coursePage.createLesson')}</h3>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>{t('coursePage.lessonTitle')}</label>
          <input
            type="text"
            value={lesson.title}
            onChange={(e) => onChange({ ...lesson, title: e.target.value })}
            required
            placeholder={t('coursePage.lessonTitle')}
          />
        </div>
        <div className="form-group">
          <label>{t('coursePage.lessonDescription')}</label>
          <textarea
            value={lesson.description}
            onChange={(e) => onChange({ ...lesson, description: e.target.value })}
            rows="3"
            placeholder={t('coursePage.lessonDescription')}
          />
        </div>
        <div className="form-group">
          <label>{t('coursePage.lessonContent')}</label>
          <p id="lesson-content-hint" className="form-hint form-hint--lesson-content">
            {t('coursePage.lessonContentHint', { min: MIN_LESSON_CONTENT_LENGTH })}
          </p>
          <textarea
            value={lesson.content}
            onChange={(e) => onChange({ ...lesson, content: e.target.value })}
            rows="8"
            required
            minLength={MIN_LESSON_CONTENT_LENGTH}
            placeholder={t('coursePage.lessonContentPlaceholder')}
            aria-describedby="lesson-content-hint"
          />
        </div>
        <div className="form-group">
          <label>{t('coursePage.orderNumber')}</label>
          <input
            type="number"
            value={lesson.orderNumber}
            onChange={(e) => onChange({ ...lesson, orderNumber: parseInt(e.target.value) })}
            min="1"
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            <FiPlus /> {t('coursePage.createLesson')}
          </button>
          <button
            type="button"
            className="btn btn-cancel"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LessonCreateForm
