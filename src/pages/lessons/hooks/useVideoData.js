import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { getLessons, getLessonVideos } from '@/shared/api/lessonsApi'
import { getCourse } from '@/shared/api/coursesApi'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { buildVideoStreamPath } from '../lib/videoStreamUrl'

const apiOrigin = () => {
  const configured = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (configured.startsWith('http')) return configured
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:8083'
}

const resolveVideoUrl = (video, lessonId, videoId) => {
  const streamPath = buildVideoStreamPath(video, lessonId, videoId)
  if (!streamPath) return ''
  const origin = apiOrigin()
  let resolved = streamPath.startsWith('/api') ? `${origin}${streamPath}` : streamPath
  if (auth.token) {
    const separator = resolved.includes('?') ? '&' : '?'
    resolved = `${resolved}${separator}access_token=${encodeURIComponent(auth.token)}`
  }
  return resolved
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
        await auth.initSafe()
        const videosResponse = await getLessonVideos(lessonId)
        const foundVideo = videosResponse.data.find(v => v.id === parseInt(videoId))
        if (foundVideo) {
          setVideo(foundVideo)
          setVideoUrl(resolveVideoUrl(foundVideo, lessonId, videoId))
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
