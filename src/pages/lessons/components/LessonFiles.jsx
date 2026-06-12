import React from 'react'
import { FiFile, FiUpload, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { useAlert } from '@/app/providers/AlertProvider'
import { uploadToLesson, deleteFile, downloadFile } from '@/shared/api/filesApi'
import { formatFileSize } from '../lib/formatters'

const LessonFiles = ({ files, canEdit, lessonId, onFilesChanged, onError }) => {
  const { t } = useTranslation()
  const { confirm } = useAlert()

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const response = await downloadFile(fileId)
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
    } catch {
      onError(t('filesPage.downloadError'))
    }
  }

  const handleFileUpload = async (e) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('lessonId', lessonId)
      await uploadToLesson(formData)
      await onFilesChanged()
      onError(null)
    } catch (err) {
      const apiError = err.response?.data?.message || err.response?.data?.error
      if (err.response?.status === 413 || err.response?.status === 400) {
        onError(apiError || t('lessonPage.uploadVideoError'))
      } else if (apiError) {
        onError(apiError)
      } else {
        onError(t('filesPage.uploadError'))
      }
    } finally {
      input.value = ''
    }
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
      await deleteFile(fileId)
      await onFilesChanged()
      onError(null)
    } catch {
      onError(t('lessonPage.deleteFileError'))
    }
  }

  return (
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
              onChange={handleFileUpload}
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
  )
}

export default LessonFiles
