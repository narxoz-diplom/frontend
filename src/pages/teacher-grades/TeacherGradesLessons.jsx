import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import { fetchCourseLessonTree } from '@/shared/api/teacherGradesApi'
import { resolveApiError } from '@/shared/lib/apiError'
import { PageHeader, Icon, Spinner, EmptyState } from '@/shared/ui/academis'
import { lessonGradeStatusBadge, lessonGradeStatusLabel } from '@/pages/grades/lessonStatus'

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

  if (loading) {
    return (
      <div className="grades-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  const allLessons = modules.flatMap((m) => m.lessons || [])

  const renderLessonRow = (lesson, index) => {
    const lTitle = pickLocalized(lesson, 'title') || lesson.title
    return (
      <Link
        key={lesson.id}
        to={`/teacher/grades/${courseId}/lessons/${lesson.id}`}
        state={{ courseTitle: courseTitleFromNav, lessonTitle: lTitle }}
        className="grades-lesson-row"
      >
        <span className="grades-lesson-num">{index + 1}</span>
        <div className="grades-lesson-body">
          <div className="grades-lesson-title">{lTitle}</div>
          <div className="grades-lesson-sub dim">{lessonGradeStatusLabel(lesson, t)}</div>
        </div>
        <span className={lessonGradeStatusBadge(lesson.status)} style={{ fontSize: 11 }}>
          {lessonGradeStatusLabel(lesson, t)}
        </span>
        <Icon name="chevRight" size={17} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
      </Link>
    )
  }

  return (
    <>
      <PageHeader
        title={courseTitleFromNav || t('nav.gradeJournal')}
        subtitle={t('teacherGrades.openJournal')}
        back="/teacher/grades"
        breadcrumb={[{ label: t('nav.gradeJournal'), to: '/teacher/grades' }]}
      />

      {error && <div className="secondary-flash secondary-flash--error">{error}</div>}

      {modules.length === 0 ? (
        <EmptyState icon="book" title={t('teacherGrades.noLessons')} />
      ) : modules.length === 1 && (modules[0].lessons || []).length > 0 ? (
        <div className="card grades-lesson-card">
          {(modules[0].lessons || [])
            .slice()
            .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
            .map((lesson, i) => renderLessonRow(lesson, i))}
        </div>
      ) : (
        <div className="col gap12">
          {modules.map((mod) => {
            const open = openModuleIds.has(String(mod.id))
            const title = pickLocalized(mod, 'title') || mod.title || t('teacherGrades.defaultModule')
            return (
              <div key={mod.id} className="card grades-lesson-card">
                <button
                  type="button"
                  className="sec-head row between grades-module-toggle"
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
                      .map((lesson, i) => renderLessonRow(lesson, i))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {allLessons.length > 0 && (
        <p className="muted grades-lesson-count">
          {allLessons.length} {t('coursesPage.lessonsSuffix')}
        </p>
      )}
    </>
  )
}
