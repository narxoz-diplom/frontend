import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { canUpload } from '../utils/roles'
import './VideoPlayer.css'

const VideoPlayer = () => {
  const { courseId, lessonId, videoId } = useParams()
  const [video, setVideo] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    loadVideo()
  }, [videoId])

  const loadVideo = async () => {
    try {
      // Загружаем видео и урок
      const videosResponse = await api.get(`/courses/lessons/${lessonId}/videos`)
      const foundVideo = videosResponse.data.find(v => v.id === parseInt(videoId))
      
      if (foundVideo) {
        setVideo(foundVideo)
        setVideoUrl(`/api${foundVideo.videoUrl}`)
      }

      const lessonsResponse = await api.get(`/courses/${courseId}/lessons`)
      const foundLesson = lessonsResponse.data.find(l => l.id === parseInt(lessonId))
      setLesson(foundLesson)

      const courseResponse = await api.get(`/courses/${courseId}`)
      setCourse(courseResponse.data)

      setLoading(false)
    } catch (err) {
      setError('Failed to load video')
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading video...</div>
  }

  if (!video || !lesson || !course) {
    return <div className="error">Video not found</div>
  }

  return (
    <div className="video-player-page">
      <div className="video-player-container">
        <div className="video-main">
          <div className="video-wrapper">
            <video
              controls
              src={videoUrl}
              className="video-element"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="video-info">
            <h1>{video.title}</h1>
            {video.description && <p>{video.description}</p>}
            <div className="video-meta">
              <span>Duration: {formatDuration(video.duration)}</span>
              <span>Size: {formatFileSize(video.fileSize)}</span>
            </div>
          </div>
        </div>

        <div className="video-sidebar">
          <div className="course-info">
            <Link to={`/courses/${courseId}`} className="course-link">
              ← Back to Course
            </Link>
            <h3>{course.title}</h3>
          </div>
          <div className="lessons-sidebar">
            <h4>Lessons</h4>
            {/* Здесь можно добавить список уроков */}
          </div>
        </div>
      </div>
    </div>
  )
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default VideoPlayer


