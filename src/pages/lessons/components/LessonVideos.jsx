import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlay, FiUpload, FiX, FiClock, FiCheckCircle, FiChevronRight, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { useAlert } from '@/app/providers/AlertProvider'
import { uploadVideo } from '@/shared/api/filesApi'
import { addLessonVideo, deleteLessonVideo } from '@/shared/api/lessonsApi'
import { formatDuration, formatFileSize } from '../lib/formatters'
import { buildProgressKey, isVideoCompleted } from '../lib/videoStorage'

const emptyVideoForm = (orderNumber) => ({ title: '', description: '', orderNumber, file: null })

const LessonVideos = ({ videos, canEdit, courseId, lessonId, onVideosChanged, onError }) => {
  const { t } = useTranslation()
  const { confirm } = useAlert()
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [newVideo, setNewVideo] = useState(emptyVideoForm(1))

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!newVideo.file || !newVideo.title) {
      onError(t('lessonPage.requiredVideoFields'))
      return
    }

    try {
      setUploadingVideo(true)

      const uploadFormData = new FormData()
      uploadFormData.append('file', newVideo.file)
      const uploadResponse = await uploadVideo(uploadFormData)

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
      await addLessonVideo(lessonId, videoMetadata)

      await onVideosChanged()
      setShowVideoForm(false)
      setNewVideo(emptyVideoForm(videos.length + 1))
      onError(null)
    } catch (err) {
      if (err.response?.status === 413 || err.response?.status === 400) {
        const errorMessage = err.response?.data?.message ||
          'File size too large. Maximum allowed size is 2GB. Please upload a smaller file.'
        onError(errorMessage)
      } else if (err.response?.data?.message) {
        onError(err.response.data.message)
      } else {
        onError(t('lessonPage.uploadVideoError'))
      }
    } finally {
      setUploadingVideo(false)
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
      await deleteLessonVideo(lessonId, videoId)
      await onVideosChanged()
      onError(null)
    } catch {
      onError(t('lessonPage.deleteVideoError'))
    }
  }

  return (
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
                  setNewVideo(emptyVideoForm(videos.length + 1))
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
            const isCompleted = isVideoCompleted(buildProgressKey(courseId, lessonId, video.id))

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
  )
}

export default LessonVideos
