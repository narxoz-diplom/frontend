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
  FiBook,
  FiTrash2,
  FiEye,
  FiCheckSquare,
  FiArrowLeft
} from 'react-icons/fi'
import api from '../services/api'
import { useAlert } from '../context/AlertProvider'
import { canUpload, isTeacher, isAdmin } from '../utils/roles'
import { pickLocalized } from '../i18n/localize'
import './CourseDetail.css'

const CourseDetail = () => {
  const { id } = useParams()
  const { confirm, toast } = useAlert()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [tests, setTests] = useState([])
  const [lessonFiles, setLessonFiles] = useState({}) // { lessonId: [files] }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [newLesson, setNewLesson] = useState({ title: '', description: '', orderNumber: 1 })
  const [uploadingFile, setUploadingFile] = useState(null) // { lessonId: true/false }
  const [statusChanging, setStatusChanging] = useState(false)
  const [lessonProgress, setLessonProgress] = useState({}) // { lessonId: { completed: bool, progress: number } }
  const [courseViews, setCourseViews] = useState(0)

  useEffect(() => {
    loadCourse()
    loadLessons()
    loadTests()
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
      
      // Загружаем просмотры курса
      try {
        const viewsResponse = await api.get(`/courses/${id}/views`)
        setCourseViews(viewsResponse.data || 0)
      } catch (err) {
        console.error('Error loading course views:', err)
        setCourseViews(0)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading course:', err)
      setError('Failed to load course')
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    const ok = await confirm({
      title: 'Статус курса',
      message: `Изменить статус курса на «${newStatus}»?`,
      confirmText: 'Изменить',
      cancelText: 'Отмена',
      variant: 'default'
    })
    if (!ok) return

    setStatusChanging(true)
    try {
      const response = await api.patch(`/courses/${id}/status`, { status: newStatus })
      setCourse(response.data)
      setError(null)
      toast(`Статус курса изменён на «${newStatus}»`, 'success')
    } catch (err) {
      console.error('Error changing course status:', err)
      setError('Ошибка при изменении статуса курса')
    } finally {
      setStatusChanging(false)
    }
  }

  const loadTests = async () => {
    try {
      const response = await api.get(`/courses/${id}/tests`)
      setTests(response.data || [])
    } catch (err) {
      console.error('Error loading tests:', err)
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

  const handleDeleteFile = async (fileId, lessonId) => {
    const ok = await confirm({
      title: 'Удаление файла',
      message: 'Удалить этот файл?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await api.delete(`/files/${fileId}`)
      // Обновляем список файлов для урока
      const filesResponse = await api.get(`/files/lesson/${lessonId}`)
      setLessonFiles({
        ...lessonFiles,
        [lessonId]: filesResponse.data
      })
      setError(null)
    } catch (err) {
      console.error('Error deleting file:', err)
      setError('Ошибка при удалении файла')
    }
  }

  if (loading) {
    return <div className="loading">Loading course...</div>
  }

  if (!course) {
    return <div className="error">Course not found</div>
  }

  const courseProgress = getCourseProgress()

  const statusLabel =
    course.status === 'PUBLISHED'
      ? 'Опубликован'
      : course.status === 'DRAFT'
        ? 'Черновик'
        : course.status === 'ARCHIVED'
          ? 'В архиве'
          : course.status

  return (
    <div className="course-detail course-detail--v2">
      <header className="course-page__intro">
        <Link to="/courses" className="course-page__back">
          <FiArrowLeft aria-hidden /> К каталогу курсов
        </Link>
        {course.imageUrl && (
          <div className="course-page__cover-wrap">
            <img src={course.imageUrl} alt="" className="course-page__cover" decoding="async" />
          </div>
        )}
        <p className="course-page__kicker">Курс · {statusLabel}</p>
        <div className="course-page__title-row">
          <h1 className="course-page__title">{pickLocalized(course, 'title')}</h1>
          <div className="course-page__status-block">
            <span className={`course-status course-status--pill ${course.status}`}>{course.status}</span>
            {(isTeacher(window.keycloak) || isAdmin(window.keycloak)) && (
              <select
                className="course-page__status-select"
                value={course.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusChanging}
                title="Изменить статус курса"
                aria-label="Статус курса"
              >
                <option value="DRAFT">DRAFT (Черновик)</option>
                <option value="PUBLISHED">PUBLISHED (Опубликован)</option>
                <option value="ARCHIVED">ARCHIVED (Архивирован)</option>
              </select>
            )}
          </div>
        </div>
        {pickLocalized(course, 'description') && <p className="course-page__lead">{pickLocalized(course, 'description')}</p>}
        <dl className="course-page__meta">
          <div>
            <dt>Уроков</dt>
            <dd>{lessons.length}</dd>
          </div>
          <div>
            <dt>Тестов</dt>
            <dd>{tests.length}</dd>
          </div>
          {lessons.length > 0 && (
            <div>
              <dt>Прогресс</dt>
              <dd>{Math.round(courseProgress)}%</dd>
            </div>
          )}
          <div>
            <dt>Просмотров</dt>
            <dd>{courseViews}</dd>
          </div>
        </dl>
        {lessons.length > 0 && (
          <div className="course-page__progress" aria-label="Прогресс по урокам">
            <div className="course-page__progress-track">
              <div className="course-page__progress-fill" style={{ width: `${courseProgress}%` }} />
            </div>
          </div>
        )}
      </header>

      {error && <div className="course-page__error">{error}</div>}

      <div className="course-content-section">
        <section className="lessons-section course-panel">
          <div className="lessons-header">
            <div className="course-section-head__text">
              <span className="course-section-head__eyebrow">Программа</span>
              <div className="lessons-header-titles">
                <h2>Уроки</h2>
              {canUpload(window.keycloak) && (
                <p className="lessons-manage-hint">
                  Удаление уроков и курса — в «Редактировать курс».
                </p>
              )}
            </div>
            </div>
            {canUpload(window.keycloak) && (
              <>
                <Link to={`/courses/${id}/edit`} className="btn-edit">
                  Редактировать курс
                </Link>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowLessonForm(!showLessonForm)}
                >
                {showLessonForm ? (
                  <>
                    <FiX /> Отмена
                  </>
                ) : (
                  <>
                    <FiPlus /> Добавить урок
                  </>
                )}
              </button>
              </>
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
                    className="btn btn-cancel"
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
                const isCompleted = progress.completed === true
                return (
                  <div key={lesson.id} className="lesson-card">
                    <div className="lesson-number">
                      {isCompleted ? (
                        <FiCheckCircle className="lesson-completed-icon" />
                      ) : (
                        <span className="lesson-number-text">{index + 1}</span>
                      )}
                    </div>
                    <div className="lesson-content">
                      <div className="lesson-header">
                        <h3>{pickLocalized(lesson, 'title')}</h3>
                        {progress.completed && (
                          <span className="lesson-completed-badge">
                            <FiCheckCircle /> Completed
                          </span>
                        )}
                      </div>
                      {pickLocalized(lesson, 'description') && <p className="lesson-description">{pickLocalized(lesson, 'description')}</p>}
                      
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
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                              >
                                <div
                                  onClick={() => handleFileDownload(file.id, file.originalFileName)}
                                  style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <FiFile className="file-icon" />
                                  <span>{file.originalFileName}</span>
                                </div>
                                {canUpload(window.keycloak) && (
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteFile(file.id, lesson.id)
                                    }}
                                    title="Удалить файл"
                                  >
                                    <FiTrash2 />
                                  </button>
                                )}
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
        </section>

        <section className="tests-section course-panel">
          <div className="course-section-head__text course-section-head__text--tests">
            <span className="course-section-head__eyebrow">Проверка знаний</span>
            <h2>Тесты</h2>
          </div>
          {tests.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <FiCheckSquare />
              </div>
              <p>Тестов пока нет</p>
            </div>
          ) : (
            <div className="tests-list">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  to={`/courses/${id}/tests/${test.id}`}
                  className="test-card-link"
                >
                  <FiCheckSquare className="test-icon" />
                  <span>{test.title}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CourseDetail
