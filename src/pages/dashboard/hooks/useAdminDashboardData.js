import { useCallback, useEffect, useState } from 'react'
import { getPlatformStats } from '@/shared/api/coursesApi'
import { getFiles } from '@/shared/api/filesApi'
import { getNews } from '@/shared/api/newsApi'

const emptyPlatformStats = {
    totalCourses: 0,
    uniqueInstructors: 0,
    publishedCourses: 0,
    draftCourses: 0,
    archivedCourses: 0,
    totalLessons: 0,
    totalTests: 0,
    totalEnrollmentSlots: 0,
}

const useAdminDashboardData = () => {
    const [platform, setPlatform] = useState(emptyPlatformStats)
    const [filesCount, setFilesCount] = useState(0)
    const [newsCount, setNewsCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const loadStats = useCallback(async () => {
        try {
            setLoading(true)
            const [statsRes, filesRes, newsRes] = await Promise.all([
                getPlatformStats(),
                getFiles().catch(() => ({ data: [] })),
                getNews().catch(() => ({ data: [] })),
            ])
            setPlatform(statsRes.data || emptyPlatformStats)
            setFilesCount(Array.isArray(filesRes.data) ? filesRes.data.length : 0)
            setNewsCount(Array.isArray(newsRes.data) ? newsRes.data.length : 0)
        } catch {
            setPlatform(emptyPlatformStats)
            setFilesCount(0)
            setNewsCount(0)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    return { platform, filesCount, newsCount, loading }
}

export default useAdminDashboardData
