import React from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiBook, FiClipboard } from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import LessonCreateForm from './LessonCreateForm'
import LessonCard from './LessonCard'

const LessonsSection = ({
  courseId,
  previewMode,
  lessons,
  lessonFiles,
  lessonProgress,
  uploadingFile,
  highlightedLessonId,
  lessonRefs,
  showLessonForm,
  newLesson,
  onNewLessonChange,
  onOpenLessonForm,
  onCloseLessonForm,
  onCreateLesson,
  onUploadFile,
  onDownloadFile,
  onDeleteFile
}) => {
  const { t } = useTranslation()

  return (
    <section className="lessons-section course-panel">
      {previewMode ? (
        <div className="card empty-state course-page__preview-gate">
          <div className="empty-state-icon">
            <FiBook />
          </div>
          <p>{t('coursePage.previewLessonsHint')}</p>
        </div>
      ) : (
      <>
      <div className="lessons-header">
        <div className="course-section-head__text">
          <span className="course-section-head__eyebrow">{t('coursePage.program')}</span>
          <div className="lessons-header-titles">
            <h2>{t('coursePage.lessons')}</h2>
          {canUpload(auth) && (
            <p className="lessons-manage-hint">
              Удаление уроков и курса — в «Редактировать курс».
            </p>
          )}
        </div>
        </div>
        {canUpload(auth) && (
            <div className="course-management-controls">
              <Link to={`/courses/${courseId}/edit`} className="btn-edit">
                {t('coursePage.editCourse')}
              </Link>
              <Link to={`/courses/${courseId}/test-results`} className="btn-edit btn-edit--secondary">
                <FiClipboard aria-hidden /> {t('courseTestResults.navLink')}
              </Link>

              {!showLessonForm && (
                  <button
                      type="button"
                      className="btn btn-primary btn-add-lesson"
                      onClick={onOpenLessonForm}
                  >
                    <FiPlus /> {t('coursePage.addLesson')}
                  </button>
              )}
            </div>
        )}
      </div>

      {showLessonForm && (
        <LessonCreateForm
          lesson={newLesson}
          onChange={onNewLessonChange}
          onSubmit={onCreateLesson}
          onCancel={onCloseLessonForm}
        />
      )}

      {lessons.length === 0 && !showLessonForm && (
          <div className="card empty-state">
            <div className="empty-state-icon">
              <FiBook />
            </div>
            <p>
              {t('coursePage.emptyLessons')} {canUpload(auth) && t('coursePage.createFirstLesson')}
            </p>
          </div>
      )}

      {lessons.length > 0 && (
        <div className="lessons-list lessons-list--lms">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
              index={index}
              files={lessonFiles[lesson.id]}
              progress={lessonProgress[lesson.id] || { completed: false, progress: 0 }}
              uploading={uploadingFile?.[lesson.id]}
              highlighted={String(lesson.id) === highlightedLessonId}
              lessonRefs={lessonRefs}
              onUploadFile={onUploadFile}
              onDownloadFile={onDownloadFile}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
      </>
      )}
    </section>
  )
}

export default LessonsSection
