import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  fetchGradesForCourse,
  groupGradesByModule,
  courseGradeStats,
  gradeLevel,
} from '@/shared/api/studentGradesApi'
import { PageHeader, Icon, Spinner, Donut } from '@/shared/ui/academis'
import '../secondary-academis.css'

function formatDate(iso, lang) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    const locale = lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU'
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
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
            e?.response?.data?.message || e.message || t('studentGrades.loadError'),
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
    return (
      <div className="secondary-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('coursesPage.loading')}</span>
      </div>
    )
  }

  const modules = groupGradesByModule(grades)
  const stats = courseGradeStats(grades)
  const displayTitle = courseTitle || grades[0]?.courseTitle || t('nav.myGrades')

  return (
    <>
      <PageHeader
        title={displayTitle}
        subtitle={
          stats.gradedCount > 0 && stats.avgGrade != null
            ? `${t('studentGrades.totalGraded')}: ${stats.gradedCount} · ${t('studentGrades.avgShort', { value: stats.avgGrade })}`
            : t('studentGrades.subtitle')
        }
        back="/my/grades"
        breadcrumb={[{ label: t('nav.myGrades'), to: '/my/grades' }]}
      />

      {error && <div className="secondary-flash secondary-flash--error">{error}</div>}

      {stats.avgGrade != null && (
        <div className="card card-pad grade-stat-pill" style={{ marginBottom: 14, maxWidth: 280 }}>
          <Donut
            value={stats.avgGrade}
            size={56}
            stroke={7}
            color={gradeLevel(stats.avgGrade).color}
            label={String(stats.avgGrade)}
          />
          <div>
            <div className="dim" style={{ fontSize: 12 }}>{t('studentGrades.avgGrade')}</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: gradeLevel(stats.avgGrade).color }}>
              {stats.avgGrade}
            </div>
          </div>
        </div>
      )}

      {grades.length === 0 ? (
        <div className="card card-pad">
          <p className="muted">{t('studentGrades.emptyCourse')}</p>
        </div>
      ) : (
        modules.map((mod) => {
          const modTitle =
            mod.moduleTitle
            || (mod.moduleId === 'default' ? t('studentGrades.defaultModule') : mod.moduleId)

          return (
            <div key={mod.moduleId} className="card" style={{ overflow: 'hidden', marginBottom: 14 }}>
              <div className="sec-head">
                <h3 className="h3 row gap8">
                  <Icon name="book" size={16} />
                  {modTitle}
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{t('common.lesson')}</th>
                      <th style={{ width: 120 }}>{t('teacherGrades.colGrade')}</th>
                      <th>{t('studentGrades.feedbackLabel')}</th>
                      <th style={{ width: 120 }}>{t('adminNewsPage.published')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mod.grades.map((g, idx) => {
                      const { color, bg, label } = gradeLevel(g.grade)
                      return (
                        <tr key={`${g.lessonId}-${idx}`}>
                          <td style={{ fontWeight: 600 }}>
                            {g.lessonTitle || `${t('common.lesson')} ${idx + 1}`}
                          </td>
                          <td>
                            <span
                              className="grade-badge"
                              style={{ color, background: bg, border: `1px solid ${color}33` }}
                            >
                              {label}
                            </span>
                          </td>
                          <td className="muted">{g.feedback?.trim() || '—'}</td>
                          <td className="muted">{formatDate(g.gradedAt, i18n.language)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
