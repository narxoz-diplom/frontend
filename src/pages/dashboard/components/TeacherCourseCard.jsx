import React from 'react'
import { Link } from 'react-router-dom'
import { FiEdit, FiEye, FiFileText } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'

const TeacherCourseCard = ({ course }) => {
    const { t } = useTranslation()

    const statusBadgeClasses = {
        PUBLISHED: 'course-status-badge--published',
        DRAFT: 'course-status-badge--draft',
        ARCHIVED: 'course-status-badge--archived',
    }

    const statusLabels = {
        PUBLISHED: t('dashboard.published'),
        DRAFT: t('dashboard.statusDraft'),
        ARCHIVED: t('dashboard.statusArchived'),
    }

    const badgeClass = statusBadgeClasses[course.status] || 'course-status-badge--muted'
    const statusLabel = statusLabels[course.status] ?? course.status ?? '—'

    return (
        <div className="course-card course-card--lms">
            <div className="course-card-body">
                <span className={`course-status-badge ${badgeClass}`}>
                    {statusLabel}
                </span>

                <h3 className="course-title">{pickLocalized(course, 'title')}</h3>

                <p className="course-desc">
                    {pickLocalized(course, 'description') || t('dashboard.noDescription')}
                </p>
            </div>

            <div className="course-card-footer">
                <div className="course-meta">
                    <span className="course-meta-item">
                        <FiFileText size={13} />
                        {course.lessonsCount ?? '—'} {t('dashboard.lessonsCountSuffix')}
                    </span>
                </div>
                <div className="course-card-actions">
                    <Link
                        to={`/courses/${course.id}`}
                        className="course-action-btn"
                        title={t('common.view')}
                    >
                        <FiEye size={15} />
                    </Link>
                    <Link
                        to={`/courses/${course.id}/edit`}
                        className="course-action-btn primary"
                        title={t('common.edit')}
                    >
                        <FiEdit size={15} />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default TeacherCourseCard
