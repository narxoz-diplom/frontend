import { useEffect, useState } from 'react'
import { getPublishedCourses, getEnrolledCourses } from '@/shared/api/coursesApi'
import { getMyTestAttempts, getUpcomingTestDeadlines } from '@/shared/api/testsApi'

const initialStats = {
    catalogCourses: 0,
    enrolledCourses: 0,
    completedLessons: 0,
    testAttempts: 0,
}

const countCompletedLessonsFromStorage = () => {
    if (typeof Storage === 'undefined') return 0
    try {
        const raw = localStorage.getItem('videoProgress')
        if (!raw) return 0
        const progress = JSON.parse(raw)
        return Object.values(progress).filter((p) => p && p.completed).length
    } catch {
        return 0
    }
}

const useStudentDashboardData = () => {
    const [stats, setStats] = useState(initialStats)
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const [publishedRes, enrolledRes, attemptsRes, deadlinesRes] = await Promise.all([
                    getPublishedCourses(),
                    getEnrolledCourses(),
                    getMyTestAttempts().catch(() => ({ data: [] })),
                    getUpcomingTestDeadlines().catch(() => ({ data: [] })),
                ])
                setStats({
                    catalogCourses: Array.isArray(publishedRes.data) ? publishedRes.data.length : 0,
                    enrolledCourses: Array.isArray(enrolledRes.data) ? enrolledRes.data.length : 0,
                    completedLessons: countCompletedLessonsFromStorage(),
                    testAttempts: Array.isArray(attemptsRes.data) ? attemptsRes.data.length : 0,
                })
                setUpcomingDeadlines(Array.isArray(deadlinesRes.data) ? deadlinesRes.data : [])
            } catch {
                setStats((s) => ({
                    ...s,
                    completedLessons: countCompletedLessonsFromStorage(),
                }))
                setUpcomingDeadlines([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return { stats, upcomingDeadlines, loading }
}

export default useStudentDashboardData
