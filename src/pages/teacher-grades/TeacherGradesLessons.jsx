import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    FiArrowLeft,
    FiChevronDown,
    FiChevronRight,
    FiLayers
} from 'react-icons/fi'
import { pickLocalized } from '@/i18n/localize'
import { fetchCourseLessonTree } from '@/shared/api/teacherGradesApi'
import { resolveApiError } from '@/shared/lib/apiError'

function statusBadgeClass(status) {
    if (status === 'complete') return 'tg-badge tg-badge--ok'
    if (status === 'in_progress') return 'tg-badge tg-badge--progress'
    return 'tg-badge tg-badge--warn'
}

export default function TeacherGradesLessons() {
    const { courseId } = useParams()
    const location = useLocation()
    const { t } = useTranslation()
    const courseTitleFromNav = location.state?.courseTitle

    const [modules, setModules] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [openModuleIds, setOpenModuleIds] = useState(() => new Set())

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError('')
            try {
                const res = await fetchCourseLessonTree(courseId)
                if (!cancelled) {
                    const list = res.modules || []
                    setModules(list)
                    setOpenModuleIds(new Set(list.map((m) => String(m.id))))
                }
            } catch (e) {
                if (!cancelled) {
                    setError(
                        resolveApiError(e, t, 'teacherGrades.loadLessonsError')
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

    const toggleModule = (id) => {
        setOpenModuleIds((prev) => {
            const next = new Set(prev)
            const key = String(id)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const lessonStatusLabel = (lesson) => {
        const g = lesson.gradedCount ?? 0
        const total = lesson.totalStudents ?? 0
        if (total === 0) {
            return t('teacherGrades.statusUnknown')
        }
        if ((lesson.status === 'complete' || (total > 0 && g >= total)) && total > 0) {
            return t('teacherGrades.statusComplete', { graded: g, total })
        }
        if (g > 0 && total > 0) {
            return t('teacherGrades.statusProgress', { graded: g, total })
        }
        return t('teacherGrades.statusReview')
    }

    return (
        <section className="tg-section">
            <Link to="/teacher/grades" className="app-back-link">
                <FiArrowLeft aria-hidden /> {t('teacherGrades.backToJournal')}
            </Link>

            {courseTitleFromNav ? (
                <h2 className="tg-context-title">{courseTitleFromNav}</h2>
            ) : null}

            {error ? <div className="error">{error}</div> : null}

            {loading ? (
                <div className="tg-accordion">
                    {[1, 2].map((i) => (
                        <div key={i} className="tg-acc-item tg-acc-item--skeleton">
                            <div className="tg-skel-line tg-skel-line--lg" />
                        </div>
                    ))}
                </div>
            )  : modules.length === 0 ? (
                <p className="courses-empty">{t('teacherGrades.noLessons')}</p>
            ) : (
                <div className="tg-accordion">
                    {modules.map((mod) => {
                        const open = openModuleIds.has(String(mod.id))
                        const title =
                            pickLocalized(mod, 'title') || mod.title || t('teacherGrades.defaultModule')
                        return (
                            <div key={mod.id} className="tg-acc-item">
                                <button
                                    type="button"
                                    className="tg-acc-trigger"
                                    aria-expanded={open}
                                    onClick={() => toggleModule(mod.id)}
                                >
                                    <FiLayers className="tg-acc-trigger-icon" aria-hidden />
                                    <span className="tg-acc-trigger-title">{title}</span>
                                    <FiChevronDown className={`tg-acc-chevron ${open ? 'is-open' : ''}`} />
                                </button>
                                {open ? (
                                    <ul className="tg-lesson-list">
                                        {(mod.lessons || [])
                                            .slice()
                                            .sort(
                                                (a, b) =>
                                                    (a.orderNumber ?? 0) - (b.orderNumber ?? 0)
                                            )
                                            .map((lesson) => {
                                                const lTitle = pickLocalized(lesson, 'title') || lesson.title
                                                return (
                                                    <li key={lesson.id}>
                                                        <Link
                                                            to={`/teacher/grades/${courseId}/lessons/${lesson.id}`}
                                                            state={{
                                                                courseTitle: courseTitleFromNav,
                                                                lessonTitle: lTitle
                                                            }}
                                                            className="tg-lesson-row"
                                                        >
                                                            <span className="tg-lesson-name">{lTitle}</span>
                                                            <span className={statusBadgeClass(lesson.status)}>
                                                                {lessonStatusLabel(lesson)}
                                                            </span>
                                                            <FiChevronRight className="tg-lesson-chevron" aria-hidden />
                                                        </Link>
                                                    </li>
                                                )
                                            })}
                                    </ul>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
