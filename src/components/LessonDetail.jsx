import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  FiArrowLeft, 
  FiPlay, 
  FiFile, 
  FiUpload, 
  FiEdit3,
  FiSave,
  FiX,
  FiCheckCircle,
  FiClock,
  FiBook,
  FiChevronRight,
  FiChevronLeft
} from 'react-icons/fi'
import api from '../services/api'
import { canUpload, isTeacher, isAdmin } from '../utils/roles'
import './LessonDetail.css'

const LessonDetail = () => {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [videos, setVideos] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', description: '', orderNumber: 1, file: null })
  const [lessonProgress, setLessonProgress] = useState({ completed: false, progress: 0 })

  useEffect(() => {
    loadLesson()
    loadProgress()
  }, [courseId, lessonId])

  const loadLesson = async () => {
    try {
      setLoading(true)
      
      // Загружаем урок
      const lessonResponse = await api.get(`/courses/lessons/${lessonId}`)
      setLesson(lessonResponse.data)
      setEditedContent(lessonResponse.data.content || '')
      
      // Загружаем курс
      const courseResponse = await api.get(`/courses/${courseId}`)
      setCourse(courseResponse.data)
      
      // Загружаем все уроки курса
      const lessonsResponse = await api.get(`/courses/${courseId}/lessons`)
      setLessons(lessonsResponse.data)
      
      // Загружаем видео урока (уже отсортированы по orderNumber)
      const videosResponse = await api.get(`/courses/lessons/${lessonId}/videos`)
      setVideos(videosResponse.data || [])
      
      // Загружаем файлы урока через file-service
      const filesResponse = await api.get(`/files/lesson/${lessonId}`)
      setFiles(filesResponse.data || [])
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading lesson:', err)
      setError('Failed to load lesson')
      setLoading(false)
    }
  }

  const loadProgress = () => {
    if (typeof Storage !== 'undefined') {
      const progressData = localStorage.getItem('videoProgress')
      if (progressData) {
        try {
          const progress = JSON.parse(progressData)
          let completed = 0
          let total = videos.length
          
          videos.forEach(video => {
            const key = `${courseId}-${lessonId}-${video.id}`
            if (progress[key]?.completed) {
              completed++
            }
          })
          
          setLessonProgress({
            completed: completed === total && total > 0,
            progress: total > 0 ? (completed / total) * 100 : 0
          })
        } catch (e) {
          console.error('Error parsing progress:', e)
        }
      }
    }
  }

  useEffect(() => {
    loadProgress()
  }, [videos.length])

  const handleSaveContent = async () => {
    try {
      const updatedLesson = { ...lesson, content: editedContent }
      const response = await api.put(`/courses/lessons/${lessonId}`, updatedLesson)
      setLesson(response.data)
      setIsEditingContent(false)
      setError(null)
    } catch (err) {
      console.error('Error saving content:', err)
      setError('Failed to save content')
    }
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!newVideo.file || !newVideo.title) {
      setError('Please provide video file and title')
      return
    }
    
    try {
      setUploadingVideo(true)
      
      // Шаг 1: Загружаем видео в file-service
      const uploadFormData = new FormData()
      uploadFormData.append('file', newVideo.file)
      
      const uploadResponse = await api.post(`/files/upload-video`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Шаг 2: Создаем метаданные видео в course-service
      const videoMetadata = {
        title: newVideo.title,
        description: newVideo.description || '',
        orderNumber: newVideo.orderNumber || videos.length + 1,
        videoUrl: uploadResponse.data.videoUrl,
        objectName: uploadResponse.data.objectName,
        fileSize: uploadResponse.data.fileSize,
        duration: 0,
        status: 'READY'
      }
      
      await api.post(`/courses/lessons/${lessonId}/videos`, videoMetadata)
      
      // Перезагружаем видео для получения актуального списка с правильной сортировкой
      const videosResponse = await api.get(`/courses/lessons/${lessonId}/videos`)
      setVideos(videosResponse.data || [])
      setShowVideoForm(false)
      setNewVideo({ title: '', description: '', orderNumber: videos.length + 1, file: null })
      setError(null)
    } catch (err) {
      console.error('Error uploading video:', err)
      if (err.response?.status === 413 || err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 
          'File size too large. Maximum allowed size is 2GB. Please upload a smaller file.'
        setError(errorMessage)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to upload video. Please try again.')
      }
    } finally {
      setUploadingVideo(false)
    }
  }

  const getCurrentLessonIndex = () => {
    return lessons.findIndex(l => l.id === parseInt(lessonId))
  }

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex < lessons.length - 1) {
      return lessons[currentIndex + 1]
    }
    return null
  }

  const getPrevLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex > 0) {
      return lessons[currentIndex - 1]
    }
    return null
  }

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      })
      
      // Создаем blob URL и скачиваем файл
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading file:', err)
      setError('Failed to download file. Please try again.')
    }
  }

  if (loading) {
    return <div className="loading">Loading lesson...</div>
  }

  if (!lesson || !course) {
    return <div className="error">Lesson not found</div>
  }

  const currentIndex = getCurrentLessonIndex()
  const nextLesson = getNextLesson()
  const prevLesson = getPrevLesson()
  const canEdit = canUpload(window.keycloak)

  return (
    <div className="lesson-detail">
      {/* Header */}
      <div className="lesson-header">
        <Link to={`/courses/${courseId}`} className="back-link">
          <FiArrowLeft /> Back to Course
        </Link>
        <div className="lesson-header-content">
          <div className="lesson-title-section">
            <span className="lesson-number">Lesson {currentIndex + 1}</span>
            <h1>{lesson.title}</h1>
            {lessonProgress.completed && (
              <span className="lesson-completed-badge">
                <FiCheckCircle /> Completed
              </span>
            )}
          </div>
          {lesson.description && (
            <p className="lesson-description">{lesson.description}</p>
          )}
          {videos.length > 0 && (
            <div className="lesson-progress">
              <div className="lesson-progress-bar">
                <div 
                  className="lesson-progress-fill" 
                  style={{ width: `${lessonProgress.progress}%` }}
                />
              </div>
              <span className="lesson-progress-text">
                {Math.round(lessonProgress.progress)}% complete
              </span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="lesson-content-wrapper">
        {/* Main Content */}
        <div className="lesson-main-content">
          {/* Конспект урока */}
          <div className="lesson-notes-section">
            <div className="section-header">
              <h2>
                <FiBook /> Lesson Notes
              </h2>
              {canEdit && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (isEditingContent) {
                      setIsEditingContent(false)
                      setEditedContent(lesson.content || '')
                    } else {
                      setIsEditingContent(true)
                    }
                  }}
                >
                  {isEditingContent ? (
                    <>
                      <FiX /> Cancel
                    </>
                  ) : (
                    <>
                      <FiEdit3 /> Edit
                    </>
                  )}
                </button>
              )}
            </div>
            
            {isEditingContent ? (
              <div className="content-editor">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Enter lesson notes in Markdown format..."
                  className="content-textarea"
                  rows="20"
                />
                <div className="editor-actions">
                  <button className="btn btn-primary" onClick={handleSaveContent}>
                    <FiSave /> Save Notes
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditingContent(false)
                      setEditedContent(lesson.content || '')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="lesson-notes-content">
                {lesson.content ? (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                    >
                      {lesson.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="empty-notes">
                    <p>No notes available for this lesson.</p>
                    {canEdit && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setIsEditingContent(true)}
                      >
                        <FiEdit3 /> Add Notes
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Видео */}
          <div className="lesson-videos-section">
            <div className="section-header">
              <h2>
                <FiPlay /> Videos ({videos.length})
              </h2>
              {canEdit && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowVideoForm(!showVideoForm)}
                >
                  {showVideoForm ? (
                    <>
                      <FiX /> Cancel
                    </>
                  ) : (
                    <>
                      <FiUpload /> Add Video
                    </>
                  )}
                </button>
              )}
            </div>

            {showVideoForm && canEdit && (
              <div className="video-upload-form">
                <form onSubmit={handleVideoUpload}>
                  <div className="form-group">
                    <label>Video Title *</label>
                    <input
                      type="text"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                      required
                      placeholder="Enter video title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                      rows="3"
                      placeholder="Enter video description"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Order Number</label>
                      <input
                        type="number"
                        value={newVideo.orderNumber}
                        onChange={(e) => setNewVideo({...newVideo, orderNumber: parseInt(e.target.value) || 1})}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Video File *</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setNewVideo({...newVideo, file: e.target.files[0]})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? (
                        <>
                          <FiClock /> Uploading...
                        </>
                      ) : (
                        <>
                          <FiUpload /> Upload Video
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowVideoForm(false)
                        setNewVideo({ title: '', description: '', orderNumber: videos.length + 1, file: null })
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {videos.length === 0 ? (
              <div className="empty-state">
                <FiPlay className="empty-icon" />
                <p>No videos available for this lesson.</p>
                {canEdit && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowVideoForm(true)}
                  >
                    <FiUpload /> Add First Video
                  </button>
                )}
              </div>
            ) : (
              <div className="videos-list">
                {videos.map((video, index) => {
                  const progressKey = `${courseId}-${lessonId}-${video.id}`
                  const progressData = localStorage.getItem('videoProgress')
                  let isCompleted = false
                  if (progressData) {
                    try {
                      const progress = JSON.parse(progressData)
                      isCompleted = progress[progressKey]?.completed || false
                    } catch (e) {}
                  }
                  
                  return (
                    <Link
                      key={video.id}
                      to={`/courses/${courseId}/lessons/${lessonId}/videos/${video.id}`}
                      className="video-card"
                    >
                      <div className="video-card-number">{index + 1}</div>
                      <div className="video-card-content">
                        <div className="video-card-header">
                          <h3>{video.title}</h3>
                          {isCompleted && (
                            <FiCheckCircle className="completed-icon" />
                          )}
                        </div>
                        {video.description && (
                          <p className="video-card-description">{video.description}</p>
                        )}
                        <div className="video-card-meta">
                          {video.duration > 0 && (
                            <span>
                              <FiClock /> {formatDuration(video.duration)}
                            </span>
                          )}
                          <span>{formatFileSize(video.fileSize)}</span>
                        </div>
                      </div>
                      <FiChevronRight className="video-card-arrow" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Файлы */}
          <div className="lesson-files-section">
            <div className="section-header">
              <h2>
                <FiFile /> Files ({files.length})
              </h2>
              {canEdit && (
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  <FiUpload /> Add File
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      if (e.target.files[0]) {
                        try {
                          const formData = new FormData()
                          formData.append('file', e.target.files[0])
                          formData.append('lessonId', lessonId)
                          await api.post(`/files/upload-to-lesson`, formData, {
                            headers: {
                              'Content-Type': 'multipart/form-data'
                            }
                          })
                          // Перезагружаем файлы для получения актуального списка
                          const filesResponse = await api.get(`/files/lesson/${lessonId}`)
                          setFiles(filesResponse.data || [])
                          setError(null)
                        } catch (err) {
                          console.error('Error uploading file:', err)
                          if (err.response?.status === 413 || err.response?.status === 400) {
                            const errorMessage = err.response?.data?.message || 
                              'File size too large. Maximum allowed size is 2GB. Please upload a smaller file.'
                            setError(errorMessage)
                          } else if (err.response?.data?.message) {
                            setError(err.response.data.message)
                          } else {
                            setError('Failed to upload file. Please try again.')
                          }
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {files.length === 0 ? (
              <div className="empty-state">
                <FiFile className="empty-icon" />
                <p>No files available for this lesson.</p>
              </div>
            ) : (
              <div className="files-list">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="file-card"
                    onClick={() => handleFileDownload(file.id, file.originalFileName)}
                    style={{ cursor: 'pointer' }}
                  >
                    <FiFile className="file-icon" />
                    <div className="file-card-content">
                      <h3>{file.originalFileName}</h3>
                      <div className="file-card-meta">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>{file.contentType}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lesson-sidebar">
          <div className="sidebar-section">
            <h3>Course: {course.title}</h3>
            <Link to={`/courses/${courseId}`} className="course-link">
              View Course
            </Link>
          </div>

          <div className="sidebar-section">
            <h3>All Lessons</h3>
            <div className="lessons-nav">
              {lessons.map((l, index) => (
                <Link
                  key={l.id}
                  to={`/courses/${courseId}/lessons/${l.id}`}
                  className={`lesson-nav-item ${l.id === parseInt(lessonId) ? 'active' : ''}`}
                >
                  <span className="lesson-nav-number">{index + 1}</span>
                  <span className="lesson-nav-title">{l.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="lesson-navigation">
            {prevLesson && (
              <Link
                to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="nav-btn prev-btn"
              >
                <FiChevronLeft /> Previous Lesson
              </Link>
            )}
            {nextLesson && (
              <Link
                to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="nav-btn next-btn"
              >
                Next Lesson <FiChevronRight />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default LessonDetail

