import api from '@/shared/api/client'

export function gradeLevel(grade) {
    if (grade === null || grade === undefined || grade === '') {
        return { color: 'var(--text-light)', bg: 'var(--bg-tertiary)', label: '—', level: 'none' }
    }
    const n = Number(grade)
    if (Number.isNaN(n)) {
        return { color: 'var(--text-light)', bg: 'var(--bg-tertiary)', label: '—', level: 'none' }
    }
    if (n >= 90) return { color: '#16a34a', bg: 'rgba(34, 197, 94, 0.12)', label: String(n), level: 'excellent' }
    if (n >= 75) return { color: '#0284c7', bg: 'rgba(14, 165, 233, 0.12)', label: String(n), level: 'good' }
    if (n >= 60) return { color: '#d97706', bg: 'rgba(245, 158, 11, 0.12)', label: String(n), level: 'satisfactory' }
    return { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.12)', label: String(n), level: 'poor' }
}

function normalizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null
    return {
        courseId: String(raw.courseId ?? raw.course_id ?? ''),
        courseTitle: String(raw.courseTitle ?? raw.course_title ?? raw.courseName ?? ''),
        lessonId: String(raw.lessonId ?? raw.lesson_id ?? ''),
        lessonTitle: String(raw.lessonTitle ?? raw.lesson_title ?? raw.lessonName ?? ''),
        moduleId: String(raw.moduleId ?? raw.module_id ?? 'default'),
        moduleTitle: String(raw.moduleTitle ?? raw.module_title ?? ''),
        grade: raw.grade ?? raw.score ?? null,
        feedback: raw.feedback ?? raw.comment ?? raw.note ?? '',
        gradedAt: raw.gradedAt ?? raw.graded_at ?? raw.updatedAt ?? raw.createdAt ?? null,
    }
}

function normalizeGradesPayload(data) {
    if (!data) return []
    if (data.grades && Array.isArray(data.grades)) {
        return data.grades.map(normalizeEntry).filter(Boolean)
    }
    if (Array.isArray(data)) {
        const flat = []
        for (const item of data) {
            if (item?.lessons && Array.isArray(item.lessons)) {
                const courseId = item.courseId ?? item.id ?? ''
                const courseTitle = item.courseTitle ?? item.title ?? ''
                for (const lesson of item.lessons) {
                    flat.push(
                        normalizeEntry({ ...lesson, courseId, courseTitle })
                    )
                }
            } else {
                flat.push(normalizeEntry(item))
            }
        }
        return flat.filter(Boolean)
    }
    return []
}

export async function fetchEnrolledCourses() {
    const { data } = await api.get('/courses/enrolled')
    const list = Array.isArray(data) ? data : data?.courses ?? data?.items ?? []
    return list
}

export async function fetchMyGrades() {
    const { data } = await api.get('/grades/my')
    return normalizeGradesPayload(data)
}

export async function fetchGradesForCourse(courseId) {
    try {
        const { data } = await api.get(`/courses/${courseId}/grades/my`)
        return normalizeGradesPayload(data)
    } catch {}
    try {
        const { data } = await api.get('/grades/my', { params: { courseId } })
        const all = normalizeGradesPayload(data)
        if (all.length > 0) return all.filter((g) => String(g.courseId) === String(courseId))
    } catch {}
    const all = await fetchMyGrades()
    return all.filter((g) => String(g.courseId) === String(courseId))
}

export function groupGradesByModule(grades) {
    const map = new Map()
    for (const g of grades) {
        const key = g.moduleId || 'default'
        if (!map.has(key)) {
            map.set(key, {
                moduleId: key,
                moduleTitle: g.moduleTitle || '',
                grades: [],
            })
        }
        map.get(key).grades.push(g)
    }
    return [...map.values()]
}

export function courseGradeStats(grades) {
    const graded = grades.filter((g) => g.grade !== null && g.grade !== undefined && g.grade !== '')
    const avg =
        graded.length > 0
            ? Math.round(graded.reduce((s, g) => s + Number(g.grade), 0) / graded.length)
            : null
    return { avgGrade: avg, gradedCount: graded.length, total: grades.length }
}
