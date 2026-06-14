import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlay, FiUpload, FiX, FiClock, FiCheckCircle, FiChevronRight, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
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
      uploadFormData.append('lessonId', String(lessonId))
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
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="sec-head">
        <div className="row gap8" style={{ alignItems: 'center' }}>
          <Icon name="video" size={17} style={{ color: 'var(--brand)' }} />
          <h3 className="h3">{t('lessonPage.videos')}</h3>
        </div>
        <span className="badge">{videos.length}</span>
        {canEdit && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            style={{ marginLeft: 'auto' }}
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
        <div className="video-upload-form" style={{ padding: '0 18px 18px' }}>
          <form onSubmit={handleVideoUpload}>
            <div className="form-group">
              <label>{t('lessonPage.videoTitle')} *</label>
              <input
                type="text"
                value={newVideo.title}
                onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                required
                placeholder={t('lessonPage.videoTitlePlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('coursePage.lessonDescription')}</label>
              <textarea
                value={newVideo.description}
                onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                rows="3"
                placeholder={t('lessonPage.videoDescriptionPlaceholder')}
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
                className="btn btn-primary"
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
                className="btn btn-outline"
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
        <div className="empty-state" style={{ padding: '18px' }}>
          <FiPlay className="empty-icon" />
          <p>{t('lessonPage.noVideos')}</p>
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowVideoForm(true)}
            >
              <FiUpload /> {t('lessonPage.addFirstVideo')}
            </button>
          )}
        </div>
      ) : (
        <div className="video-strip">
          {videos.map((video, index) => {
            const isCompleted = isVideoCompleted(buildProgressKey(courseId, lessonId, video.id))

            return (
              <div key={video.id} className="video-thumb">
                <Link
                  to={`/courses/${courseId}/lessons/${lessonId}/videos/${video.id}`}
                  className="video-card"
                >
                  <div className="vt-cover" style={{ background: 'linear-gradient(135deg, var(--brand), #7d0e0e)' }}>
                    <span className="vt-play">
                      <Icon name="play" size={18} />
                    </span>
                    {video.duration > 0 && (
                      <span className="vt-dur">{formatDuration(video.duration)}</span>
                    )}
                  </div>
                  <div style={{ padding: '9px 10px' }}>
                    <div className="row gap6" style={{ alignItems: 'center' }}>
                      <div style={{ fontWeight: 650, fontSize: 13, flex: 1 }}>{video.title}</div>
                      {isCompleted && <Icon name="check" size={14} style={{ color: 'var(--green-500)' }} />}
                    </div>
                    {video.description && (
                      <div className="dim clamp-1" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {video.description}
                      </div>
                    )}
                  </div>
                </Link>
                {canEdit && (
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-danger video-delete-btn"
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
