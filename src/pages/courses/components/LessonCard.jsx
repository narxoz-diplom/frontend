import React from 'react'
import { Link } from 'react-router-dom'
import {
  FiPlay,
  FiFile,
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiTrash2,
  FiChevronRight
} from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'

const LessonCard = ({
  courseId,
  lesson,
  index,
  files,
  progress,
  uploading,
  highlighted,
  lessonRefs,
  onUploadFile,
  onDownloadFile,
  onDeleteFile
}) => {
  const { t } = useTranslation()
  const isCompleted = progress.completed === true

  return (
    <article
      ref={(node) => {
        if (node) {
          lessonRefs.current[lesson.id] = node
        } else {
          delete lessonRefs.current[lesson.id]
        }
      }}
      className={`lesson-card lesson-card--lms${isCompleted ? ' lesson-card--done' : ''}${highlighted ? ' lesson-card--search-hit' : ''}`}
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

        {lesson.videos && lesson.videos.length > 0 && (
          <div className="lesson-videos">
            <h4>
              <FiPlay /> {t('coursePage.videos')} ({lesson.videos.length})
            </h4>
            <div className="videos-list">
              {lesson.videos.slice(0, 3).map((video) => (
                <Link
                  key={video.id}
                  to={`/courses/${courseId}/lessons/${lesson.id}/videos/${video.id}`}
                  className="video-link"
                >
                  <FiPlay className="video-icon" />
                  <span className="video-title">{video.title}</span>
                </Link>
              ))}
              {lesson.videos.length > 3 && (
                <Link
                  to={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="video-link see-more"
                >
                  <span>+{lesson.videos.length - 3} {t('coursePage.moreVideos')}</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="lesson-files">
          <h4>
            <FiFile /> {t('coursePage.files')} ({files?.length || 0})
          </h4>
          {files && files.length > 0 ? (
            <div className="files-list">
              {files.slice(0, 3).map((file) => (
                <div
                  key={file.id}
                  className="file-link"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                >
                  <div
                    onClick={() => onDownloadFile(file.id, file.originalFileName)}
                    style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FiFile className="file-icon" />
                    <span>{file.originalFileName}</span>
                  </div>
                  {canUpload(auth) && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteFile(file.id, lesson.id)
                      }}
                      title={t('common.delete')}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
              {files.length > 3 && (
                <Link
                  to={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="file-link see-more"
                >
                  <span>+{files.length - 3} more files</span>
                </Link>
              )}
            </div>
          ) : (
            <p className="no-files">{t('coursePage.noFilesYet')}</p>
          )}

          {canUpload(auth) && (
            <div className="file-upload-section">
              <input
                type="file"
                id={`file-upload-${lesson.id}`}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const input = e.target
                  const file = input.files?.[0]
                  if (file) {
                    onUploadFile(lesson.id, file).finally(() => {
                      input.value = ''
                    })
                  }
                }}
              />
              <label
                htmlFor={`file-upload-${lesson.id}`}
                className="btn btn-secondary btn-sm"
                style={{ cursor: 'pointer', display: 'inline-flex' }}
              >
                {uploading ? (
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
          to={`/courses/${courseId}/lessons/${lesson.id}`}
          className="lesson-card__cta"
        >
          <span className="lesson-card__cta-label">{t('coursePage.studyLesson')}</span>
          <FiChevronRight className="lesson-card__cta-icon" aria-hidden />
        </Link>
      </div>
    </article>
  )
}

export default LessonCard
