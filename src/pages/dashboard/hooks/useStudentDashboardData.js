import { useEffect, useState } from 'react'
import { getCourses, getEnrolledCourses, getCourseProgress } from '@/shared/api/coursesApi'
import { getMyTestAttempts, getUpcomingTestDeadlines, getCourseTests } from '@/shared/api/testsApi'
import { pickLocalized } from '@/i18n/localize'

const initialStats = {
    catalogCourses: 0,
    enrolledCourses: 0,
    completedLessons: 0,
    totalLessons: 0,
    testAttempts: 0,
}

const normalizeDueAt = (test) => test?.dueAt || test?.deadline || test?.dueDate || null

const countQuestions = (test) => {
    if (Array.isArray(test?.questions)) return test.questions.length
    return test?.questionsCount ?? test?.questionCount ?? null
}

const buildDeadlinesFromCourses = async (courses) => {
    const now = Date.now()
    const perCourse = await Promise.all(
        courses.map(async (course) => {
            try {
                const res = await getCourseTests(course.id)
                const tests = Array.isArray(res.data) ? res.data : []
                return tests
                    .map((test) => ({ test, dueAt: normalizeDueAt(test) }))
                    .filter(({ dueAt }) => dueAt && new Date(dueAt).getTime() >= now)
                    .map(({ test, dueAt }) => ({
                        courseId: course.id,
                        testId: test.id,
                        testTitle: pickLocalized(test, 'title') || test.title,
                        courseTitle: pickLocalized(course, 'title') || course.title,
                        dueAt,
                        questionsCount: countQuestions(test),
                    }))
            } catch {
                return []
            }
        }),
    )
    return perCourse
        .flat()
        .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
}

const loadProgressForCourses = async (courses) => {
    const results = await Promise.all(
        courses.map(async (course) => {
            try {
                const { data } = await getCourseProgress(course.id)
                return {
                    courseId: course.id,
                    progressPercent: data?.progressPercent ?? 0,
                    completedLessons: data?.completedLessons ?? 0,
                    totalLessons: data?.totalLessons ?? 0,
                }
            } catch {
                return {
                    courseId: course.id,
                    progressPercent: 0,
                    completedLessons: 0,
                    totalLessons: 0,
                }
            }
        }),
    )
    return results
}

const useStudentDashboardData = () => {
    const [stats, setStats] = useState(initialStats)
    const [enrolledCourses, setEnrolledCourses] = useState([])
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const [accessibleRes, enrolledRes, attemptsRes, deadlinesRes] = await Promise.all([
                    getCourses(),
                    getEnrolledCourses(),
                    getMyTestAttempts().catch(() => ({ data: [] })),
                    getUpcomingTestDeadlines().catch(() => ({ data: [] })),
                ])
                const enrolled = Array.isArray(enrolledRes.data) ? enrolledRes.data : []
                const progressRows = await loadProgressForCourses(enrolled)
                const progressByCourse = Object.fromEntries(
                    progressRows.map((row) => [row.courseId, row]),
                )

                const coursesWithProgress = enrolled.map((course) => {
                    const row = progressByCourse[course.id] || {}
                    return {
                        ...course,
                        progress: row.progressPercent ?? 0,
                        lessonsCount: row.totalLessons ?? course.lessonsCount ?? 0,
                        completedLessons: row.completedLessons ?? 0,
                    }
                })

                const completedLessons = progressRows.reduce(
                    (sum, row) => sum + (row.completedLessons || 0),
                    0,
                )
                const totalLessons = progressRows.reduce(
                    (sum, row) => sum + (row.totalLessons || 0),
                    0,
                )

                setEnrolledCourses(coursesWithProgress)
                setStats({
                    catalogCourses: Array.isArray(accessibleRes.data) ? accessibleRes.data.length : 0,
                    enrolledCourses: enrolled.length,
                    completedLessons,
                    totalLessons,
                    testAttempts: Array.isArray(attemptsRes.data) ? attemptsRes.data.length : 0,
                })

                let deadlines = Array.isArray(deadlinesRes.data) ? deadlinesRes.data : []
                if (deadlines.length === 0 && enrolled.length > 0) {
                    deadlines = await buildDeadlinesFromCourses(enrolled)
                }
                setUpcomingDeadlines(deadlines)
            } catch {
                setStats((s) => ({ ...s, completedLessons: 0, totalLessons: 0 }))
                setEnrolledCourses([])
                setUpcomingDeadlines([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return { stats, enrolledCourses, upcomingDeadlines, loading }
}

export default useStudentDashboardData
