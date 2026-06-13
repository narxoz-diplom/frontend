import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'

const GenerationJobBanner = ({ jobStatus, jobProgress }) => {
  const { t } = useTranslation()
  const status = (jobStatus || 'PENDING').toLowerCase()
  const isRunning = jobStatus === 'RUNNING' || jobStatus === 'PENDING'
  const progressPct =
    jobProgress?.total > 0
      ? Math.round((jobProgress.completed / jobProgress.total) * 100)
      : null

  return (
    <div className={`quota-banner gen-job-banner gen-job-banner--${status}`} role="status">
      <span className="qb-ic">
        {isRunning ? <Spinner size={18} color="#fff" /> : <Icon name="bolt" size={18} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {jobStatus === 'COMPLETED'
            ? t('courseEdit.generationDone')
            : jobStatus === 'FAILED'
              ? t('courseEdit.generationStopped')
              : t('courseEdit.generatingInBackground')}
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
          {t('courseEdit.statusLabel')}: <code>{jobStatus || 'PENDING'}</code>
          {progressPct != null && (
            <>
              {' '}
              — {jobProgress.completed}/{jobProgress.total}
              {jobProgress.currentTitle
                ? ` («${jobProgress.currentTitle.slice(0, 60)}${jobProgress.currentTitle.length > 60 ? '…' : ''}»)`
                : ''}
            </>
          )}
          {isRunning && (
            <span>
              {' '}
              — {t('courseEdit.generationJobPersistHint')}
            </span>
          )}
        </div>
        {progressPct != null && isRunning && (
          <div className="progress" style={{ marginTop: 8, maxWidth: 320 }}>
            <i style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerationJobBanner
