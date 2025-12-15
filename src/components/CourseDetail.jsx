import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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

  useEffect(() => {
    loadCourse()
    loadLessons()
  }, [id])

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
      
      // Загружаем файлы для каждого урока
      const filesMap = {}
      for (const lesson of lessonsData) {
        try {
          const filesResponse = await api.get(`/courses/lessons/${lesson.id}/files`)
          filesMap[lesson.id] = filesResponse.data
        } catch (err) {
          console.error(`Error loading files for lesson ${lesson.id}:`, err)
          filesMap[lesson.id] = []
        }
      }
      setLessonFiles(filesMap)
      
      setLoading(false)
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
      
      const response = await api.post(`/courses/lessons/${lessonId}/files`, formData, {
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
      setError('Failed to upload file')
    } finally {
      setUploadingFile({ ...uploadingFile, [lessonId]: false })
    }
  }

  if (loading) {
    return <div className="loading">Loading course...</div>
  }

  if (!course) {
    return <div className="error">Course not found</div>
  }

  return (
    <div className="course-detail">
      <div className="course-hero">
        {course.imageUrl && (
          <img src={course.imageUrl} alt={course.title} className="course-hero-image" />
        )}
        <div className="course-hero-content">
          <h1>{course.title}</h1>
          <p className="course-hero-description">{course.description}</p>
          <div className="course-hero-meta">
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
            <span>{lessons.length} уроков</span>
          </div>
        </div>
      </div>

      <div className="course-content-section">
        <div className="lessons-section">
          <div className="lessons-header">
            <h2>Course Content</h2>
            {canUpload(window.keycloak) && (
              <button
                className="btn btn-primary"
                onClick={() => setShowLessonForm(!showLessonForm)}
              >
                {showLessonForm ? 'Cancel' : '+ Add Lesson'}
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
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    rows="3"
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
                <button type="submit" className="btn btn-primary">Create Lesson</button>
              </form>
            </div>
          )}

          {lessons.length === 0 ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
                No lessons yet. {canUpload(window.keycloak) && 'Create the first lesson!'}
              </p>
            </div>
          ) : (
            <div className="lessons-list">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="lesson-card">
                  <div className="lesson-number">{index + 1}</div>
                  <div className="lesson-content">
                    <h3>{lesson.title}</h3>
                    {lesson.description && <p>{lesson.description}</p>}
                    
                    {/* Видео урока */}
                    {lesson.videos && lesson.videos.length > 0 && (
                      <div className="lesson-videos">
                        <h4>Videos:</h4>
                        {lesson.videos.map((video) => (
                          <Link
                            key={video.id}
                            to={`/courses/${id}/lessons/${lesson.id}/videos/${video.id}`}
                            className="video-link"
                          >
                            ▶ {video.title}
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* Файлы урока */}
                    <div className="lesson-files">
                      <h4>Files:</h4>
                      {lessonFiles[lesson.id] && lessonFiles[lesson.id].length > 0 ? (
                        <div className="files-list">
                          {lessonFiles[lesson.id].map((file) => (
                            <a
                              key={file.id}
                              href={`/api/files/${file.id}/download`}
                              className="file-link"
                              download
                            >
                              📄 {file.originalFileName}
                            </a>
                          ))}
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
                            style={{ cursor: 'pointer', display: 'inline-block' }}
                          >
                            {uploadingFile?.[lesson.id] ? 'Uploading...' : '+ Add File'}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseDetail


