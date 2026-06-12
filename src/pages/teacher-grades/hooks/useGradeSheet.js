import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '@/app/providers/AlertProvider'
import {
    fetchLessonGradeSheet,
    saveLessonGrades,
    isGradeValid,
    parseGradeInput
} from '@/shared/api/teacherGradesApi'
import { resolveApiError } from '@/shared/lib/apiError'

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

export function gradeFieldInvalid(gradeInput) {
    const trimmed = String(gradeInput ?? '').trim()
    if (trimmed === '') return false
    const n = parseGradeInput(trimmed)
    return Number.isNaN(n) || !isGradeValid(n)
}

export default function useGradeSheet(courseId, lessonId) {
    const { t } = useTranslation()
    const { toast } = useAlert()

    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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
            toast(resolveApiError(e, t, 'teacherGrades.loadSheetError'), 'error')
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

    const save = async () => {
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
            toast(resolveApiError(e, t, 'teacherGrades.saveError'), 'error')
        } finally {
            setSaving(false)
        }
    }

    return { rows, loading, saving, hasInvalidGrades, updateRow, save }
}
