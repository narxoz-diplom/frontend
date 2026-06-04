import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiChevronRight, FiEye } from 'react-icons/fi'
import api from '../../services/api'
import { pickLocalized } from '../../i18n/localize'
import {
    fetchEnrolledCourses,
    fetchMyGrades,
    courseGradeStats,
} from '../../services/studentGradesApi'
import '../Courses.css'

function getCourseId(c) {
    return String(c?.id ?? c?.courseId ?? c?.uuid ?? '').trim()
}

export default function StudentGradesCourses() {
    const { t } = useTranslation()
    const [courses, setCourses] = useState([])
    const [grades, setGrades] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [courseViews, setCourseViews] = useState({})

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                const [enrolled, myGrades] = await Promise.all([
                    fetchEnrolledCourses(),
                    fetchMyGrades().catch(() => []),
                ])
                if (cancelled) return

                const list = Array.isArray(enrolled) ? enrolled : []
                setCourses(list)
                setGrades(myGrades)

                const viewsMap = {}
                for (const course of list) {
                    const id = getCourseId(course)
                    if (!id) continue
                    try {
                        const viewsResponse = await api.get(`/courses/${id}/views`)
                        viewsMap[id] = viewsResponse.data || 0
                    } catch {
                        viewsMap[id] = 0
                    }
                }
                if (!cancelled) setCourseViews(viewsMap)
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
    }, [t])

    const gradesByCourse = useMemo(() => {
        const map = new Map()
        for (const g of grades) {
            const id = g.courseId || ''
            if (!map.has(id)) map.set(id, [])
            map.get(id).push(g)
        }
        return map
    }, [grades])

    if (loading) {
        return <div className="loading">{t('coursesPage.loading')}</div>
    }

    return (
        <>
            {error && <div className="error">{error}</div>}

            <div className="courses-grid">
                {courses.length === 0 ? (
                    <p className="courses-empty">{t('studentGrades.noCourses')}</p>
                ) : (
                    courses.map((course) => {
                        const courseId = getCourseId(course)
                        const title = pickLocalized(course, 'title')
                        const courseGrades = gradesByCourse.get(courseId) || []
                        const { avgGrade, gradedCount } = courseGradeStats(courseGrades)

                        return (
                            <article key={courseId || course.id} className="course-card">
                                <div
                                    className={`course-card__media${
                                        course.imageUrl ? '' : ' course-card__media--placeholder'
                                    }`}
                                >
                                    {course.imageUrl ? (
                                        <img src={course.imageUrl} alt="" decoding="async" />
                                    ) : (
                                        <span className="course-card__media-fallback" aria-hidden>
                                            {String(title || course.title || '?').slice(0, 1)}
                                        </span>
                                    )}
                                </div>
                                <div className="course-card__body">
                                    <div className="course-card__head">
                                        <span
                                            className={`course-card__status course-card__status--${String(
                                                course.status || 'unknown'
                                            ).toLowerCase()}`}
                                        >
                                            {course.status || '—'}
                                        </span>
                                    </div>
                                    <h3 className="course-card__title">{title}</h3>
                                    <p className="course-card__description">
                                        {pickLocalized(course, 'description') ||
                                            t('coursesPage.noDescription')}
                                    </p>
                                    <div className="course-card__meta">
                                        {course.lessons && (
                                            <span className="course-card__stat">
                                                {course.lessons.length}{' '}
                                                {t('coursesPage.lessonsSuffix')}
                                            </span>
                                        )}
                                        {avgGrade !== null && (
                                            <span className="course-card__stat">
                                                {t('studentGrades.avgShort', { value: avgGrade })}
                                            </span>
                                        )}
                                        {gradedCount > 0 && (
                                            <span className="course-card__stat">
                                                {t('studentGrades.gradedLessons', {
                                                    count: gradedCount,
                                                })}
                                            </span>
                                        )}
                                        {courseViews[courseId] !== undefined && (
                                            <span className="course-card__stat course-card__stat--views">
                                                <FiEye aria-hidden /> {courseViews[courseId] || 0}
                                            </span>
                                        )}
                                    </div>
                                    <div className="course-card__footer">
                                        <div className="course-card__actions">
                                            <Link
                                                to={`/my/grades/${courseId}`}
                                                state={{ courseTitle: title }}
                                                className="course-card__btn course-card__btn--outline"
                                            >
                                                <span>{t('studentGrades.openCourse')}</span>
                                                <FiChevronRight
                                                    className="course-card__btn-icon"
                                                    aria-hidden
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })
                )}
            </div>
        </>
    )
}
