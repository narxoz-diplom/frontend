import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import { Icon, CourseCover, StatusBadge } from '@/shared/ui/academis'

export default function GradesCourseCard({
  course,
  to,
  state,
  actionLabel,
  index = 0,
  stats = [],
}) {
  const { t } = useTranslation()
  const title = pickLocalized(course, 'title') || course.title || ''
  const description = pickLocalized(course, 'description') || t('coursesPage.noDescription')
  const lessonsCount = course.lessonsCount ?? course.lessons?.length ?? 0

  return (
    <article
      className="card card-hover fade-up"
      style={{ overflow: 'hidden', animationDelay: `${index * 0.04}s` }}
    >
      <div style={{ position: 'relative' }}>
        <CourseCover course={course} image={course.imageUrl} height={138} radius={0} />
        {course.status && (
          <div style={{ position: 'absolute', top: 11, left: 11 }}>
            <StatusBadge status={course.status} />
          </div>
        )}
      </div>

      <div style={{ padding: 15 }}>
        <h3 className="h3 clamp-1" style={{ fontSize: 16, lineHeight: 1.25, marginBottom: 6 }}>
          {title}
        </h3>
        <p className="muted clamp-2" style={{ fontSize: 13, minHeight: 36 }}>
          {description}
        </p>

        <div
          className="row between wrap gap8"
          style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--border)' }}
        >
          <div className="row gap12 dim" style={{ fontSize: 12.5, fontWeight: 600, flexWrap: 'wrap' }}>
            {lessonsCount > 0 && (
              <span className="row gap4">
                <Icon name="book" size={14} />
                {lessonsCount} {t('coursesPage.lessonsSuffix')}
              </span>
            )}
            {stats.map((stat) => (
              <span key={stat.key} className="row gap4">
                {stat.icon && <Icon name={stat.icon} size={14} />}
                {stat.label}
              </span>
            ))}
          </div>

          <Link to={to} state={state} className="btn btn-sm btn-outline">
            <span>{actionLabel}</span>
            <Icon name="chevRight" size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}
