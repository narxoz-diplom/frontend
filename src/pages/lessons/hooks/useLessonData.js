import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getLesson, getLessons, getLessonVideos } from '@/shared/api/lessonsApi'
import { getCourse } from '@/shared/api/coursesApi'
import { getLessonFiles } from '@/shared/api/filesApi'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'

export function useLessonData(courseId, lessonId) {
  const { t } = useTranslation()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [videos, setVideos] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadLesson = async () => {
      try {
        setLoading(true)
        const lessonResponse = await getLesson(lessonId)
        setLesson(lessonResponse.data)
        const courseResponse = await getCourse(courseId)
        setCourse(normalizeCourseViewerResponse(courseResponse.data).course)
        const lessonsResponse = await getLessons(courseId)
        setLessons(lessonsResponse.data)
        const videosResponse = await getLessonVideos(lessonId)
        setVideos(videosResponse.data || [])
        const filesResponse = await getLessonFiles(lessonId)
        setFiles(filesResponse.data || [])
        setLoading(false)
      } catch {
        setError(t('coursePage.loadLessonsError'))
        setLoading(false)
      }
    }
    loadLesson()
  }, [courseId, lessonId])

  const refreshVideos = useCallback(async () => {
    const videosResponse = await getLessonVideos(lessonId)
    setVideos(videosResponse.data || [])
  }, [lessonId])

  const refreshFiles = useCallback(async () => {
    const filesResponse = await getLessonFiles(lessonId)
    setFiles(filesResponse.data || [])
  }, [lessonId])

  return {
    lesson,
    setLesson,
    course,
    lessons,
    videos,
    files,
    loading,
    error,
    setError,
    refreshVideos,
    refreshFiles
  }
}
