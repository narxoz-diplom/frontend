import React, { useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner, Donut } from '@/shared/ui/academis'
import useGradeSheet, { gradeFieldInvalid } from './hooks/useGradeSheet'
import GradeSheetRow from './components/GradeSheetRow'
import '../secondary-academis.css'

export default function TeacherGradesTable() {
  const { courseId, lessonId } = useParams()
  const location = useLocation()
  const { t } = useTranslation()

  const courseTitle = location.state?.courseTitle
  const lessonTitle = location.state?.lessonTitle

  const { rows, loading, saving, hasInvalidGrades, updateRow, save } = useGradeSheet(
    courseId,
    lessonId,
  )
  const [filter, setFilter] = useState('')

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((s) => (s.fullName || '').toLowerCase().includes(q))
  }, [rows, filter])

  const avgGrade = useMemo(() => {
    const graded = rows.filter(
      (r) => r.gradeInput !== '' && !gradeFieldInvalid(r.gradeInput),
    )
    if (!graded.length) return null
    return Math.round(
      graded.reduce((sum, r) => sum + Number(r.gradeInput), 0) / graded.length,
    )
  }, [rows])

  if (loading) {
    return (
      <section className="tg-section secondary-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </section>
    )
  }

  const displayTitle = lessonTitle || t('teacherGrades.colGrade')

  return (
    <section className="tg-section">
      <PageHeader
        title={displayTitle}
        subtitle={
          courseTitle
            ? `${courseTitle} · ${rows.length} ${t('teacherGrades.colName').toLowerCase()}`
            : `${rows.length} ${t('teacherGrades.colName').toLowerCase()}`
        }
        back={`/teacher/grades/${courseId}`}
        breadcrumb={[
          { label: t('nav.gradeJournal'), to: '/teacher/grades' },
          ...(courseTitle ? [{ label: courseTitle, to: `/teacher/grades/${courseId}` }] : []),
        ]}
        actions={(
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={saving || hasInvalidGrades}
          >
            <Icon name="check" size={16} />
            {saving ? t('teacherGrades.saving') : t('teacherGrades.saveChanges')}
          </button>
        )}
      />

      {hasInvalidGrades && (
        <div className="secondary-flash secondary-flash--error" role="alert">
          {t('teacherGrades.fixInvalidGrades')}
        </div>
      )}

      {avgGrade != null && (
        <div className="card card-pad grade-stat-pill" style={{ marginBottom: 14, maxWidth: 280 }}>
          <Donut value={avgGrade} size={56} stroke={7} label={String(avgGrade)} />
          <div>
            <div className="dim" style={{ fontSize: 12 }}>
              {t('studentGrades.avgGrade')}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {avgGrade} / 100
            </div>
          </div>
        </div>
      )}

      <div className="input-icon" style={{ maxWidth: 320, marginBottom: 14 }}>
        <span className="ic">
          <Icon name="search" size={16} />
        </span>
        <input
          className="input"
          type="search"
          placeholder={t('teacherGrades.filterPlaceholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('teacherGrades.colName')}</th>
                <th>{t('teacherGrades.colStatus')}</th>
                <th style={{ width: 120 }}>{t('teacherGrades.colGrade')}</th>
                <th>{t('teacherGrades.colFeedback')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    {t('teacherGrades.tableEmpty')}
                  </td>
                </tr>
              ) : (
                filteredRows.map((s) => (
                  <GradeSheetRow
                    key={s._rowKey}
                    row={s}
                    invalid={gradeFieldInvalid(s.gradeInput)}
                    onChange={(field, value) => updateRow(s._rowKey, field, value)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
        <Link to={`/teacher/grades/${courseId}`} state={location.state} className="btn btn-outline">
          <Icon name="chevLeft" size={16} />
          {t('teacherGrades.backToLessons')}
        </Link>
      </div>
    </section>
  )
}
