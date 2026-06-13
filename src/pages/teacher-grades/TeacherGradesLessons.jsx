import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import { fetchCourseLessonTree } from '@/shared/api/teacherGradesApi'
import { resolveApiError } from '@/shared/lib/apiError'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import '../secondary-academis.css'

function statusBadgeClass(status) {
  if (status === 'complete') return 'badge badge-published'
  if (status === 'in_progress') return 'badge badge-draft'
  return 'badge'
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
          setError(resolveApiError(e, t, 'teacherGrades.loadLessonsError'))
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
    if (total === 0) return t('teacherGrades.statusUnknown')
    if ((lesson.status === 'complete' || (total > 0 && g >= total)) && total > 0) {
      return t('teacherGrades.statusComplete', { graded: g, total })
    }
    if (g > 0 && total > 0) {
      return t('teacherGrades.statusProgress', { graded: g, total })
    }
    return t('teacherGrades.statusReview')
  }

  if (loading) {
    return (
      <section className="tg-section secondary-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </section>
    )
  }

  const allLessons = modules.flatMap((m) => m.lessons || [])

  return (
    <section className="tg-section">
      <PageHeader
        title={courseTitleFromNav || t('nav.gradeJournal')}
        subtitle={t('teacherGrades.openJournal')}
        back="/teacher/grades"
        breadcrumb={[{ label: t('nav.gradeJournal'), to: '/teacher/grades' }]}
      />

      {error && <div className="secondary-flash secondary-flash--error">{error}</div>}

      {modules.length === 0 ? (
        <div className="card card-pad">
          <p className="muted">{t('teacherGrades.noLessons')}</p>
        </div>
      ) : modules.length === 1 && (modules[0].lessons || []).length > 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          {(modules[0].lessons || [])
            .slice()
            .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
            .map((lesson, i) => {
              const lTitle = pickLocalized(lesson, 'title') || lesson.title
              return (
                <Link
                  key={lesson.id}
                  to={`/teacher/grades/${courseId}/lessons/${lesson.id}`}
                  state={{ courseTitle: courseTitleFromNav, lessonTitle: lTitle }}
                  className="lesson-row-link"
                  style={{
                    borderBottom: i < modules[0].lessons.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span className="lesson-num">{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650, fontSize: 14 }}>{lTitle}</div>
                    <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>
                      {lessonStatusLabel(lesson)}
                    </div>
                  </div>
                  <Icon name="chevRight" size={17} style={{ color: 'var(--text-3)' }} />
                </Link>
              )
            })}
        </div>
      ) : (
        <div className="col gap12">
          {modules.map((mod) => {
            const open = openModuleIds.has(String(mod.id))
            const title = pickLocalized(mod, 'title') || mod.title || t('teacherGrades.defaultModule')
            return (
              <div key={mod.id} className="card" style={{ overflow: 'hidden' }}>
                <button
                  type="button"
                  className="sec-head row between"
                  style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  aria-expanded={open}
                  onClick={() => toggleModule(mod.id)}
                >
                  <h3 className="h3 row gap8" style={{ margin: 0 }}>
                    <Icon name="layers" size={16} />
                    {title}
                  </h3>
                  <Icon name={open ? 'chevDown' : 'chevRight'} size={16} />
                </button>
                {open && (
                  <div>
                    {(mod.lessons || [])
                      .slice()
                      .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
                      .map((lesson, i, arr) => {
                        const lTitle = pickLocalized(lesson, 'title') || lesson.title
                        return (
                          <Link
                            key={lesson.id}
                            to={`/teacher/grades/${courseId}/lessons/${lesson.id}`}
                            state={{ courseTitle: courseTitleFromNav, lessonTitle: lTitle }}
                            className="lesson-row-link"
                            style={{
                              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                            }}
                          >
                            <span className="lesson-num">{i + 1}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 650, fontSize: 14 }}>{lTitle}</div>
                              <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>
                                {lessonStatusLabel(lesson)}
                              </div>
                            </div>
                            <span className={statusBadgeClass(lesson.status)} style={{ fontSize: 11 }}>
                              {lessonStatusLabel(lesson)}
                            </span>
                            <Icon name="chevRight" size={17} style={{ color: 'var(--text-3)' }} />
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {allLessons.length > 0 && (
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {allLessons.length} {t('coursesPage.lessonsSuffix')}
        </p>
      )}
    </section>
  )
}
