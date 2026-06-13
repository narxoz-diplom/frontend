import React, { useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner, Donut } from '@/shared/ui/academis'
import useGradeSheet, { gradeFieldInvalid } from './hooks/useGradeSheet'
import GradeSheetRow from './components/GradeSheetRow'

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
      <div className="grades-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  const displayTitle = lessonTitle || t('teacherGrades.colGrade')

  return (
    <>
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

      <div className="grades-toolbar">
        {avgGrade != null && (
          <div className="card grades-stat-card">
            <Donut value={avgGrade} size={56} stroke={7} label={String(avgGrade)} />
            <div>
              <div className="dim" style={{ fontSize: 12 }}>{t('studentGrades.avgGrade')}</div>
              <div className="grades-stat-value">{avgGrade} / 100</div>
            </div>
          </div>
        )}

        <div className="input-icon grades-search">
          <Icon name="search" size={16} />
          <input
            className="input"
            type="search"
            placeholder={t('teacherGrades.filterPlaceholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label={t('teacherGrades.filterLabel')}
          />
        </div>
      </div>

      <div className="card grades-table-card">
        <div className="grades-table-wrap">
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
                  <td colSpan={4} className="muted grades-table-empty">
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

      <div className="grades-footer-actions">
        <Link to={`/teacher/grades/${courseId}`} state={location.state} className="btn btn-outline">
          <Icon name="chevLeft" size={16} />
          {t('teacherGrades.backToLessons')}
        </Link>
      </div>
    </>
  )
}
