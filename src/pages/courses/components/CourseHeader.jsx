import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiEdit3, FiGlobe, FiArchive } from 'react-icons/fi'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'

const COURSE_STATUS_OPTIONS = [
  { value: 'DRAFT', labelKey: 'common.draft', Icon: FiEdit3 },
  { value: 'PUBLISHED', labelKey: 'dashboard.published', Icon: FiGlobe },
  { value: 'ARCHIVED', labelKey: 'common.archived', Icon: FiArchive }
]

const CourseHeader = ({
  course,
  statusLabel,
  canManageCourse,
  statusChanging,
  onStatusChange,
  previewMode,
  lessonsCount,
  testsCount,
  courseProgress,
  courseViews
}) => {
  const { t } = useTranslation()

  return (
    <header className="course-page__intro">
      <Link to="/courses" className="course-page__back">
        <FiArrowLeft aria-hidden /> {t('coursePage.backToCatalog')}
      </Link>
      {course.imageUrl && (
        <div className="course-page__cover-wrap">
          <img src={course.imageUrl} alt="" className="course-page__cover" decoding="async" />
        </div>
      )}
      <p className="course-page__kicker">{t('common.course')} · {statusLabel}</p>
      <div className="course-page__title-row">
        <h1 className="course-page__title">{pickLocalized(course, 'title')}</h1>
        <div className="course-page__status-block">
          {!canManageCourse && (
            <span className={`course-status course-status--pill ${course.status}`}>{statusLabel}</span>
          )}
          {canManageCourse && (
            <div
              className={`course-status-switcher ${statusChanging ? 'is-busy' : ''}`}
              role="group"
              aria-label={t('coursePage.changeStatusTitle')}
            >
              {COURSE_STATUS_OPTIONS.map(({ value, labelKey, Icon }) => {
                const active = course.status === value
                return (
                  <button
                    key={value}
                    type="button"
                    className={`course-status-switcher__btn course-status-switcher__btn--${value.toLowerCase()} ${active ? 'is-active' : ''}`}
                    onClick={() => onStatusChange(value)}
                    disabled={statusChanging}
                    aria-pressed={active}
                    title={t(labelKey)}
                  >
                    <Icon className="course-status-switcher__icon" aria-hidden />
                    <span className="course-status-switcher__label">{t(labelKey)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {pickLocalized(course, 'description') && <p className="course-page__lead">{pickLocalized(course, 'description')}</p>}
      {!previewMode ? (
        <dl className="course-page__meta">
          <div>
            <dt>{t('coursePage.lessons')}</dt>
            <dd>{lessonsCount}</dd>
          </div>
          <div>
            <dt>{t('coursePage.tests')}</dt>
            <dd>{testsCount}</dd>
          </div>
          {lessonsCount > 0 && (
            <div>
              <dt>{t('coursePage.progress')}</dt>
              <dd>{Math.round(courseProgress)}%</dd>
            </div>
          )}
          <div>
            <dt>{t('coursePage.views')}</dt>
            <dd>{courseViews}</dd>
          </div>
        </dl>
      ) : (
        <dl className="course-page__meta course-page__meta--preview">
          <div>
            <dt>{t('coursePage.views')}</dt>
            <dd>{courseViews}</dd>
          </div>
        </dl>
      )}
      {!previewMode && lessonsCount > 0 && (
        <div className="course-page__progress" aria-label={t('coursePage.progress')}>
          <div className="course-page__progress-track">
            <div className="course-page__progress-fill" style={{ width: `${courseProgress}%` }} />
          </div>
        </div>
      )}
    </header>
  )
}

export default CourseHeader
