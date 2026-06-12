import React, { useState } from 'react'
import { FiUpload } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const IngestSection = ({
  file,
  collection,
  metadata,
  result,
  loading,
  onFileSelect,
  onCollectionChange,
  onMetadataChange,
  onSubmit
}) => {
  const { t } = useTranslation()
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <section className="rag-card">
      <h2><FiUpload /> {t('ragPage.ingest')}</h2>
      <form onSubmit={onSubmit}>
        <label>{t('ragPage.fileLabel')}</label>
        <div
          className={`file-upload ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="fileInput"
            className="file-input"
            accept=".pdf,.docx,.doc,.mp4,.mov,.mp3,.wav,.m4a,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            required
          />

          <label htmlFor="fileInput" className="file-label">
            {file ? (
              <>
                <span className="file-name">📄 {file.name}</span>
                <span className="file-sub">{t('ragPage.fileChosen')}</span>
              </>
            ) : (
              <>
                <span className="file-main">
                  {t('ragPage.uploadPrompt')}<br />
                </span>

                <span className="file-sub">
                  ({t('ragPage.dragPrompt')})
                </span>
              </>
            )}
          </label>
        </div>
        <label>{t('ragPage.collectionOptional')}</label>
        <input
          type="text"
          value={collection}
          onChange={(e) => onCollectionChange(e.target.value)}
          placeholder="default"
        />
        <label>{t('ragPage.metadataOptional')}</label>
        <input
          type="text"
          value={metadata}
          onChange={(e) => onMetadataChange(e.target.value)}
          placeholder='{"course_name": "...", "topic": "..."}'
        />
        <button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('ragPage.upload')}
        </button>
      </form>
      {result && (
        <div className={`rag-out ${result.error ? 'error' : 'success'}`}>
          {result.error || (
            <>{t('ragPage.uploadedChunks', { chunks: result.chunks_count, document: result.document_id, collection: result.collection_name })}</>
          )}
        </div>
      )}
    </section>
  )
}

export default IngestSection
