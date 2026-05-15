import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiLoader, FiSave, FiSearch } from 'react-icons/fi'
import { useAlert } from '../../context/AlertProvider'
import {
    fetchLessonGradeSheet,
    saveLessonGrades,
    GRADE_MAX,
    GRADE_MIN,
    isGradeValid,
    parseGradeInput
} from '../../services/teacherGradesApi'

function rowIdentity(s) {
    return String(s.studentId || s.enrollmentId || '').trim()
}

function buildSnapshot(students) {
    const snap = {}
    for (const s of students) {
        const k = rowIdentity(s)
        if (!k) continue
        const g = s.grade
        snap[k] = {
            grade: g === null || g === undefined ? '' : String(g),
            feedback: s.feedback ?? ''
        }
    }
    return snap
}

export default function TeacherGradesTable() {
    const { courseId, lessonId } = useParams()
    const location = useLocation()
    const { t } = useTranslation()
    const { toast } = useAlert()

    const courseTitle = location.state?.courseTitle
    const lessonTitle = location.state?.lessonTitle

    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [filter, setFilter] = useState('')

    /** @type {React.MutableRefObject<Record<string, { grade: string, feedback: string }>>} */
    const baselineRef = useRef({})

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchLessonGradeSheet(courseId, lessonId)
            const list = res.students || []
            baselineRef.current = buildSnapshot(list)
            setRows(
                list.map((s) => ({
                    ...s,
                    _rowKey: rowIdentity(s),
                    gradeInput: s.grade === null || s.grade === undefined ? '' : String(s.grade),
                    feedbackInput: s.feedback ?? ''
                }))
            )
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || t('teacherGrades.loadSheetError')
            toast(msg, 'error')
            setRows([])
        } finally {
            setLoading(false)
        }
    }, [courseId, lessonId, t, toast])

    useEffect(() => {
        load()
    }, [load])

    const updateRow = (rowKey, field, value) => {
        setRows((prev) =>
            prev.map((row) =>
                row._rowKey === rowKey ? { ...row, [field]: value } : row
            )
        )
    }

    const gradeFieldInvalid = (gradeInput) => {
        const trimmed = String(gradeInput ?? '').trim()
        if (trimmed === '') return false
        const n = parseGradeInput(trimmed)
        return Number.isNaN(n) || !isGradeValid(n)
    }

    const filteredRows = useMemo(() => {
        const q = filter.trim().toLowerCase()
        if (!q) return rows
        return rows.filter((s) =>
            (s.fullName || '').toLowerCase().includes(q)
        )
    }, [rows, filter])

    const hasInvalidGrades = useMemo(
        () => rows.some((s) => gradeFieldInvalid(s.gradeInput)),
        [rows]
    )

    const collectChanges = () => {
        const baseline = baselineRef.current
        const entries = []
        for (const s of rows) {
            const rk = s._rowKey
            const prev = baseline[rk] || { grade: '', feedback: '' }
            const gradeStr = String(s.gradeInput ?? '').trim()
            const feedback = String(s.feedbackInput ?? '')
            if (gradeStr === prev.grade && feedback === prev.feedback) continue

            let gradeValue = null
            if (gradeStr !== '') {
                const n = parseGradeInput(gradeStr)
                if (Number.isNaN(n) || !isGradeValid(n)) continue
                gradeValue = n
            }
            const entry = {
                grade: gradeValue,
                feedback: feedback || ''
            }
            if (s.studentId) entry.studentId = s.studentId
            if (s.enrollmentId != null && s.enrollmentId !== '')
                entry.enrollmentId = s.enrollmentId
            entries.push(entry)
        }
        return entries
    }

    const handleSave = async () => {
        if (hasInvalidGrades) {
            toast(t('teacherGrades.validationError'), 'error')
            return
        }
        const entries = collectChanges()
        if (entries.length === 0) {
            toast(t('teacherGrades.nothingToSave'), 'info')
            return
        }
        setSaving(true)
        try {
            await saveLessonGrades({
                courseId,
                lessonId,
                entries
            })
            toast(t('teacherGrades.saveSuccess'), 'success')
            baselineRef.current = buildSnapshot(
                rows.map((s) => ({
                    ...s,
                    grade:
                        String(s.gradeInput ?? '').trim() === ''
                            ? null
                            : parseGradeInput(String(s.gradeInput).trim()),
                    feedback: s.feedbackInput ?? ''
                }))
            )
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || t('teacherGrades.saveError')
            toast(msg, 'error')
        } finally {
            setSaving(false)
        }
    }

    const studyStatusLabel = (code) => {
        const key = `teacherGrades.studyStatus.${code}`
        const translated = t(key)
        return translated === key ? code : translated
    }

    const colName = t('teacherGrades.colName')
    const colStatus = t('teacherGrades.colStatus')
    const colGrade = t('teacherGrades.colGrade')
    const colFeedback = t('teacherGrades.colFeedback')

    if (loading) {
        return (
            <section className="tg-section tg-section--table tg-section-loading">
                <div className="tg-loading-block">
                    <FiLoader className="tg-spin" size={44} aria-hidden />
                    <p>{t('common.loading')}</p>
                </div>
            </section>
        )
    }

    return (
        <section className="tg-section tg-section--table">
            <Link
                to={`/teacher/grades/${courseId}`}
                state={location.state}
                className="course-page__back"
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
                    className="tg-btn tg-btn--primary"
                    onClick={handleSave}
                    disabled={saving || hasInvalidGrades}
                >
                    {saving ? t('teacherGrades.saving') : t('teacherGrades.saveChanges')}
                    <FiSave aria-hidden />
                </button>
            </div>

            {hasInvalidGrades ? (
                <div className="tg-inline-error tg-inline-error--margin" role="alert">
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
                            filteredRows.map((s) => {
                                const invalid = gradeFieldInvalid(s.gradeInput)
                                return (
                                    <tr key={s._rowKey}>
                                        <td className="tg-cell-name" data-label={colName}>
                                            {s.fullName || s.studentId || `#${s.enrollmentId}`}
                                        </td>
                                        <td data-label={colStatus}>
                                            <span className="tg-study-pill">
                                                {studyStatusLabel(s.studyStatus || 'active')}
                                            </span>
                                        </td>
                                        <td data-label={colGrade}>
                                            <input
                                                type="number"
                                                min={GRADE_MIN}
                                                max={GRADE_MAX}
                                                step={1}
                                                className={`tg-input tg-grade-input ${invalid ? 'tg-input--invalid' : ''}`}
                                                value={s.gradeInput}
                                                onChange={(e) =>
                                                    updateRow(
                                                        s._rowKey,
                                                        'gradeInput',
                                                        e.target.value
                                                    )
                                                }
                                                aria-invalid={invalid}
                                                aria-label={`${colGrade} ${colName}: ${s.fullName || s.studentId}`}
                                            />
                                        </td>
                                        <td data-label={colFeedback}>
                                            <input
                                                type="text"
                                                className="tg-input tg-feedback-input"
                                                value={s.feedbackInput}
                                                onChange={(e) =>
                                                    updateRow(
                                                        s._rowKey,
                                                        'feedbackInput',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={t('teacherGrades.feedbackPlaceholder')}
                                                aria-label={`${colFeedback} ${colName}: ${s.fullName || s.studentId}`}
                                            />
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
