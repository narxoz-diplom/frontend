import React from 'react'
import { FiFile, FiUpload, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
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
    <div className="card card-pad lesson-files-section">
      <div className="sec-head" style={{ padding: '0 0 12px', margin: 0 }}>
        <div className="row gap8" style={{ alignItems: 'center' }}>
          <Icon name="files" size={17} style={{ color: 'var(--brand)' }} />
          <h3 className="h3">{t('lessonPage.attachments')}</h3>
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
        <div className="col gap8 files-list">
          {files.map((file) => (
            <div key={file.id} className="file-pill file-card file-card--row">
              <span className="fp-ic">
                <Icon name="file" size={16} />
              </span>
              <div
                className="file-card__main"
                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => handleFileDownload(file.id, file.originalFileName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleFileDownload(file.id, file.originalFileName)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div style={{ fontWeight: 650, fontSize: 13 }}>{file.originalFileName}</div>
                <div className="dim" style={{ fontSize: 11.5 }}>
                  {formatFileSize(file.fileSize)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => handleFileDownload(file.id, file.originalFileName)}
              >
                <Icon name="download" size={15} />
              </button>
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
