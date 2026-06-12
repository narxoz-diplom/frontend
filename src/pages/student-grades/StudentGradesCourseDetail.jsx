import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiClock } from 'react-icons/fi'
import {
    fetchGradesForCourse,
    groupGradesByModule,
    courseGradeStats,
    gradeLevel,
} from '@/shared/api/studentGradesApi'
import '@/pages/courses/Courses.css'
import '@/pages/courses/CourseDetail.css'

function formatDate(iso, lang) {
    if (!iso) return null
    try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return null
        const locale = lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU'
        return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
        return null
    }
}

export default function StudentGradesCourseDetail() {
    const { courseId } = useParams()
    const location = useLocation()
    const { t, i18n } = useTranslation()
    const courseTitle = location.state?.courseTitle

    const [grades, setGrades] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                const list = await fetchGradesForCourse(courseId)
                if (!cancelled) setGrades(list)
            } catch (e) {
                if (!cancelled) {
                    setError(
                        e?.response?.data?.message ||
                            e.message ||
                            t('studentGrades.loadError')
                    )
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [courseId, t])

    if (loading) {
        return <div className="loading">{t('coursesPage.loading')}</div>
    }

    const modules = groupGradesByModule(grades)
    const stats = courseGradeStats(grades)
    const displayTitle = courseTitle || grades[0]?.courseTitle || ''

    return (
        <div className="course-detail course-detail--v2">
            <header className="course-page__intro">
                <Link to="/my/grades" className="course-page__back">
                    <FiArrowLeft aria-hidden /> {t('studentGrades.backToList')}
                </Link>
                <p className="course-page__kicker">{t('nav.myGrades')}</p>
                {displayTitle ? (
                    <h1 className="course-page__title">{displayTitle}</h1>
                ) : null}
                {stats.gradedCount > 0 && (
                    <dl className="course-page__meta">
                        <div>
                            <dt>{t('studentGrades.totalGraded')}</dt>
                            <dd>{stats.gradedCount}</dd>
                        </div>
                        {stats.avgGrade !== null && (
                            <div>
                                <dt>{t('studentGrades.avgGrade')}</dt>
                                <dd style={{ color: gradeLevel(stats.avgGrade).color }}>
                                    {stats.avgGrade}
                                </dd>
                            </div>
                        )}
                    </dl>
                )}
            </header>

            {error && <div className="course-page__error error">{error}</div>}

            {grades.length === 0 ? (
                <p className="courses-empty">{t('studentGrades.emptyCourse')}</p>
            ) : (
                modules.map((mod) => {
                    const modTitle =
                        mod.moduleTitle ||
                        (mod.moduleId === 'default'
                            ? t('studentGrades.defaultModule')
                            : mod.moduleId)

                    return (
                        <section key={mod.moduleId} className="lessons-section course-panel">
                            <div className="lessons-header">
                                <div className="lessons-header-titles">
                                    <h2>{modTitle}</h2>
                                </div>
                            </div>
                            <div className="lessons-list lessons-list--lms">
                                {mod.grades.map((g, idx) => {
                                    const dateStr = formatDate(g.gradedAt, i18n.language)
                                    const { color, bg, label } = gradeLevel(g.grade)
                                    const hasFeedback = Boolean(g.feedback?.trim())

                                    return (
                                        <article
                                            key={`${g.lessonId}-${idx}`}
                                            className="lesson-card lesson-card--lms"
                                        >
                                            <div className="lesson-number" aria-hidden>
                                                <span className="lesson-number-text">
                                                    {idx + 1}
                                                </span>
                                            </div>
                                            <div className="lesson-content">
                                                <div className="lesson-header">
                                                    <h3 className="lesson-card__title">
                                                        {g.lessonTitle ||
                                                            `${t('common.lesson')} ${idx + 1}`}
                                                    </h3>
                                                    <span
                                                        className="lesson-completed-badge lesson-completed-badge--lms"
                                                        style={{
                                                            color,
                                                            background: bg,
                                                            border: `1px solid ${color}33`,
                                                        }}
                                                    >
                                                        {label}
                                                    </span>
                                                </div>
                                                {hasFeedback && (
                                                    <p className="lesson-description lesson-card__desc">
                                                        <strong>
                                                            {t('studentGrades.feedbackLabel')}:
                                                        </strong>{' '}
                                                        {g.feedback}
                                                    </p>
                                                )}
                                                {dateStr && (
                                                    <span className="course-card__stat">
                                                        <FiClock aria-hidden /> {dateStr}
                                                    </span>
                                                )}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </section>
                    )
                })
            )}
        </div>
    )
}
