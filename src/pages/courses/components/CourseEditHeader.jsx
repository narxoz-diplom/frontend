import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiLoader, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const backfillProgress = (job) =>
  job?.total
    ? ` (${Math.min(100, Math.round(((job?.processed || 0) / Math.max(1, job.total)) * 100))}%)`
    : ''

const CourseEditHeader = ({
  courseId,
  course,
  backfillSummary,
  backfillingLocales,
  backfillActiveLang,
  backfillJobId,
  backfillJob,
  onBackfill,
  deletingCourse,
  onDeleteCourse
}) => {
  const { t } = useTranslation()

  const backfillLabel = (lang, doneKey, idleKey) =>
    backfillActiveLang === lang && (backfillingLocales || backfillJobId)
      ? `${t('courseEdit.backfilling')}${backfillProgress(backfillJob)}`
      : backfillSummary[lang]?.missingTotal === 0 ? t(doneKey) : t(idleKey)

  return (
    <div className="course-edit-header">
      <Link to={`/courses/${courseId}`} className="back-link">
        <FiArrowLeft /> {t('courseEdit.backToCourse')}
      </Link>
      <div className="course-edit-title-row">
        <h1>{course.title}</h1>
        <button
          type="button"
          className="btn btn-secondary btn-trans"
          onClick={() => onBackfill('kz')}
          disabled={backfillingLocales || !!backfillJobId || (backfillSummary.kz?.missingTotal === 0)}
          title={t('courseEdit.backfillTitle')}
        >
          {backfillLabel('kz', 'courseEdit.backfillKzDone', 'courseEdit.backfillKz')}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-trans"
          onClick={() => onBackfill('en')}
          disabled={backfillingLocales || !!backfillJobId || (backfillSummary.en?.missingTotal === 0)}
          title={t('courseEdit.backfillTitle')}
        >
          {backfillLabel('en', 'courseEdit.backfillEnDone', 'courseEdit.backfillEn')}
        </button>
        <button
          type="button"
          className="btn btn-danger-outline"
          onClick={onDeleteCourse}
          disabled={deletingCourse}
          title={t('courseEdit.deleteForever')}
        >
          {deletingCourse ? (
            <>
              <FiLoader className="spin" /> {t('courseEdit.deleting')}
            </>
          ) : (
            <>
              <FiTrash2 /> {t('courseEdit.deleteCourse')}
            </>
          )}
        </button>
      </div>
      <p className="course-edit-description">{course.description}</p>
    </div>
  )
}

export default CourseEditHeader
