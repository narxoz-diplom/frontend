import React from 'react'
import { useTranslation } from 'react-i18next'
import { GRADE_MAX, GRADE_MIN } from '@/shared/api/teacherGradesApi'

export default function GradeSheetRow({ row, invalid, onChange }) {
  const { t } = useTranslation()

  const studyStatusLabel = (code) => {
    const key = `teacherGrades.studyStatus.${code}`
    const translated = t(key)
    return translated === key ? code : translated
  }

  const status = row.studyStatus || 'active'
  const statusClass =
    status === 'completed'
      ? 'grades-study-pill grades-study-pill--completed'
      : 'grades-study-pill'

  return (
    <tr>
      <td>
        <span className="grades-student-name">
          {row.fullName || row.studentId || `#${row.enrollmentId}`}
        </span>
      </td>
      <td>
        <span className={statusClass}>{studyStatusLabel(status)}</span>
      </td>
      <td>
        <input
          type="number"
          min={GRADE_MIN}
          max={GRADE_MAX}
          step={1}
          className={`input grades-grade-input${invalid ? ' grades-grade-input--invalid' : ''}`}
          value={row.gradeInput}
          onChange={(e) => onChange('gradeInput', e.target.value)}
          aria-invalid={invalid}
          aria-label={`${t('teacherGrades.colGrade')} ${row.fullName || row.studentId}`}
        />
      </td>
      <td>
        <input
          type="text"
          className="input grades-feedback-input"
          value={row.feedbackInput}
          onChange={(e) => onChange('feedbackInput', e.target.value)}
          placeholder={t('teacherGrades.feedbackPlaceholder')}
          aria-label={`${t('teacherGrades.colFeedback')} ${row.fullName || row.studentId}`}
        />
      </td>
    </tr>
  )
}
