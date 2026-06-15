import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCourseProgress, markLessonComplete as markLessonCompleteApi } from '@/shared/api/coursesApi'

export function mapCourseProgressLessons(data) {
  const map = {}
  ;(data?.lessons || []).forEach((item) => {
    map[item.lessonId] = {
      completed: !!item.completed,
      progress: item.completed ? 100 : 0,
    }
  })
  return map
}

export function useCourseProgress(courseId) {
  const [lessonProgress, setLessonProgress] = useState({})
  const [summary, setSummary] = useState({
    totalLessons: 0,
    completedLessons: 0,
    progressPercent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [markingLessonId, setMarkingLessonId] = useState(null)

  const reload = useCallback(async () => {
    if (!courseId) {
      setLessonProgress({})
      setSummary({ totalLessons: 0, completedLessons: 0, progressPercent: 0 })
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await getCourseProgress(courseId)
      setLessonProgress(mapCourseProgressLessons(data))
      setSummary({
        totalLessons: data?.totalLessons ?? 0,
        completedLessons: data?.completedLessons ?? 0,
        progressPercent: data?.progressPercent ?? 0,
      })
    } catch (err) {
      setLessonProgress({})
      setSummary({ totalLessons: 0, completedLessons: 0, progressPercent: 0 })
      setError(err.response?.data?.message || err.message || 'load_failed')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    reload()
  }, [reload])

  const markLessonComplete = useCallback(async (lessonId) => {
    if (!lessonId || markingLessonId) return false
    setMarkingLessonId(lessonId)
    try {
      await markLessonCompleteApi(lessonId)
      await reload()
      return true
    } catch {
      return false
    } finally {
      setMarkingLessonId(null)
    }
  }, [markingLessonId, reload])

  const currentLessonProgress = useCallback(
    (lessonId) => lessonProgress[Number(lessonId)] || lessonProgress[lessonId] || { completed: false, progress: 0 },
    [lessonProgress],
  )

  return useMemo(() => ({
    lessonProgress,
    summary,
    loading,
    error,
    reload,
    markLessonComplete,
    markingLessonId,
    currentLessonProgress,
  }), [lessonProgress, summary, loading, error, reload, markLessonComplete, markingLessonId, currentLessonProgress])
}
