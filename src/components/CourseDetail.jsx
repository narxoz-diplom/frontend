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
  FiCheckSquare,
  FiArrowLeft,
  FiClipboard,
  FiChevronRight,
  FiEdit3,
  FiGlobe,
  FiArchive
} from 'react-icons/fi'
import api from '../services/api'
import { useAlert } from '../context/AlertProvider'
import { canUpload, isTeacher, isAdmin } from '../utils/roles'
import { normalizeCourseViewerResponse } from '../utils/courseResponse'
import { pickLocalized } from '../i18n/localize'
import { useTranslation } from 'react-i18next'
import './CourseDetail.css'

/** Совпадает с course-service LessonTestQualityGate (min-lesson-content-length по умолчанию 50). */
const MIN_LESSON_CONTENT_LENGTH = 50

const COURSE_STATUS_OPTIONS = [
  { value: 'DRAFT', labelKey: 'common.draft', Icon: FiEdit3 },
  { value: 'PUBLISHED', labelKey: 'dashboard.published', Icon: FiGlobe },
  { value: 'ARCHIVED', labelKey: 'common.archived', Icon: FiArchive }
]

const CourseDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { confirm, toast } = useAlert()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [tests, setTests] = useState([])
  const [lessonFiles, setLessonFiles] = useState({}) // { lessonId: [files] }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [newLesson, setNewLesson] = useState({ title: '', description: '', content: '', orderNumber: 1 })
  const [uploadingFile, setUploadingFile] = useState(null) // { lessonId: true/false }
  const [statusChanging, setStatusChanging] = useState(false)
  const [lessonProgress, setLessonProgress] = useState({}) // { lessonId: { completed: bool, progress: number } }
  const [courseViews, setCourseViews] = useState(0)
  const [participantsAccess, setParticipantsAccess] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    loadCourse()
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
      setLoading(true)
      setError(null)
      const response = await api.get(`/courses/${id}`)
      const { course: courseData, preview } = normalizeCourseViewerResponse(response.data)
      setCourse(courseData)
      setPreviewMode(preview)

      if (preview) {
        setLessons([])
        setTests([])
        setLessonFiles({})
        setParticipantsAccess(false)
      } else {
        try {
          await api.get(`/courses/${id}/participants`)
          setParticipantsAccess(true)
        } catch (pe) {
          console.warn('participants', pe)
          setParticipantsAccess(false)
        }
        await loadLessons()
        await loadTests()
        loadProgress()
      }

      try {
        const viewsResponse = await api.get(`/courses/${id}/views`)
        setCourseViews(viewsResponse.data || 0)
      } catch (err) {
        console.error('Error loading course views:', err)
        setCourseViews(0)
      }
    } catch (err) {
      console.error('Error loading course:', err)
      setError(t('coursePage.loadCourseError'))
      setCourse(null)
      setPreviewMode(false)
      setParticipantsAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollFromPreview = async () => {
    if (enrolling) return
    setEnrolling(true)
    setError(null)
    try {
      await api.post(`/courses/${id}/enroll`)
      toast(t('coursesPage.enrollSuccess', { title: pickLocalized(course, 'title') || t('common.course') }), 'success')
      await loadCourse()
    } catch (err) {
      console.error('Error enrolling:', err)
      setError(err.response?.data?.message || t('coursesPage.enrollError'))
    } finally {
      setEnrolling(false)
    }
  }

  const statusLabelFor = (s) =>
    s === 'PUBLISHED'
      ? t('dashboard.published')
      : s === 'DRAFT'
        ? t('common.draft')
        : s === 'ARCHIVED'
          ? t('common.archived')
          : s

  const handleStatusChange = async (newStatus) => {
    if (newStatus === course?.status) return

    const ok = await confirm({
      title: t('coursePage.changeStatusTitle'),
      message: t('coursePage.changeStatusMessage', { status: statusLabelFor(newStatus) }),
      confirmText: t('common.edit'),
      cancelText: t('common.cancel'),
      variant: 'default'
    })
    if (!ok) return

    setStatusChanging(true)
    try {
      const response = await api.patch(`/courses/${id}/status`, { status: newStatus })
      setCourse(response.data)
      setError(null)
      toast(t('coursePage.statusChanged', { status: statusLabelFor(newStatus) }), 'success')
    } catch (err) {
      console.error('Error changing course status:', err)
      setError(t('coursePage.statusChangeError'))
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
      loadProgress()
    } catch (err) {
      console.error('Error loading lessons:', err)
      setError(t('coursePage.loadLessonsError'))
    }
  }

  const handleCreateLesson = async (e) => {
    e.preventDefault()
    const trimmedContent = (newLesson.content || '').trim()
    if (trimmedContent.length < MIN_LESSON_CONTENT_LENGTH) {
      setError(t('coursePage.lessonContentTooShort', { min: MIN_LESSON_CONTENT_LENGTH }))
      return
    }
    try {
      const payload = { ...newLesson, content: trimmedContent }
      const response = await api.post(`/courses/${id}/lessons`, payload)
      const newLessonData = response.data
      setLessons((prev) => [...prev, newLessonData])
      setLessonFiles({ ...lessonFiles, [newLessonData.id]: [] })
      setShowLessonForm(false)
      setNewLesson({
        title: '',
        description: '',
        content: '',
        orderNumber: (newLessonData.orderNumber ?? 0) + 1
      })
      setError(null)
    } catch (err) {
      console.error('Error creating lesson:', err)
      const status = err.response?.status
      const body = err.response?.data
      const msg =
        typeof body === 'string'
          ? body
          : body?.message || (Array.isArray(body?.errors) ? body.errors.map((x) => x?.defaultMessage || x).join(' ') : null)
      if (status === 403) {
        setError(msg || t('coursePage.createLessonForbidden'))
      } else if (msg) {
        setError(msg)
      } else {
        setError(t('coursePage.createLessonError'))
      }
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
      title: t('filesPage.deleteTitle'),
      message: t('filesPage.deleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
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
      setError(t('filesPage.deleteError'))
    }
  }

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>
  }

  if (!course) {
    return <div className="error">{t('coursePage.loadCourseError')}</div>
  }

  const courseProgress = getCourseProgress()
  const mySub =
    typeof window !== 'undefined' && window.keycloak?.tokenParsed?.sub
      ? String(window.keycloak.tokenParsed.sub)
      : ''

  const statusLabel = statusLabelFor(course.status)
  const canManageCourse = isTeacher(window.keycloak) || isAdmin(window.keycloak)

  return (
    <div className="course-detail course-detail--v2">
      <header className="course-page__intro">
        <Link to="/courses" className="course-page__back">
          <FiArrowLeft aria-hidden /> {t('coursePage.backToCatalog')}
        </Link>
        {course.imageUrl && (
          <div className="course-page__cover-wrap">
            <img src={course.imageUrl} alt="" className="course-page__cover" decoding="async" />
          </div>
        )}
        <p className="course-page__kicker">{t('common.course')} · {statusLabel}</p>
        <div className="course-page__title-row">
          <h1 className="course-page__title">{pickLocalized(course, 'title')}</h1>
          <div className="course-page__status-block">
            {!canManageCourse && (
              <span className={`course-status course-status--pill ${course.status}`}>{statusLabel}</span>
            )}
            {canManageCourse && (
              <div
                className={`course-status-switcher ${statusChanging ? 'is-busy' : ''}`}
                role="group"
                aria-label={t('coursePage.changeStatusTitle')}
              >
                {COURSE_STATUS_OPTIONS.map(({ value, labelKey, Icon }) => {
                  const active = course.status === value
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`course-status-switcher__btn course-status-switcher__btn--${value.toLowerCase()} ${active ? 'is-active' : ''}`}
                      onClick={() => handleStatusChange(value)}
                      disabled={statusChanging}
                      aria-pressed={active}
                      title={t(labelKey)}
                    >
                      <Icon className="course-status-switcher__icon" aria-hidden />
                      <span className="course-status-switcher__label">{t(labelKey)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        {pickLocalized(course, 'description') && <p className="course-page__lead">{pickLocalized(course, 'description')}</p>}
        {!previewMode ? (
          <dl className="course-page__meta">
            <div>
              <dt>{t('coursePage.lessons')}</dt>
              <dd>{lessons.length}</dd>
            </div>
            <div>
              <dt>{t('coursePage.tests')}</dt>
              <dd>{tests.length}</dd>
            </div>
            {lessons.length > 0 && (
              <div>
                <dt>{t('coursePage.progress')}</dt>
                <dd>{Math.round(courseProgress)}%</dd>
              </div>
            )}
            <div>
              <dt>{t('coursePage.views')}</dt>
              <dd>{courseViews}</dd>
            </div>
          </dl>
        ) : (
          <dl className="course-page__meta course-page__meta--preview">
            <div>
              <dt>{t('coursePage.views')}</dt>
              <dd>{courseViews}</dd>
            </div>
          </dl>
        )}
        {!previewMode && lessons.length > 0 && (
          <div className="course-page__progress" aria-label={t('coursePage.progress')}>
            <div className="course-page__progress-track">
              <div className="course-page__progress-fill" style={{ width: `${courseProgress}%` }} />
            </div>
          </div>
        )}
      </header>

      {error && <div className="course-page__error">{error}</div>}

      {previewMode && (
        <div className="course-page__preview-banner" role="status">
          <p>{t('coursePage.previewHint')}</p>
          {!canUpload(window.keycloak) && (
            <button
              type="button"
              className="btn btn-primary course-page__preview-enroll"
              onClick={handleEnrollFromPreview}
              disabled={enrolling}
            >
              {enrolling ? t('common.loading') : t('coursePage.previewEnroll')}
            </button>
          )}
        </div>
      )}

      <div className="course-content-section">
        {participantsAccess && !previewMode && (
          <section className="course-participants-teaser course-panel" aria-labelledby="course-participants-teaser-title">
            <div className="course-participants-teaser__row">
              <div>
                <h2 id="course-participants-teaser-title" className="course-participants-teaser__title">
                  {t('coursePage.participantsTitle')}
                </h2>
                <p className="course-participants-teaser__lead">{t('coursePage.participantsTeaserLead')}</p>
              </div>
              <Link to={`/courses/${id}/participants`} className="course-participants-teaser__cta">
                {t('coursePage.participantsOpenPage')}
              </Link>
            </div>
          </section>
        )}

        <section className="lessons-section course-panel">
          {previewMode ? (
            <div className="card empty-state course-page__preview-gate">
              <div className="empty-state-icon">
                <FiBook />
              </div>
              <p>{t('coursePage.previewLessonsHint')}</p>
            </div>
          ) : (
          <>
          <div className="lessons-header">
            <div className="course-section-head__text">
              <span className="course-section-head__eyebrow">{t('coursePage.program')}</span>
              <div className="lessons-header-titles">
                <h2>{t('coursePage.lessons')}</h2>
              {canUpload(window.keycloak) && (
                <p className="lessons-manage-hint">
                  Удаление уроков и курса — в «Редактировать курс».
                </p>
              )}
            </div>
            </div>
            {canUpload(window.keycloak) && (
                <div className="course-management-controls">
                  <Link to={`/courses/${id}/edit`} className="btn-edit">
                    {t('coursePage.editCourse')}
                  </Link>
                  <Link to={`/courses/${id}/test-results`} className="btn-edit btn-edit--secondary">
                    <FiClipboard aria-hidden /> {t('courseTestResults.navLink')}
                  </Link>

                  {!showLessonForm && (
                      <button
                          type="button"
                          className="btn btn-primary btn-add-lesson"
                          onClick={() => {
                            setNewLesson({
                              title: '',
                              description: '',
                              content: '',
                              orderNumber: lessons.length + 1
                            })
                            setShowLessonForm(true)
                          }}
                      >
                        <FiPlus /> {t('coursePage.addLesson')}
                      </button>
                  )}
                </div>
            )}
          </div>

          {showLessonForm && (
            <div className="card create-lesson-form">
              <h3>{t('coursePage.createLesson')}</h3>
              <form onSubmit={handleCreateLesson}>
                <div className="form-group">
                  <label>{t('coursePage.lessonTitle')}</label>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                    required
                    placeholder={t('coursePage.lessonTitle')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('coursePage.lessonDescription')}</label>
                  <textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    rows="3"
                    placeholder={t('coursePage.lessonDescription')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('coursePage.lessonContent')}</label>
                  <p id="lesson-content-hint" className="form-hint form-hint--lesson-content">
                    {t('coursePage.lessonContentHint', { min: MIN_LESSON_CONTENT_LENGTH })}
                  </p>
                  <textarea
                    value={newLesson.content}
                    onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                    rows="8"
                    required
                    minLength={MIN_LESSON_CONTENT_LENGTH}
                    placeholder={t('coursePage.lessonContentPlaceholder')}
                    aria-describedby="lesson-content-hint"
                  />
                </div>
                <div className="form-group">
                  <label>{t('coursePage.orderNumber')}</label>
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
                    <FiPlus /> {t('coursePage.createLesson')}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-cancel"
                    onClick={() => setShowLessonForm(false)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {lessons.length === 0 && !showLessonForm && (
              <div className="card empty-state">
                <div className="empty-state-icon">
                  <FiBook />
                </div>
                <p>
                  {t('coursePage.emptyLessons')} {canUpload(window.keycloak) && t('coursePage.createFirstLesson')}
                </p>
              </div>
          )}

          {lessons.length > 0 && (
            <div className="lessons-list lessons-list--lms">
              {lessons.map((lesson, index) => {
                const progress = lessonProgress[lesson.id] || { completed: false, progress: 0 }
                const isCompleted = progress.completed === true
                return (
                  <article
                    key={lesson.id}
                    className={`lesson-card lesson-card--lms${isCompleted ? ' lesson-card--done' : ''}`}
                  >
                    <div className="lesson-number" aria-hidden>
                      {isCompleted ? (
                        <FiCheckCircle className="lesson-completed-icon" aria-hidden />
                      ) : (
                        <span className="lesson-number-text">{index + 1}</span>
                      )}
                    </div>
                    <div className="lesson-content">
                      <div className="lesson-header">
                        <h3 className="lesson-card__title">{pickLocalized(lesson, 'title')}</h3>
                        {progress.completed && (
                          <span className="lesson-completed-badge lesson-completed-badge--lms">
                            <FiCheckCircle aria-hidden /> {t('coursePage.completed')}
                          </span>
                        )}
                      </div>
                      {pickLocalized(lesson, 'description') && (
                        <p className="lesson-description lesson-card__desc">{pickLocalized(lesson, 'description')}</p>
                      )}

                      {progress.progress > 0 && !progress.completed && (
                        <div className="lesson-progress lesson-progress--lms">
                          <div className="lesson-progress-bar">
                            <div
                              className="lesson-progress-fill"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                          <span className="lesson-progress-text">{Math.round(progress.progress)}%</span>
                        </div>
                      )}

                      {/* Видео урока (краткий список) */}
                      {lesson.videos && lesson.videos.length > 0 && (
                        <div className="lesson-videos">
                          <h4>
                            <FiPlay /> {t('coursePage.videos')} ({lesson.videos.length})
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
                                <span>+{lesson.videos.length - 3} {t('coursePage.moreVideos')}</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Файлы урока (краткий список) */}
                      <div className="lesson-files">
                        <h4>
                          <FiFile /> {t('coursePage.files')} ({lessonFiles[lesson.id]?.length || 0})
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
                                    title={t('common.delete')}
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
                          <p className="no-files">{t('coursePage.noFilesYet')}</p>
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
                                  <FiClock /> {t('lessonPage.uploading')}
                                </>
                              ) : (
                                <>
                                  <FiUpload /> {t('coursePage.addFile')}
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="lesson-actions lesson-actions--lms">
                      <Link
                        to={`/courses/${id}/lessons/${lesson.id}`}
                        className="lesson-card__cta"
                      >
                        <span className="lesson-card__cta-label">{t('coursePage.studyLesson')}</span>
                        <FiChevronRight className="lesson-card__cta-icon" aria-hidden />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          </>
          )}
        </section>

        <section className="tests-section course-panel">
          <div className="course-section-head__text course-section-head__text--tests">
            <span className="course-section-head__eyebrow">{t('coursePage.knowledgeCheck')}</span>
            <h2>{t('coursePage.tests')}</h2>
          </div>
          {previewMode ? (
            <div className="card empty-state course-page__preview-gate">
              <div className="empty-state-icon">
                <FiCheckSquare />
              </div>
              <p>{t('coursePage.previewTestsHint')}</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <FiCheckSquare />
              </div>
              <p>{t('coursePage.noTests')}</p>
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
                  <span>{pickLocalized(test, 'title')}</span>
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
