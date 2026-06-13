import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  CourseCover,
  StatusBadge,
  Dropdown,
  Spinner,
} from '@/shared/ui/academis'
import { avatarInitials, statusI18nKey } from '../lib/courseDetailUi'

const STATUS_OPTIONS = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

const statusDotColor = (status) => {
  const value = String(status || '').toUpperCase()
  if (value === 'PUBLISHED') return 'var(--green-500)'
  if (value === 'DRAFT') return 'var(--amber-500)'
  return 'var(--text-3)'
}

const CourseHeader = ({
  course,
  courseId,
  canManageCourse,
  statusChanging,
  onStatusChange,
  previewMode,
  lessonsCount,
  courseProgress,
  courseViews,
  lessons,
  completedLessonsCount = 0,
  enrolling,
  onEnroll,
  instructorLabel,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const enrolledCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0
  const isPublished = String(course.status || '').toUpperCase() === 'PUBLISHED'
  const showProgress = (canManageCourse || !previewMode) && lessonsCount > 0
  const description = pickLocalized(course, 'description')

  const handleContinue = () => {
    const firstLesson = lessons[0]
    if (firstLesson) {
      navigate(`/courses/${courseId}/lessons/${firstLesson.id}`)
    }
  }

  return (
    <div className="course-hero card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ position: 'relative' }}>
        <CourseCover course={course} image={course.imageUrl} height={168} radius={0} big />
        <Link to="/courses" className="hero-back">
          <Icon name="chevLeft" size={16} />
          {t('nav.courses')}
        </Link>
      </div>

      <div style={{ padding: '18px 22px 22px' }}>
        <div className="row between wrap gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div className="row gap8 wrap" style={{ marginBottom: 9 }}>
              <StatusBadge status={course.status} />
              {course.level && <span className="badge">{course.level}</span>}
              {course.language && <span className="badge">{course.language}</span>}
            </div>

            <h1 className="h1" style={{ fontSize: 26 }}>
              {pickLocalized(course, 'title')}
            </h1>

            <p className="muted" style={{ marginTop: 7, maxWidth: 640, fontSize: 14 }}>
              {description || ''}
            </p>

            <div
              className="row gap16 dim"
              style={{ marginTop: 13, fontSize: 13, fontWeight: 600 }}
            >
              {instructorLabel && (
                <span className="row gap5">
                  <span className="avatar avatar-sm">{avatarInitials(instructorLabel)}</span>
                  {instructorLabel}
                </span>
              )}
              <span className="row gap4">
                <Icon name="book" size={14} />
                {lessonsCount} {t('common.lessonsCount')}
              </span>
              <span className="row gap4">
                <Icon name="users" size={14} />
                {enrolledCount}
              </span>
              <span className="row gap4">
                <Icon name="eye" size={14} />
                {courseViews ?? 0}
              </span>
            </div>
          </div>

          <div className="row gap10 wrap">
            {canManageCourse && (
              <>
                <Dropdown
                  trigger={(
                    <button type="button" className="btn btn-outline" disabled={statusChanging}>
                      <span
                        className="dot-status"
                        style={{ background: statusDotColor(course.status) }}
                      />
                      {t(statusI18nKey(course.status))}
                      <Icon name="chevDown" size={15} />
                    </button>
                  )}
                >
                  <div className="menu-label">{t('coursePage.changeStatusTitle')}</div>
                  {STATUS_OPTIONS.map((status) => (
                    <div
                      key={status}
                      role="button"
                      tabIndex={0}
                      className="menu-item"
                      onClick={() => !statusChanging && onStatusChange(status)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          if (!statusChanging) onStatusChange(status)
                        }
                      }}
                    >
                      <span
                        className="dot-status"
                        style={{ background: statusDotColor(status) }}
                      />
                      {t(statusI18nKey(status))}
                      {course.status === status && (
                        <span style={{ marginLeft: 'auto', color: 'var(--brand)' }}>
                          <Icon name="check" size={15} />
                        </span>
                      )}
                    </div>
                  ))}
                </Dropdown>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/courses/${courseId}/edit`)}
                >
                  <Icon name="sparkles" size={16} />
                  {t('coursePage.generationStudio')}
                </button>
              </>
            )}

            {!canManageCourse && !previewMode && (
              <button type="button" className="btn btn-primary" onClick={handleContinue}>
                <Icon name="play" size={15} />
                {t('common.continue')}
              </button>
            )}

            {previewMode && !canManageCourse && isPublished && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onEnroll}
                disabled={enrolling}
              >
                {enrolling ? (
                  <Spinner size={15} color="#fff" />
                ) : (
                  <Icon name="enroll" size={16} />
                )}
                {enrolling ? t('coursesPage.enrolling') : t('coursesPage.enrollCourse')}
              </button>
            )}
          </div>
        </div>

        {showProgress && (
          <div style={{ marginTop: 16 }}>
            <div
              className="row between"
              style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 600 }}
            >
              <span className="muted">
                {t('coursesPage.progress')} · {completedLessonsCount}/{lessonsCount}{' '}
                {t('common.lessonsCount')}
              </span>
              <span style={{ color: 'var(--brand)', fontWeight: 800 }}>
                {Math.round(courseProgress)}%
              </span>
            </div>
            <div className="progress">
              <i style={{ width: `${courseProgress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseHeader
