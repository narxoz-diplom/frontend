import React, { useState, useEffect, useMemo } from 'react'
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
  FiChevronLeft,
  FiTrash2
} from 'react-icons/fi'
import api from '../services/api'
import { normalizeCourseViewerResponse } from '../utils/courseResponse'
import { useAlert } from '../context/AlertProvider'
import { canUpload, isTeacher, isAdmin } from '../utils/roles'
import LessonChat from './LessonChat'
import { pickLocalized } from '../i18n/localize'
import { useTranslation } from 'react-i18next'
import './LessonDetail.css'

/** Извлекает вставки картинок из Markdown и HTML для редактора конспекта */
function extractEmbeddedImages(text) {
  if (!text || typeof text !== 'string') return []
  const images = []
  const mdRe = /!\[([^\]]*)\]\(([^)]+)\)/g
  let m
  while ((m = mdRe.exec(text)) !== null) {
    images.push({
      fullMatch: m[0],
      alt: m[1],
      url: m[2].trim()
    })
  }
  const htmlRe = /<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>/gi
  while ((m = htmlRe.exec(text)) !== null) {
    images.push({
      fullMatch: m[0],
      alt: '',
      url: m[1].trim()
    })
  }
  return images
}

function removeFirstOccurrence(haystack, needle) {
  const i = haystack.indexOf(needle)
  if (i === -1) return haystack
  const next = haystack.slice(0, i) + haystack.slice(i + needle.length)
  return next.replace(/\n{3,}/g, '\n\n')
}

const LessonDetail = () => {
  const { t } = useTranslation()
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { confirm } = useAlert()
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
      setEditedContent(pickLocalized(lessonResponse.data, 'content') || '')
      
      // Загружаем курс
      const courseResponse = await api.get(`/courses/${courseId}`)
      setCourse(normalizeCourseViewerResponse(courseResponse.data).course)
      
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
      setError(t('coursePage.loadLessonsError'))
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
      setError(t('lessonPage.saveError'))
    }
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!newVideo.file || !newVideo.title) {
      setError(t('lessonPage.requiredVideoFields'))
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
        setError(t('lessonPage.uploadVideoError'))
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
      setError(t('filesPage.downloadError'))
    }
  }

  const handleDeleteVideo = async (videoId) => {
    const ok = await confirm({
      title: t('lessonPage.deleteVideoTitle'),
      message: t('lessonPage.deleteVideoMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    try {
      await api.delete(`/courses/lessons/${lessonId}/videos/${videoId}`)
      // Перезагружаем видео
      const videosResponse = await api.get(`/courses/lessons/${lessonId}/videos`)
      setVideos(videosResponse.data || [])
      setError(null)
    } catch (err) {
      console.error('Error deleting video:', err)
      setError(t('lessonPage.deleteVideoError'))
    }
  }

  const embeddedImagesInEditor = useMemo(
    () => extractEmbeddedImages(editedContent),
    [editedContent]
  )

  const handleRemoveEmbeddedImage = (fullMatch) => {
    setEditedContent((prev) => removeFirstOccurrence(prev, fullMatch))
  }

  const handleDeleteFile = async (fileId) => {
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
      // Перезагружаем файлы
      const filesResponse = await api.get(`/files/lesson/${lessonId}`)
      setFiles(filesResponse.data || [])
      setError(null)
    } catch (err) {
      console.error('Error deleting file:', err)
      setError(t('lessonPage.deleteFileError'))
    }
  }

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>
  }

  if (!lesson || !course) {
    return <div className="error">{t('coursePage.loadLessonsError')}</div>
  }

  const currentIndex = getCurrentLessonIndex()
  const nextLesson = getNextLesson()
  const prevLesson = getPrevLesson()
  const canEdit = canUpload(window.keycloak)

  return (
    <div className="lesson-detail lesson-detail--v2">
      <header className="lesson-page__intro">
        <Link to={`/courses/${courseId}`} className="back-link">
          <FiArrowLeft aria-hidden /> {t('lessonPage.backToCourse')}
        </Link>
        <p className="lesson-page__kicker">
          {t('lessonPage.lessonOf', { current: currentIndex + 1, total: lessons.length })}
          {pickLocalized(course, 'title') ? ` · ${pickLocalized(course, 'title')}` : ''}
        </p>
        <div className="lesson-page__title-row">
          <h1 className="lesson-page__title">{pickLocalized(lesson, 'title')}</h1>
          {lessonProgress.completed && (
            <span className="lesson-page__badge lesson-page__badge--done">
              <FiCheckCircle aria-hidden /> {t('lessonPage.completed')}
            </span>
          )}
        </div>
        {pickLocalized(lesson, 'description') && <p className="lesson-page__lead">{pickLocalized(lesson, 'description')}</p>}
        {videos.length > 0 && (
          <div className="lesson-page__progress" aria-label={t('coursePage.progress')}>
            <div className="lesson-page__progress-track">
              <div
                className="lesson-page__progress-fill"
                style={{ width: `${lessonProgress.progress}%` }}
              />
            </div>
            <span className="lesson-page__progress-label">{Math.round(lessonProgress.progress)}%</span>
          </div>
        )}
      </header>

      {error && <div className="lesson-page__error">{error}</div>}

      <div className="lesson-content-wrapper">
        {/* Main Content */}
        <div className="lesson-main-content">
          {/* Конспект урока */}
          <div className="lesson-notes-section lesson-panel">
            <div className="section-header">
              <div className="section-header__text">
                <span className="section-header__eyebrow">{t('lessonPage.material')}</span>
                <h2>
                  <FiBook aria-hidden /> {t('lessonPage.notes')}
                </h2>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="btn-edit section-header__btn"
                  onClick={() => {
                    if (isEditingContent) {
                      setIsEditingContent(false)
                      setEditedContent(pickLocalized(lesson, 'content') || '')
                    } else {
                      setIsEditingContent(true)
                    }
                  }}
                >
                  {isEditingContent ? (
                    <>
                      <FiX /> {t('common.cancel')}
                    </>
                  ) : (
                    <>
                      <FiEdit3 /> {t('common.edit')}
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
                  placeholder={t('lessonPage.notes')}
                  className="content-textarea"
                  rows="20"
                />
                {embeddedImagesInEditor.length > 0 && (
                  <div className="markdown-embedded-images" aria-label="Markdown images">
                    <p className="markdown-embedded-images__title">Markdown images</p>
                    <ul className="markdown-embedded-images__list">
                      {embeddedImagesInEditor.map((img, idx) => (
                        <li key={`embed-img-${idx}-${img.url.slice(0, 24)}`} className="markdown-embedded-images__item">
                          <div className="markdown-embedded-images__preview">
                            <img
                              src={img.url}
                              alt={img.alt || ''}
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </div>
                          <div className="markdown-embedded-images__meta">
                            <span className="markdown-embedded-images__url" title={img.url}>
                              {img.url.length > 72 ? `${img.url.slice(0, 72)}…` : img.url}
                            </span>
                            {img.alt && (
                              <span className="markdown-embedded-images__alt">alt: {img.alt}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-edit section-header__btn markdown-embedded-images__remove"
                            onClick={() => handleRemoveEmbeddedImage(img.fullMatch)}
                            title={t('common.delete')}
                          >
                            <FiTrash2 /> {t('common.delete')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="editor-actions">
                  <button type="button" className="btn-edit btn-edit--accent" onClick={handleSaveContent}>
                    <FiSave /> {t('lessonPage.saveNotes')}
                  </button>
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => {
                      setIsEditingContent(false)
                      setEditedContent(lesson.content || '')
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="lesson-notes-content">
                {pickLocalized(lesson, 'content') ? (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                    >
                      {pickLocalized(lesson, 'content')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="empty-notes">
                    <p>{t('lessonPage.noNotes')}</p>
                    {canEdit && (
                      <button
                        type="button"
                        className="btn-edit btn-edit--accent"
                        onClick={() => setIsEditingContent(true)}
                      >
                        <FiEdit3 /> {t('lessonPage.addNotes')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Видео */}
          <div className="lesson-videos-section lesson-panel">
            <div className="section-header">
              <div className="section-header__text">
                <span className="section-header__eyebrow">{t('lessonPage.media')}</span>
                <h2>
                  <FiPlay aria-hidden /> {t('lessonPage.videos')} ({videos.length})
                </h2>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="btn-edit btn-edit--accent section-header__btn"
                  onClick={() => setShowVideoForm(!showVideoForm)}
                >
                  {showVideoForm ? (
                    <>
                      <FiX /> {t('common.cancel')}
                    </>
                  ) : (
                    <>
                      <FiUpload /> {t('lessonPage.addVideo')}
                    </>
                  )}
                </button>
              )}
            </div>

            {showVideoForm && canEdit && (
              <div className="video-upload-form">
                <form onSubmit={handleVideoUpload}>
                  <div className="form-group">
                    <label>{t('lessonPage.videoTitle')} *</label>
                    <input
                      type="text"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                      required
                      placeholder={t('lessonPage.videoTitle')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('coursePage.lessonDescription')}</label>
                    <textarea
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                      rows="3"
                      placeholder={t('lessonPage.videoDescription')}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('coursePage.orderNumber')}</label>
                      <input
                        type="number"
                        value={newVideo.orderNumber}
                        onChange={(e) => setNewVideo({...newVideo, orderNumber: parseInt(e.target.value) || 1})}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('lessonPage.videoFile')} *</label>
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
                      className="btn-edit btn-edit--accent"
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? (
                        <>
                          <FiClock /> {t('lessonPage.uploading')}
                        </>
                      ) : (
                        <>
                          <FiUpload /> {t('lessonPage.uploadVideo')}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => {
                        setShowVideoForm(false)
                        setNewVideo({ title: '', description: '', orderNumber: videos.length + 1, file: null })
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {videos.length === 0 ? (
              <div className="empty-state">
                <FiPlay className="empty-icon" />
                <p>{t('lessonPage.noVideos')}</p>
                {canEdit && (
                  <button
                    type="button"
                    className="btn-edit btn-edit--accent"
                    onClick={() => setShowVideoForm(true)}
                  >
                    <FiUpload /> {t('lessonPage.addFirstVideo')}
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
                    <div key={video.id} className="video-card-wrapper">
                      <Link
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
                      {canEdit && (
                        <button
                          type="button"
                          className="btn-icon-danger video-delete-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteVideo(video.id)
                          }}
                          title={t('common.delete')}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Файлы */}
          <div className="lesson-files-section lesson-panel">
            <div className="section-header">
              <div className="section-header__text">
                <span className="section-header__eyebrow">{t('lessonPage.attachments')}</span>
                <h2>
                  <FiFile aria-hidden /> {t('common.files')} ({files.length})
                </h2>
              </div>
              {canEdit && (
                <label className="btn-edit btn-edit--accent section-header__btn lesson-file-upload">
                  <FiUpload /> {t('lessonPage.addFile')}
                  <input
                    type="file"
                    className="lesson-file-upload__input"
                    onChange={async (e) => {
                      const input = e.target
                      const file = input.files?.[0]
                      if (!file) return
                      try {
                        const formData = new FormData()
                        formData.append('file', file)
                        formData.append('lessonId', lessonId)
                        await api.post(`/files/upload-to-lesson`, formData, {
                          headers: {
                            'Content-Type': 'multipart/form-data'
                          }
                        })
                        const filesResponse = await api.get(`/files/lesson/${lessonId}`)
                        setFiles(filesResponse.data || [])
                        setError(null)
                      } catch (err) {
                        console.error('Error uploading file:', err)
                        const apiError = err.response?.data?.message || err.response?.data?.error
                        if (err.response?.status === 413 || err.response?.status === 400) {
                          setError(apiError || t('lessonPage.uploadVideoError'))
                        } else if (apiError) {
                          setError(apiError)
                        } else {
                          setError(t('filesPage.uploadError'))
                        }
                      } finally {
                        input.value = ''
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {files.length === 0 ? (
              <div className="empty-state">
                <FiFile className="empty-icon" />
                <p>{t('lessonPage.noFiles')}</p>
              </div>
            ) : (
              <div className="files-list">
                {files.map((file) => (
                  <div key={file.id} className="file-card file-card--row">
                    <div
                      className="file-card__main"
                      onClick={() => handleFileDownload(file.id, file.originalFileName)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleFileDownload(file.id, file.originalFileName)
                        }
                      }}
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
                    {canEdit && (
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file.id)
                        }}
                        title={t('common.delete')}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="lesson-sidebar lesson-rail">
          <div className="sidebar-section lesson-rail__card">
            <p className="lesson-rail__eyebrow">{t('lessonPage.course')}</p>
            <h3 className="lesson-rail__title">{pickLocalized(course, 'title')}</h3>
            <Link to={`/courses/${courseId}`} className="lesson-rail__link">
              {t('lessonPage.openCoursePage')}
            </Link>
          </div>

          <div className="sidebar-section lesson-rail__card">
            <p className="lesson-rail__eyebrow">{t('lessonPage.navigation')}</p>
            <h3 className="lesson-rail__title lesson-rail__title--sm">{t('lessonPage.allLessons')}</h3>
            <div className="lessons-nav">
              {lessons.map((l, index) => (
                <Link
                  key={l.id}
                  to={`/courses/${courseId}/lessons/${l.id}`}
                  className={`lesson-nav-item ${l.id === parseInt(lessonId) ? 'active' : ''}`}
                >
                  <span className="lesson-nav-number">{index + 1}</span>
                  <span className="lesson-nav-title">{pickLocalized(l, 'title')}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Lesson Chat: рендер в document.body (FAB + панель) */}
          <LessonChat
            lessonId={lessonId}
            courseId={courseId}
            lessonTitle={pickLocalized(lesson, 'title')}
            courseTitle={pickLocalized(course, 'title')}
            lessonContent={pickLocalized(lesson, 'content') || ''}
          />

          {/* Navigation */}
          <div className="lesson-navigation lesson-rail__nav">
            {prevLesson && (
              <Link
                to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="nav-btn prev-btn"
              >
                <FiChevronLeft aria-hidden /> {t('lessonPage.previous')}
              </Link>
            )}
            {nextLesson && (
              <Link
                to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="nav-btn next-btn"
              >
                {t('lessonPage.next')} <FiChevronRight aria-hidden />
              </Link>
            )}
          </div>
        </aside>
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

