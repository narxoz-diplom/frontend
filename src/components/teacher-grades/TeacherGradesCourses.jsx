import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiChevronRight, FiUsers } from 'react-icons/fi'
import { pickLocalized } from '../../i18n/localize'
import { fetchTeacherCourses } from '../../services/teacherGradesApi'
import { resolveApiError } from '../../utils/apiError'
import '../Courses.css'

function SkeletonGrid() {
    return (
        <div className="courses-grid" aria-busy="true">
            {[1, 2, 3].map((i) => (
                <article key={i} className="course-card tg-course-card--skeleton" aria-hidden>
                    <div className="course-card__media course-card__media--placeholder">
                        <span className="tg-skel-pill" />
                    </div>
                    <div className="course-card__body">
                        <div className="tg-skel-line tg-skel-line--lg" />
                        <div className="tg-skel-line" />
                        <div className="tg-skel-line tg-skel-line--sm" />
                    </div>
                </article>
            ))}
        </div>
    )
}

export default function TeacherGradesCourses() {
    const { t } = useTranslation()
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError('')
            try {
                const { courses: list } = await fetchTeacherCourses()
                if (!cancelled) setCourses(list || [])
            } catch (e) {
                if (!cancelled) {
                    console.error('Teacher grades: load courses', e)
                    setError(
                        resolveApiError(e, t, 'teacherGrades.loadCoursesError')
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

    const getCourseId = (c) =>
        c?.id ?? c?.courseId ?? c?.uuid ?? ''

    const getStudentCount = (c) => {
        if (typeof c.studentCount === 'number') return c.studentCount
        if (Array.isArray(c.enrolledStudents)) return c.enrolledStudents.length
        if (typeof c.enrolledCount === 'number') return c.enrolledCount
        return 0
    }

    return (
        <>
            {error ? <div className="error">{error}</div> : null}

            {loading ? (
                <SkeletonGrid />
            ) : courses.length === 0 ? (
                <p className="courses-empty">{t('teacherGrades.noCourses')}</p>
            ) : (
                <div className="courses-grid">
                    {courses.map((course, index) => {
                        const courseId = getCourseId(course)
                        const title = pickLocalized(course, 'title')
                        const count = getStudentCount(course)
                        const rowKey = courseId !== '' ? String(courseId) : `course-${index}`
                        const desc =
                            pickLocalized(course, 'description') || t('coursesPage.noDescription')
                        return (
                            <article key={rowKey} className="course-card">
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
                                    <h3 className="course-card__title">
                                        {title || (courseId ? `#${courseId}` : `#${index + 1}`)}
                                    </h3>
                                    <p className="course-card__description">{desc}</p>
                                    <div className="course-card__meta">
                                        {count > 0 ? (
                                            <span className="course-card__stat">
                                                <FiUsers aria-hidden />
                                                {t('teacherGrades.studentCount', { count })}
                                            </span>
                                        ) : null}
                                        {course.lessons && (
                                            <span className="course-card__stat">
                                                {course.lessons.length}{' '}
                                                {t('coursesPage.lessonsSuffix')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="course-card__footer">
                                        <div className="course-card__actions">
                                            <Link
                                                to={`/teacher/grades/${courseId}`}
                                                state={{ courseTitle: title }}
                                                className="course-card__btn course-card__btn--outline"
                                            >
                                                <span>{t('teacherGrades.openJournal')}</span>
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
                    })}
                </div>
            )}
        </>
    )
}
