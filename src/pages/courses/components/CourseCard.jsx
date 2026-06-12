import React from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiTrash2, FiUserPlus, FiCheckCircle, FiChevronRight } from 'react-icons/fi'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'

const CourseCard = ({
  course,
  views,
  canEnroll,
  enrolled,
  enrolling,
  canDelete,
  deleting,
  onEnroll,
  onDelete
}) => {
  const { t } = useTranslation()

  return (
    <article className="course-card">
      <div className={`course-card__media${course.imageUrl ? '' : ' course-card__media--placeholder'}`}>
        {course.imageUrl ? (
          <img src={course.imageUrl} alt="" decoding="async" />
        ) : (
          <span className="course-card__media-fallback" aria-hidden>
            {String(pickLocalized(course, 'title') || course.title || '?').slice(0, 1)}
          </span>
        )}
      </div>
      <div className="course-card__body">
        <div className="course-card__head">
          <span
            className={`course-card__status course-card__status--${String(course.status || 'unknown').toLowerCase()}`}
          >
            {course.status || '—'}
          </span>
        </div>
        <h3 className="course-card__title">{pickLocalized(course, 'title')}</h3>
        <p className="course-card__description">
          {pickLocalized(course, 'description') || t('coursesPage.noDescription')}
        </p>
        <div className="course-card__meta">
          {course.lessons && (
            <span className="course-card__stat">
              {course.lessons.length} {t('coursesPage.lessonsSuffix')}
            </span>
          )}
          {views !== undefined && (
            <span className="course-card__stat course-card__stat--views">
              <FiEye aria-hidden /> {views || 0}
            </span>
          )}
        </div>
        <div className="course-card__footer">
          <div className="course-card__actions">
            <Link to={`/courses/${course.id}`} className="course-card__btn course-card__btn--outline">
              <span>{t('coursesPage.viewCourse')}</span>
              <FiChevronRight className="course-card__btn-icon" aria-hidden />
            </Link>
            {canEnroll && (
              enrolled ? (
                <span className="course-card__enrolled-pill" title={t('coursesPage.alreadyEnrolled')}>
                  <FiCheckCircle aria-hidden />
                  {t('coursesPage.enrolled')}
                </span>
              ) : (
                <button
                  type="button"
                  className="course-card__btn course-card__btn--enroll"
                  onClick={() => onEnroll(course.id)}
                  disabled={enrolling}
                  title={t('coursesPage.enrollCourse')}
                >
                  {enrolling ? (
                    t('coursesPage.enrolling')
                  ) : (
                    <>
                      <FiUserPlus className="course-card__btn-icon course-card__btn-icon--left" aria-hidden />
                      {t('coursesPage.enroll')}
                    </>
                  )}
                </button>
              )
            )}
          </div>
          {canDelete && (
            <button
              type="button"
              className="course-card__icon-btn"
              onClick={() => onDelete(course)}
              disabled={deleting}
              title={t('coursesPage.deleteCourse')}
            >
              {deleting ? '…' : <FiTrash2 aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default CourseCard
