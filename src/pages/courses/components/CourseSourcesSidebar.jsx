import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import { Icon, StatusBadge, Spinner } from '@/shared/ui/academis'

const formatFileSize = (bytes) => {
  if (bytes == null || Number.isNaN(Number(bytes))) return '—'
  const n = Number(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const CourseSourcesSidebar = ({
  courseId,
  course,
  urlInput,
  onUrlInputChange,
  ingestingUrl,
  onIngestUrl,
  uploading,
  onFileUpload,
  courseFiles,
  selectedFileIds,
  onToggleFile,
  onDeleteFile,
}) => {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const courseTitle = pickLocalized(course, 'title') || course?.title || ''
  const contextCount = selectedFileIds.size

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    if (uploading) return
    const files = event.dataTransfer?.files
    if (!files?.length) return
    onFileUpload({ target: { files } })
  }

  const handlePick = (event) => {
    onFileUpload(event)
    event.target.value = ''
  }

  return (
    <aside className="studio-left course-edit-sidebar">
      <div className="studio-left-head">
        <Link to={`/courses/${courseId}`} className="bc-link row gap4">
          <Icon name="chevLeft" size={15} />
          {t('studio.backToCourse')}
        </Link>
        <h3 className="h3" style={{ marginTop: 8 }}>
          {courseTitle}
        </h3>
        {course?.status && (
          <div className="row gap6" style={{ marginTop: 4 }}>
            <StatusBadge status={course.status} />
          </div>
        )}
      </div>

      <div className="studio-left-scroll">
        <div className="sl-block">
          <div className="sl-label">
            <Icon name="link" size={14} />
            {t('studio.urlIngest')}
          </div>
          <div className="row gap6">
            <input
              type="url"
              className="input"
              style={{ height: 36 }}
              placeholder={t('courseEdit.urlPlaceholder')}
              value={urlInput}
              onChange={(event) => onUrlInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onIngestUrl()
              }}
              autoComplete="url"
            />
            <button
              type="button"
              className="btn btn-icon btn-primary"
              style={{ height: 36, width: 36, flexShrink: 0 }}
              onClick={onIngestUrl}
              disabled={ingestingUrl || !urlInput.trim()}
              aria-label={t('courseEdit.addToMaterials')}
            >
              {ingestingUrl ? <Spinner size={16} color="#fff" /> : <Icon name="plus" size={16} />}
            </button>
          </div>
        </div>

        <div className="sl-block">
          <div className="sl-label">
            <Icon name="upload" size={14} />
            {t('studio.uploadFiles')}
          </div>
          <div
            className={`upload-zone${dragOver ? ' over' : ''}`}
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            role="presentation"
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={handlePick}
              disabled={uploading}
            />
            <span className="uz-ic">
              {uploading ? <Spinner size={20} color="var(--brand)" /> : <Icon name="upload" size={20} />}
            </span>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>
              {uploading ? t('courseEdit.uploading') : t('studio.uploadZone')}
            </div>
            <div className="dim" style={{ fontSize: 11 }}>
              {t('studio.uploadHint')}
            </div>
          </div>
        </div>

        <div className="sl-block" style={{ flex: 1, minHeight: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div className="sl-label" style={{ margin: 0 }}>
              <Icon name="files" size={14} />
              {t('studio.materials')}
            </div>
            {courseFiles.length > 0 && (
              <span className="badge badge-red" style={{ height: 19, fontSize: 10.5 }}>
                {contextCount} {t('studio.inContextShort')}
              </span>
            )}
          </div>

          {courseFiles.length === 0 ? (
            <div className="dim" style={{ fontSize: 12, padding: 8 }}>
              {t('studio.addSourcesHint')}
            </div>
          ) : (
            <div className="col gap6">
              {courseFiles.map((file) => {
                const isUrl = file.contentType === 'text/html' || file.sourceType === 'URL'
                return (
                  <div
                    key={file.id}
                    className={`mat-row${selectedFileIds.has(file.id) ? ' active' : ''}`}
                  >
                    <button
                      type="button"
                      className={`ctx-check${selectedFileIds.has(file.id) ? ' on' : ''}`}
                      onClick={() => onToggleFile(file.id)}
                      title={t('studio.inContext')}
                      aria-pressed={selectedFileIds.has(file.id)}
                    >
                      {selectedFileIds.has(file.id) && <Icon name="check" size={12} />}
                    </button>
                    <span className={`mat-ic${isUrl ? ' url' : ''}`}>
                      <Icon name={isUrl ? 'link' : 'doc'} size={14} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={file.originalFileName}
                      >
                        {file.originalFileName}
                      </div>
                      <div className="dim" style={{ fontSize: 10.5 }}>
                        {formatFileSize(file.sizeBytes ?? file.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mat-del"
                      onClick={() => onDeleteFile(file.id)}
                      title={t('courseEdit.deleteItem')}
                      aria-label={t('courseEdit.deleteItem')}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default CourseSourcesSidebar
