import React, { useMemo, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiLoader, FiSave, FiSearch } from 'react-icons/fi'
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
        lessonId
    )
    const [filter, setFilter] = useState('')

    const filteredRows = useMemo(() => {
        const q = filter.trim().toLowerCase()
        if (!q) return rows
        return rows.filter((s) =>
            (s.fullName || '').toLowerCase().includes(q)
        )
    }, [rows, filter])

    const colName = t('teacherGrades.colName')
    const colStatus = t('teacherGrades.colStatus')
    const colGrade = t('teacherGrades.colGrade')
    const colFeedback = t('teacherGrades.colFeedback')

    if (loading) {
        return (
            <section className="tg-section tg-section-loading">
                <div className="tg-loading-block">
                    <FiLoader className="tg-spin" size={44} aria-hidden />
                    <p>{t('common.loading')}</p>
                </div>
            </section>
        )
    }

    return (
        <section className="tg-section">
            <Link
                to={`/teacher/grades/${courseId}`}
                state={location.state}
                className="app-back-link"
            >
                <FiArrowLeft aria-hidden /> {t('teacherGrades.backToLessons')}
            </Link>

            <div className="tg-section-head tg-section-head--row">
                <div>
                    {[courseTitle, lessonTitle].filter(Boolean).length ? (
                        <h2 className="tg-context-title tg-context-title--table">
                            {[courseTitle, lessonTitle].filter(Boolean).join(' · ')}
                        </h2>
                    ) : null}
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={save}
                    disabled={saving || hasInvalidGrades}
                >
                    {saving ? t('teacherGrades.saving') : t('teacherGrades.saveChanges')}
                    <FiSave aria-hidden />
                </button>
            </div>

            {hasInvalidGrades ? (
                <div className="error" role="alert">
                    {t('teacherGrades.fixInvalidGrades')}
                </div>
            ) : null}

            <div className="tg-toolbar">
                <label className="tg-search-label">
                    <span className="tg-visually-hidden">{t('teacherGrades.filterLabel')}</span>
                    <div className="tg-search-wrap">
                        <FiSearch className="tg-search-icon" aria-hidden />
                        <input
                            type="search"
                            className="tg-input tg-search-input"
                            placeholder={t('teacherGrades.filterPlaceholder')}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </label>
            </div>

            <div className="tg-table-wrap">
                <table className="tg-table">
                    <thead>
                        <tr>
                            <th>{colName}</th>
                            <th>{colStatus}</th>
                            <th>{colGrade}</th>
                            <th>{colFeedback}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="tg-table-empty tg-table-mobile-full">
                                    {t('teacherGrades.tableEmpty')}
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((s) => (
                                <GradeSheetRow
                                    key={s._rowKey}
                                    row={s}
                                    invalid={gradeFieldInvalid(s.gradeInput)}
                                    onChange={(field, value) =>
                                        updateRow(s._rowKey, field, value)
                                    }
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
