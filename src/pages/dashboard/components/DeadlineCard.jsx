import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const formatDueAt = (iso) => {
    if (!iso) return '—'
    try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return iso
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    } catch {
        return iso
    }
}

const DeadlineCard = ({ deadline }) => {
    const { t } = useTranslation()

    return (
        <Link
            to={`/courses/${deadline.courseId}/tests/${deadline.testId}`}
            className="deadline-card"
        >
            <div className="deadline-card__meta">
                <div className="deadline-card__course">
                    <span className="deadline-card__label">{t('dashboard.upcomingDeadlinesCourse')}</span>
                    <span className="deadline-card__value">{deadline.courseTitle || `#${deadline.courseId}`}</span>
                </div>
                <div className="deadline-card__test">
                    <span className="deadline-card__label">{t('dashboard.upcomingDeadlinesTest')}</span>
                    <span className="deadline-card__value">{deadline.testTitle || `#${deadline.testId}`}</span>
                </div>
            </div>
            <div className="deadline-card__due">
                <span className="deadline-card__label">{t('dashboard.upcomingDeadlinesDue')}</span>
                <span className="deadline-card__dueValue">{formatDueAt(deadline.dueAt)}</span>
            </div>
        </Link>
    )
}

export default DeadlineCard
