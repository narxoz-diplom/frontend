import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'

const backfillProgress = (job) =>
  job?.total
    ? ` (${Math.min(100, Math.round(((job?.processed || 0) / Math.max(1, job.total)) * 100))}%)`
    : ''

const CourseEditHeader = ({
  courseId,
  backfillSummary,
  backfillingLocales,
  backfillActiveLang,
  backfillJobId,
  backfillJob,
  onBackfill,
  deletingCourse,
  onDeleteCourse,
}) => {
  const { t } = useTranslation()

  const backfillLabel = (lang, doneKey, idleKey) =>
    backfillActiveLang === lang && (backfillingLocales || backfillJobId)
      ? `${t('courseEdit.backfilling')}${backfillProgress(backfillJob)}`
      : backfillSummary[lang]?.missingTotal === 0
        ? t(doneKey)
        : t(idleKey)

  return (
    <>
      <div className="row between wrap gap12" style={{ marginBottom: 4 }}>
        <div>
          <div className="row gap8" style={{ alignItems: 'center' }}>
            <span className="studio-badge">
              <Icon name="sparkles" size={15} />
              AI Studio
            </span>
            <h1 className="h1" style={{ fontSize: 23, margin: 0 }}>
              {t('studio.title')}
            </h1>
          </div>
          <p className="muted" style={{ marginTop: 4, fontSize: 13.5 }}>
            {t('studio.subtitle')}
          </p>
        </div>
        <Link to={`/courses/${courseId}`} className="btn btn-outline">
          <Icon name="eye" size={16} />
          {t('studio.preview')}
        </Link>
      </div>

      <div className="studio-admin-actions row gap8 wrap">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onBackfill('kz')}
          disabled={backfillingLocales || !!backfillJobId || backfillSummary.kz?.missingTotal === 0}
          title={t('courseEdit.backfillTitle')}
        >
          {backfillLabel('kz', 'courseEdit.backfillKzDone', 'courseEdit.backfillKz')}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onBackfill('en')}
          disabled={backfillingLocales || !!backfillJobId || backfillSummary.en?.missingTotal === 0}
          title={t('courseEdit.backfillTitle')}
        >
          {backfillLabel('en', 'courseEdit.backfillEnDone', 'courseEdit.backfillEn')}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm studio-admin-actions__danger"
          onClick={onDeleteCourse}
          disabled={deletingCourse}
          title={t('courseEdit.deleteForever')}
        >
          {deletingCourse ? (
            <>
              <Spinner size={14} />
              {t('courseEdit.deleting')}
            </>
          ) : (
            <>
              <Icon name="trash" size={14} />
              {t('courseEdit.deleteCourse')}
            </>
          )}
        </button>
      </div>
    </>
  )
}

export default CourseEditHeader
