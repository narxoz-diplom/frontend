import React from 'react'
import { useTranslation } from 'react-i18next'
import { GRADE_MAX, GRADE_MIN } from '@/shared/api/teacherGradesApi'

export default function GradeSheetRow({ row, invalid, onChange }) {
    const { t } = useTranslation()

    const colName = t('teacherGrades.colName')
    const colStatus = t('teacherGrades.colStatus')
    const colGrade = t('teacherGrades.colGrade')
    const colFeedback = t('teacherGrades.colFeedback')

    const studyStatusLabel = (code) => {
        const key = `teacherGrades.studyStatus.${code}`
        const translated = t(key)
        return translated === key ? code : translated
    }

    return (
        <tr>
            <td className="tg-cell-name" data-label={colName}>
                {row.fullName || row.studentId || `#${row.enrollmentId}`}
            </td>
            <td data-label={colStatus}>
                <span className="tg-study-pill">
                    {studyStatusLabel(row.studyStatus || 'active')}
                </span>
            </td>
            <td data-label={colGrade}>
                <input
                    type="number"
                    min={GRADE_MIN}
                    max={GRADE_MAX}
                    step={1}
                    className={`tg-input tg-grade-input ${invalid ? 'tg-input--invalid' : ''}`}
                    value={row.gradeInput}
                    onChange={(e) => onChange('gradeInput', e.target.value)}
                    aria-invalid={invalid}
                    aria-label={`${colGrade} ${colName}: ${row.fullName || row.studentId}`}
                />
            </td>
            <td data-label={colFeedback}>
                <input
                    type="text"
                    className="tg-input tg-feedback-input"
                    value={row.feedbackInput}
                    onChange={(e) => onChange('feedbackInput', e.target.value)}
                    placeholder={t('teacherGrades.feedbackPlaceholder')}
                    aria-label={`${colFeedback} ${colName}: ${row.fullName || row.studentId}`}
                />
            </td>
        </tr>
    )
}
