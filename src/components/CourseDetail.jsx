import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  FiPlay, 
  FiFile, 
  FiUpload, 
  FiPlus, 
  FiX,
  FiCheckCircle,
  FiClock,
  FiBook
} from 'react-icons/fi'
import api from '../services/api'
import { canUpload, isTeacher, isAdmin } from '../utils/roles'
import './CourseDetail.css'

const CourseDetail = () => {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [lessonFiles, setLessonFiles] = useState({}) // { lessonId: [files] }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [newLesson, setNewLesson] = useState({ title: '', description: '', orderNumber: 1 })
  const [uploadingFile, setUploadingFile] = useState(null) // { lessonId: true/false }
  const [statusChanging, setStatusChanging] = useState(false)
  const [lessonProgress, setLessonProgress] = useState({}) // { lessonId: { completed: bool, progress: number } }

  useEffect(() => {
    loadCourse()
    loadLessons()
    loadProgress()
  }, [id])

  const loadProgress = () => {
    // Загружаем прогресс из localStorage
    if (typeof Storage !== 'undefined') {
      const progressData = localStorage.getItem('videoProgress')
      if (progressData) {
        try {
          const progress = JSON.parse(progressData)
          const lessonProgressMap = {}
          
          // Группируем прогресс по урокам
          Object.keys(progress).forEach(key => {
            const [courseId, lessonId, videoId] = key.split('-')
            if (courseId === id) {
              if (!lessonProgressMap[lessonId]) {
                lessonProgressMap[lessonId] = { completed: 0, total: 0, videos: {} }
              }
              lessonProgressMap[lessonId].videos[videoId] = progress[key]
              lessonProgressMap[lessonId].total++
              if (progress[key].completed) {
                lessonProgressMap[lessonId].completed++
              }
            }
          })
          
          // Вычисляем процент прогресса для каждого урока
          const progressPercentages = {}
          Object.keys(lessonProgressMap).forEach(lessonId => {
            const lesson = lessonProgressMap[lessonId]
            progressPercentages[lessonId] = {
              completed: lesson.completed === lesson.total && lesson.total > 0,
              progress: lesson.total > 0 ? (lesson.completed / lesson.total) * 100 : 0
            }
          })
          
          setLessonProgress(progressPercentages)
        } catch (e) {
          console.error('Error parsing progress:', e)
        }
      }
    }
  }

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`)
      setCourse(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error loading course:', err)
      setError('Failed to load course')
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Изменить статус курса на "${newStatus}"?`)) {
      return
    }
    
    setStatusChanging(true)
    try {
      const response = await api.patch(`/courses/${id}/status`, { status: newStatus })
      setCourse(response.data)
      setError(null)
      alert(`Статус курса успешно изменен на "${newStatus}"`)
    } catch (err) {
      console.error('Error changing course status:', err)
      setError('Ошибка при изменении статуса курса')
    } finally {
      setStatusChanging(false)
    }
  }

  const loadLessons = async () => {
    try {
      const response = await api.get(`/courses/${id}/lessons`)
      const lessonsData = response.data
      setLessons(lessonsData)
      
      // Загружаем файлы для каждого урока через file-service
      const filesMap = {}
      for (const lesson of lessonsData) {
        try {
          const filesResponse = await api.get(`/files/lesson/${lesson.id}`)
          filesMap[lesson.id] = filesResponse.data
        } catch (err) {
          console.error(`Error loading files for lesson ${lesson.id}:`, err)
          filesMap[lesson.id] = []
        }
      }
      setLessonFiles(filesMap)
      
      setLoading(false)
      loadProgress() // Обновляем прогресс после загрузки уроков
    } catch (err) {
      console.error('Error loading lessons:', err)
      setError('Failed to load lessons')
      setLoading(false)
    }
  }

  const handleCreateLesson = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post(`/courses/${id}/lessons`, newLesson)
      const newLessonData = response.data
      setLessons([...lessons, newLessonData])
      setLessonFiles({ ...lessonFiles, [newLessonData.id]: [] })
      setShowLessonForm(false)
      setNewLesson({ title: '', description: '', orderNumber: lessons.length + 1 })
    } catch (err) {
      console.error('Error creating lesson:', err)
      setError('Failed to create lesson')
    }
  }

  const handleFileUpload = async (lessonId, file) => {
    try {
      setUploadingFile({ ...uploadingFile, [lessonId]: true })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('lessonId', lessonId)
      
      const response = await api.post(`/files/upload-to-lesson`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Обновляем список файлов для урока
      setLessonFiles({
        ...lessonFiles,
        [lessonId]: [...(lessonFiles[lessonId] || []), response.data]
      })
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
    } finally {
      setUploadingFile({ ...uploadingFile, [lessonId]: false })
    }
  }

  const getCourseProgress = () => {
    if (lessons.length === 0) return 0
    const completedLessons = Object.values(lessonProgress).filter(p => p.completed).length
    return (completedLessons / lessons.length) * 100
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
    return <div className="loading">Loading course...</div>
  }

  if (!course) {
    return <div className="error">Course not found</div>
  }

  const courseProgress = getCourseProgress()

  return (
    <div className="course-detail">
      <div className="course-hero">
        {course.imageUrl && (
          <img src={course.imageUrl} alt={course.title} className="course-hero-image" />
        )}
        <div className="course-hero-content">
          <div className="course-hero-header">
            <h1>{course.title}</h1>
            <div className="course-status-section">
              <span className={`course-status ${course.status}`}>{course.status}</span>
              {(isTeacher(window.keycloak) || isAdmin(window.keycloak)) && (
                <select
                  className="status-select"
                  value={course.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusChanging}
                  title="Изменить статус курса"
                >
                  <option value="DRAFT">DRAFT (Черновик)</option>
                  <option value="PUBLISHED">PUBLISHED (Опубликован)</option>
                  <option value="ARCHIVED">ARCHIVED (Архивирован)</option>
                </select>
              )}
            </div>
          </div>
          <p className="course-hero-description">{course.description}</p>
          <div className="course-hero-meta">
            <div className="meta-item">
              <FiBook />
              <span>{lessons.length} {lessons.length === 1 ? 'урок' : 'уроков'}</span>
            </div>
            {lessons.length > 0 && (
              <div className="meta-item">
                <FiCheckCircle />
                <span>{Math.round(courseProgress)}% завершено</span>
              </div>
            )}
          </div>
          {lessons.length > 0 && (
            <div className="course-progress-bar">
              <div 
                className="course-progress-fill" 
                style={{ width: `${courseProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="course-content-section">
        <div className="lessons-section">
          <div className="lessons-header">
            <h2>Course Content</h2>
            {canUpload(window.keycloak) && (
              <button
                className="btn btn-primary"
                onClick={() => setShowLessonForm(!showLessonForm)}
              >
                {showLessonForm ? (
                  <>
                    <FiX /> Cancel
                  </>
                ) : (
                  <>
                    <FiPlus /> Add Lesson
                  </>
                )}
              </button>
            )}
          </div>

          {showLessonForm && (
            <div className="card create-lesson-form">
              <h3>Create New Lesson</h3>
              <form onSubmit={handleCreateLesson}>
                <div className="form-group">
                  <label>Lesson Title</label>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                    required
                    placeholder="Enter lesson title"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    rows="3"
                    placeholder="Enter lesson description"
                  />
                </div>
                <div className="form-group">
                  <label>Order Number</label>
                  <input
                    type="number"
                    value={newLesson.orderNumber}
                    onChange={(e) => setNewLesson({...newLesson, orderNumber: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <FiPlus /> Create Lesson
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowLessonForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {lessons.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <FiBook />
              </div>
              <p>
                No lessons yet. {canUpload(window.keycloak) && 'Create the first lesson!'}
              </p>
            </div>
          ) : (
            <div className="lessons-list">
              {lessons.map((lesson, index) => {
                const progress = lessonProgress[lesson.id] || { completed: false, progress: 0 }
                return (
                  <div key={lesson.id} className="lesson-card">
                    <div className="lesson-number">
                      {progress.completed ? (
                        <FiCheckCircle className="lesson-completed-icon" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="lesson-content">
                      <div className="lesson-header">
                        <h3>{lesson.title}</h3>
                        {progress.completed && (
                          <span className="lesson-completed-badge">
                            <FiCheckCircle /> Completed
                          </span>
                        )}
                      </div>
                      {lesson.description && <p className="lesson-description">{lesson.description}</p>}
                      
                      {progress.progress > 0 && !progress.completed && (
                        <div className="lesson-progress">
                          <div className="lesson-progress-bar">
                            <div 
                              className="lesson-progress-fill" 
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                          <span className="lesson-progress-text">{Math.round(progress.progress)}%</span>
                        </div>
                      )}
                      
                      {/* Кнопка для перехода к уроку */}
                      <div className="lesson-actions">
                        <Link
                          to={`/courses/${id}/lessons/${lesson.id}`}
                          className="btn btn-primary"
                        >
                          <FiBook /> Study Lesson
                        </Link>
                      </div>
                      
                      {/* Видео урока (краткий список) */}
                      {lesson.videos && lesson.videos.length > 0 && (
                        <div className="lesson-videos">
                          <h4>
                            <FiPlay /> Videos ({lesson.videos.length})
                          </h4>
                          <div className="videos-list">
                            {lesson.videos.slice(0, 3).map((video) => (
                              <Link
                                key={video.id}
                                to={`/courses/${id}/lessons/${lesson.id}/videos/${video.id}`}
                                className="video-link"
                              >
                                <FiPlay className="video-icon" />
                                <span className="video-title">{video.title}</span>
                              </Link>
                            ))}
                            {lesson.videos.length > 3 && (
                              <Link
                                to={`/courses/${id}/lessons/${lesson.id}`}
                                className="video-link see-more"
                              >
                                <span>+{lesson.videos.length - 3} more videos</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Файлы урока (краткий список) */}
                      <div className="lesson-files">
                        <h4>
                          <FiFile /> Files ({lessonFiles[lesson.id]?.length || 0})
                        </h4>
                        {lessonFiles[lesson.id] && lessonFiles[lesson.id].length > 0 ? (
                          <div className="files-list">
                            {lessonFiles[lesson.id].slice(0, 3).map((file) => (
                              <div
                                key={file.id}
                                className="file-link"
                                onClick={() => handleFileDownload(file.id, file.originalFileName)}
                                style={{ cursor: 'pointer' }}
                              >
                                <FiFile className="file-icon" />
                                <span>{file.originalFileName}</span>
                              </div>
                            ))}
                            {lessonFiles[lesson.id].length > 3 && (
                              <Link
                                to={`/courses/${id}/lessons/${lesson.id}`}
                                className="file-link see-more"
                              >
                                <span>+{lessonFiles[lesson.id].length - 3} more files</span>
                              </Link>
                            )}
                          </div>
                        ) : (
                          <p className="no-files">No files yet</p>
                        )}
                        
                        {/* Загрузка файла к уроку */}
                        {canUpload(window.keycloak) && (
                          <div className="file-upload-section">
                            <input
                              type="file"
                              id={`file-upload-${lesson.id}`}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleFileUpload(lesson.id, e.target.files[0])
                                }
                              }}
                            />
                            <label
                              htmlFor={`file-upload-${lesson.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ cursor: 'pointer', display: 'inline-flex' }}
                            >
                              {uploadingFile?.[lesson.id] ? (
                                <>
                                  <FiClock /> Uploading...
                                </>
                              ) : (
                                <>
                                  <FiUpload /> Add File
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
