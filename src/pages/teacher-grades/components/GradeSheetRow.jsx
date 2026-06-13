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

  return (
    <tr>
      <td>
        <span style={{ fontWeight: 600 }}>{row.fullName || row.studentId || `#${row.enrollmentId}`}</span>
      </td>
      <td>
        <span className="badge">{studyStatusLabel(row.studyStatus || 'active')}</span>
      </td>
      <td>
        <input
          type="number"
          min={GRADE_MIN}
          max={GRADE_MAX}
          step={1}
          className={`input grade-input${invalid ? ' tg-input--invalid' : ''}`}
          value={row.gradeInput}
          onChange={(e) => onChange('gradeInput', e.target.value)}
          aria-invalid={invalid}
          aria-label={`${t('teacherGrades.colGrade')} ${row.fullName || row.studentId}`}
        />
      </td>
      <td>
        <input
          type="text"
          className="input feedback-input"
          value={row.feedbackInput}
          onChange={(e) => onChange('feedbackInput', e.target.value)}
          placeholder={t('teacherGrades.feedbackPlaceholder')}
          aria-label={`${t('teacherGrades.colFeedback')} ${row.fullName || row.studentId}`}
        />
      </td>
    </tr>
  )
}
