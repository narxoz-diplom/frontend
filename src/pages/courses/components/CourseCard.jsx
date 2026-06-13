import React from 'react'
import { useNavigate } from 'react-router-dom'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { Icon, CourseCover, StatusBadge, Spinner } from '@/shared/ui/academis'

const CourseCard = ({
  course,
  views,
  canEnroll,
  enrolled,
  enrolling,
  canDelete,
  deleting,
  onEnroll,
  onDelete,
  index = 0,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isTeacher = canUpload(auth)
  const lessonsCount = course.lessonsCount ?? course.lessons?.length ?? 0
  const enrolledCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0
  const isPublished = String(course.status || '').toUpperCase() === 'PUBLISHED'

  const handleCardClick = () => {
    navigate(`/courses/${course.id}`)
  }

  const handleEdit = (event) => {
    event.stopPropagation()
    navigate(`/courses/${course.id}/edit`)
  }

  const handleEnroll = (event) => {
    event.stopPropagation()
    onEnroll(course.id)
  }

  const handleDelete = (event) => {
    event.stopPropagation()
    onDelete(course)
  }

  return (
    <div
      className="card card-hover course-card fade-up"
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
        animationDelay: `${index * 0.04}s`,
      }}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      role="link"
      tabIndex={0}
    >
      <div style={{ position: 'relative' }}>
        <CourseCover course={course} image={course.imageUrl} height={138} radius={0} />
        <div style={{ position: 'absolute', top: 11, left: 11 }}>
          <StatusBadge status={course.status} />
        </div>
        {isTeacher && (
          <button
            type="button"
            className="cover-edit"
            onClick={handleEdit}
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <Icon name="edit" size={15} />
          </button>
        )}
      </div>

      <div style={{ padding: 15 }}>
        <h3 className="h3" style={{ fontSize: 16, lineHeight: 1.25, marginBottom: 6 }}>
          {pickLocalized(course, 'title')}
        </h3>
        <p className="muted clamp-2" style={{ fontSize: 13, minHeight: 36 }}>
          {pickLocalized(course, 'description') || t('coursesPage.noDescription')}
        </p>

        <div
          className="row between"
          style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--border)' }}
        >
          <div className="row gap12 dim" style={{ fontSize: 12.5, fontWeight: 600 }}>
            <span className="row gap4">
              <Icon name="book" size={14} />
              {lessonsCount}
            </span>
            <span className="row gap4">
              <Icon name="eye" size={14} />
              {views ?? 0}
            </span>
            {isTeacher && (
              <span className="row gap4">
                <Icon name="users" size={14} />
                {enrolledCount}
              </span>
            )}
          </div>

          <div className="row gap8" style={{ alignItems: 'center' }}>
            {canEnroll && (
              enrolled ? (
                <span className="badge badge-published">
                  <Icon name="check" size={13} />
                  {t('coursesPage.enrolled')}
                </span>
              ) : isPublished ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <Spinner size={13} color="#fff" />
                  ) : (
                    <Icon name="enroll" size={14} />
                  )}
                  {enrolling ? t('coursesPage.enrolling') : t('coursesPage.enroll')}
                </button>
              ) : null
            )}
            {canDelete && (
              <button
                type="button"
                className="btn btn-icon btn-ghost btn-sm"
                onClick={handleDelete}
                disabled={deleting}
                title={t('coursesPage.deleteCourse')}
                aria-label={t('coursesPage.deleteCourse')}
              >
                {deleting ? <Spinner size={14} /> : <Icon name="trash" size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCard
