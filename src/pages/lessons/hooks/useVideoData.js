import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getLessons, getLessonVideos } from '@/shared/api/lessonsApi'
import { getCourse } from '@/shared/api/coursesApi'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'

const resolveVideoUrl = (videoUrl) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8083'
  if (videoUrl.startsWith('/api')) {
    return apiUrl.startsWith('http') ? `${apiUrl}${videoUrl}` : videoUrl
  }
  if (!videoUrl.startsWith('http')) {
    return `/api${videoUrl}`
  }
  return videoUrl
}

export function useVideoData(courseId, lessonId, videoId) {
  const { t } = useTranslation()
  const [video, setVideo] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true)
        const videosResponse = await getLessonVideos(lessonId)
        const foundVideo = videosResponse.data.find(v => v.id === parseInt(videoId))
        if (foundVideo) {
          setVideo(foundVideo)
          setVideoUrl(resolveVideoUrl(foundVideo.videoUrl))
        }

        const lessonsResponse = await getLessons(courseId)
        const allLessons = lessonsResponse.data || []
        setLessons(allLessons)
        setLesson(allLessons.find(l => l.id === parseInt(lessonId)))

        const courseResponse = await getCourse(courseId)
        setCourse(normalizeCourseViewerResponse(courseResponse.data).course)

        setLoading(false)
      } catch {
        setError(t('videoPage.loadError'))
        setLoading(false)
      }
    }
    loadVideo()
  }, [videoId, lessonId, courseId])

  return { video, lesson, course, lessons, loading, error, setError, videoUrl }
}
