import React from 'react'
import { useNavigate } from 'react-router-dom'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import { Icon, CourseCover, StatusBadge } from '@/shared/ui/academis'

const CourseListRow = ({ course, views, last }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const enrolledCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0
  const lessonsCount = course.lessonsCount ?? course.lessons?.length ?? 0

  return (
    <div
      className="course-lrow"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
      onClick={() => navigate(`/courses/${course.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/courses/${course.id}`)}
      role="link"
      tabIndex={0}
    >
      <CourseCover course={course} image={course.imageUrl} height={52} width={52} radius={12} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row gap8" style={{ alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 14.5 }}>
            {pickLocalized(course, 'title')}
          </span>
          <StatusBadge status={course.status} />
        </div>
        <div className="muted clamp-1" style={{ fontSize: 12.5 }}>
          {pickLocalized(course, 'description') || t('coursesPage.noDescription')}
        </div>
      </div>
      <div className="row gap16 dim" style={{ fontSize: 12.5, fontWeight: 600 }}>
        <span className="row gap4">
          <Icon name="book" size={14} />
          {lessonsCount}
        </span>
        <span className="row gap4">
          <Icon name="eye" size={14} />
          {views ?? 0}
        </span>
        <span className="row gap4">
          <Icon name="users" size={14} />
          {enrolledCount}
        </span>
      </div>
      <Icon name="chevRight" size={18} style={{ color: 'var(--text-3)' }} />
    </div>
  )
}

export default CourseListRow
