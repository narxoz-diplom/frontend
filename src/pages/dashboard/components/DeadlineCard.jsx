import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const DeadlineCard = ({ deadline }) => {
  const { t } = useTranslation()
  const due = deadline.dueAt ? new Date(deadline.dueAt) : null
  const day = due && !Number.isNaN(due.getTime()) ? due.getDate() : '—'
  const month = due && !Number.isNaN(due.getTime())
    ? due.toLocaleDateString(undefined, { month: 'short' })
    : ''
  const questionsCount = deadline.questionsCount ?? deadline.questionCount

  return (
    <Link
      to={`/courses/${deadline.courseId}/tests/${deadline.testId}`}
      className="deadline-row"
    >
      <div className="dl-date">
        <span style={{ fontSize: 17, fontWeight: 800 }}>{day}</span>
        <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>{month}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 650, fontSize: 13.5 }}>
          {deadline.testTitle || `#${deadline.testId}`}
        </div>
        <div className="dim" style={{ fontSize: 12 }}>
          {deadline.courseTitle || `#${deadline.courseId}`}
        </div>
      </div>
      {questionsCount != null && (
        <span className="badge badge-draft">
          {t('dashboard.home.questionsShort', { count: questionsCount })}
        </span>
      )}
    </Link>
  )
}

export default DeadlineCard
