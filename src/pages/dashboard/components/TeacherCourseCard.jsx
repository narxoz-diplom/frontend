import React from 'react'
import { Link } from 'react-router-dom'
import { pickLocalized } from '@/i18n/localize'
import { Icon, CourseCover, StatusBadge } from '@/shared/ui/academis'

const TeacherCourseCard = ({ course }) => {
  const enrolledCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0

  return (
    <Link
      to={`/courses/${course.id}`}
      className="card card-hover course-card"
      style={{ overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}
    >
      <CourseCover course={course} height={96} radius={0} />
      <div style={{ padding: 13 }}>
        <div className="row between" style={{ marginBottom: 7 }}>
          <StatusBadge status={course.status} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.25 }}>
          {pickLocalized(course, 'title')}
        </div>
        <div className="row gap12 dim" style={{ fontSize: 12, marginTop: 8 }}>
          <span className="row gap4">
            <Icon name="book" size={13} />
            {course.lessonsCount ?? '—'}
          </span>
          {course.views != null && (
            <span className="row gap4">
              <Icon name="eye" size={13} />
              {course.views}
            </span>
          )}
          <span className="row gap4">
            <Icon name="users" size={13} />
            {enrolledCount}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default TeacherCourseCard
