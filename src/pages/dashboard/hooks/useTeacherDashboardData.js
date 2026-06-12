import { useEffect, useMemo, useState } from 'react'
import { getCourses } from '@/shared/api/coursesApi'

const useTeacherDashboardData = () => {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const response = await getCourses()
                setCourses(response.data || [])
            } catch {
                setCourses([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const totalLessons = useMemo(
        () => courses.reduce((sum, c) => sum + (Number(c.lessonsCount) || 0), 0),
        [courses]
    )

    const totalStudentEnrollments = useMemo(
        () =>
            courses.reduce((sum, c) => {
                const ids = c.enrolledStudents
                return sum + (Array.isArray(ids) ? ids.length : 0)
            }, 0),
        [courses]
    )

    const publishedCount = useMemo(
        () => courses.filter((c) => c.status === 'PUBLISHED').length,
        [courses]
    )

    const draftCount = useMemo(() => courses.filter((c) => c.status === 'DRAFT').length, [courses])

    return { courses, loading, totalLessons, totalStudentEnrollments, publishedCount, draftCount }
}

export default useTeacherDashboardData
