import React from 'react'
import { FiFile, FiUpload, FiLoader, FiTrash2, FiMail, FiLink } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const CourseSourcesSidebar = ({
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
  allowedEmailsCount,
  onOpenEmailsModal
}) => {
  const { t } = useTranslation()

  return (
    <aside className="course-edit-sidebar gen-sources-panel">
      <div className="sidebar-section gen-source-card">
        <h3>
          <FiLink aria-hidden /> {t('courseEdit.urlTitle')}
        </h3>
        <p className="gen-source-hint">
          {t('courseEdit.urlDesc')}
        </p>
        <input
          type="url"
          className="gen-input"
          placeholder={t('courseEdit.urlPlaceholder')}
          value={urlInput}
          onChange={(e) => onUrlInputChange(e.target.value)}
          autoComplete="url"
        />
        <button
          type="button"
          className="btn btn-outline btn-block gen-source-btn"
          onClick={onIngestUrl}
          disabled={ingestingUrl || !urlInput.trim()}
        >
          {ingestingUrl ? (
            <>
              <FiLoader className="spin" /> {t('courseEdit.indexing')}
            </>
          ) : (
            <>
              <FiLink /> {t('courseEdit.addToMaterials')}
            </>
          )}
        </button>
      </div>
      <div className="sidebar-section">
        <h3>{t('courseEdit.addFiles')}</h3>
        <label className="upload-zone">
          <input
            type="file"
            onChange={onFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <><FiLoader className="spin" /> {t('courseEdit.uploading')}</>
          ) : (
            <><FiUpload /> {t('courseEdit.uploadFile')}</>
          )}
        </label>
      </div>
      <div className="sidebar-section">
        <div className="gen-sidebar-files-head">
          <h3>{t('courseEdit.courseMaterials')}</h3>
          {courseFiles.length > 0 && (
            <span className="gen-sidebar-files-count">
              {selectedFileIds.size}/{courseFiles.length} {t('courseEdit.inContext')}
            </span>
          )}
        </div>
        {courseFiles.length === 0 ? (
          <p className="empty-hint">{t('courseEdit.noFiles')}</p>
        ) : (
          <ul className="files-list">
            {courseFiles.map((f) => (
              <li key={f.id} className="file-item">
                <label className="file-check">
                  <input
                    type="checkbox"
                    checked={selectedFileIds.has(f.id)}
                    onChange={() => onToggleFile(f.id)}
                  />
                  <FiFile />
                  <span title={f.originalFileName}>{f.originalFileName}</span>
                </label>
                <button
                  className="btn-icon danger"
                  onClick={() => onDeleteFile(f.id)}
                  title={t('courseEdit.deleteItem')}
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-section">
        <button
          type="button"
          className="btn btn-outline btn-block allowed-emails-trigger"
          onClick={onOpenEmailsModal}
          title={t('courseEdit.emailAccessTitle')}
        >
          <FiMail />
          <span>{t('courseEdit.emailAccess')}</span>
          {allowedEmailsCount > 0 && (
            <span className="allowed-emails-badge">{allowedEmailsCount}</span>
          )}
        </button>
      </div>
    </aside>
  )
}

export default CourseSourcesSidebar
