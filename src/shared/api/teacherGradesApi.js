import api from '@/shared/api/client'

export const GRADE_MIN = 0
export const GRADE_MAX = 100

export function isGradeValid(value) {
  if (value === '' || value === null || value === undefined) return true
  const n = Number(value)
  if (Number.isNaN(n)) return false
  return n >= GRADE_MIN && n <= GRADE_MAX
}

export function parseGradeInput(raw) {
  if (raw === '' || raw === null || raw === undefined) return null
  const n = Number(String(raw).replace(',', '.'))
  if (Number.isNaN(n)) return NaN
  return n
}

export function normalizeGradeSheetStudent(raw) {
  if (!raw || typeof raw !== 'object') return null
  const studentId = String(raw.studentId ?? raw.userId ?? raw.user?.id ?? raw.id ?? '').trim()
  const nameParts = [raw.lastName, raw.firstName, raw.middleName]
    .filter(Boolean)
    .join(' ')
  const fullName = raw.fullName ?? raw.name ?? (nameParts ? nameParts : undefined) ?? ''
  return {
    studentId,
    enrollmentId: raw.enrollmentId ?? raw.enrollment?.id ?? null,
    fullName,
    studyStatus: raw.studyStatus ?? raw.status ?? raw.learningStatus ?? 'active',
    grade: raw.grade ?? raw.score ?? null,
    feedback: raw.feedback ?? raw.comment ?? raw.note ?? ''
  }
}

function extractCoursesPayload(data) {
  if (data == null) return []
  if (Array.isArray(data)) return data

  const tryArray = (v) => (Array.isArray(v) ? v : null)

  const nested =
    tryArray(data.courses) ??
    tryArray(data.items) ??
    tryArray(data.content) ??
    tryArray(data.data) ??
    tryArray(data.results) ??
    tryArray(data.records) ??
    tryArray(data.list) ??
    tryArray(data.body)

  if (nested) return nested

  if (typeof data === 'object' && data.course != null && typeof data.course === 'object')
    return [data.course]

  return []
}

export function isCoursePublished(course) {
  return String(course?.status ?? '').trim().toUpperCase() === 'PUBLISHED'
}

export async function fetchTeacherCourses() {
  const { data } = await api.get('/courses')
  const list = extractCoursesPayload(data).filter(isCoursePublished)
  return { courses: list }
}

export function normalizeLessonsToModules(data, courseId) {
  if (!data) return { courseId, modules: [] }
  if (data.modules && Array.isArray(data.modules)) {
    return { courseId: data.courseId || courseId, modules: data.modules }
  }
  const lessons = Array.isArray(data) ? data : data.lessons || []
  const groups = new Map()
  for (const lesson of lessons) {
    const moduleId = lesson.moduleId ?? lesson.module?.id ?? 'default'
    const moduleTitle =
      lesson.moduleTitle ?? lesson.module?.title ?? 'Программа курса'
    if (!groups.has(moduleId)) {
      groups.set(moduleId, {
        id: moduleId,
        title: moduleTitle,
        lessons: []
      })
    }
    const gradedCount =
      lesson.gradedCount ?? lesson.gradedStudentsCount ?? lesson.graded ?? 0
    const totalStudents =
      lesson.totalStudents ?? lesson.studentsTotal ?? lesson.enrolledCount ?? 0
    const status =
      lesson.gradeStatus ??
      lesson.gradingStatus ??
      deriveStatus(gradedCount, totalStudents)
    groups.get(moduleId).lessons.push({
      ...lesson,
      gradedCount,
      totalStudents,
      status
    })
  }
  return { courseId, modules: [...groups.values()] }
}

function deriveStatus(graded, total) {
  if (!total || total === 0) return 'needs_review'
  if (graded >= total) return 'complete'
  if (graded > 0) return 'in_progress'
  return 'needs_review'
}

export async function fetchCourseLessonTree(courseId) {
  const { data } = await api.get(`/courses/${courseId}/lessons`)
  return normalizeLessonsToModules(data, courseId)
}

export async function fetchLessonGradeSheet(courseId, lessonId) {
  const { data } = await api.get(
    `/teacher/courses/${courseId}/lessons/${lessonId}/grade-sheet`
  )
  const rawStudents = data.students ?? data.rows ?? data
  const arr = Array.isArray(rawStudents) ? rawStudents : []
  const students = arr
    .map(normalizeGradeSheetStudent)
    .filter((s) => s && (String(s.studentId).length > 0 || s.enrollmentId != null))

  return {
    courseId: data.courseId ?? courseId,
    lessonId: data.lessonId ?? lessonId,
    students
  }
}

export async function saveLessonGrades(payload) {
  const { data } = await api.post('/grades/save', payload)
  return data
}
