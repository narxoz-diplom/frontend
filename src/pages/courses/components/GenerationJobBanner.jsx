import React from 'react'
import { FiCpu } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const GenerationJobBanner = ({ jobStatus, jobProgress }) => {
  const { t } = useTranslation()

  return (
    <div className={`gen-job-banner gen-job-banner--${(jobStatus || 'PENDING').toLowerCase()}`}>
      <div className="gen-job-banner__icon">
        <FiCpu className={jobStatus === 'COMPLETED' ? '' : 'spin'} aria-hidden />
      </div>
      <div className="gen-job-banner__body">
        <strong>
          {jobStatus === 'COMPLETED'
            ? t('courseEdit.generationDone')
            : jobStatus === 'FAILED'
              ? t('courseEdit.generationStopped')
              : t('courseEdit.generatingInBackground')}
        </strong>
        <span className="gen-job-banner__meta">
          {t('courseEdit.statusLabel')}: <code>{jobStatus || 'PENDING'}</code>
          {jobProgress != null &&
          jobProgress.total != null &&
          jobProgress.completed != null &&
          jobProgress.total > 0 ? (
            <>
              {' '}
              — уроки: {jobProgress.completed}/{jobProgress.total}
              {jobProgress.currentTitle
                ? ` («${jobProgress.currentTitle.slice(0, 60)}${jobProgress.currentTitle.length > 60 ? '…' : ''}»)`
                : ''}
            </>
          ) : null}
          {jobStatus === 'RUNNING' || jobStatus === 'PENDING'
            ? ' — после обновления страницы прогресс восстановится; уже созданные уроки остаются в курсе.'
            : null}
        </span>
      </div>
    </div>
  )
}

export default GenerationJobBanner
