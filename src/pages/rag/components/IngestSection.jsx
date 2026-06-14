import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'

const IngestSection = ({
  file,
  collection,
  metadata,
  result,
  loading,
  hideResult,
  onFileSelect,
  onCollectionChange,
  onMetadataChange,
  onSubmit,
}) => {
  const { t } = useTranslation()
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0])
  }

  return (
    <div className="col gap12">
      <div className="sec-head" style={{ padding: 0, border: 'none', marginBottom: 4 }}>
        <h3 className="h3 row gap8">
          <Icon name="upload" size={16} />
          {t('ragPage.ingest')}
        </h3>
      </div>
      <form onSubmit={onSubmit} className="col gap12">
        <div className="field">
          <label className="label" htmlFor="rag-file">{t('ragPage.fileLabel')}</label>
          <div
            className={`rag-upload-zone${dragActive ? ' active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('rag-file')?.click()}
          >
            <input
              type="file"
              id="rag-file"
              className="sr-only"
              accept=".pdf,.docx,.doc,.mp4,.mov,.mp3,.wav,.m4a,.png,.jpg,.jpeg"
              onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
            />
            <span className="uz-ic">
              <Icon name="upload" size={20} />
            </span>
            <div style={{ fontWeight: 600, marginTop: 8 }}>
              {file ? file.name : t('ragPage.uploadPrompt')}
            </div>
            <div className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>
              {file ? t('ragPage.fileChosen') : t('ragPage.dragPrompt')}
            </div>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="rag-collection">{t('ragPage.collectionOptional')}</label>
          <input
            id="rag-collection"
            className="input"
            type="text"
            value={collection}
            onChange={(e) => onCollectionChange(e.target.value)}
            placeholder=""
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="rag-metadata">{t('ragPage.metadataOptional')}</label>
          <input
            id="rag-metadata"
            className="input"
            type="text"
            value={metadata}
            onChange={(e) => onMetadataChange(e.target.value)}
            placeholder='{"course_name": "...", "topic": "..."}'
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Spinner size={16} color="#fff" /> : <Icon name="upload" size={16} />}
          {loading ? t('common.loading') : t('ragPage.upload')}
        </button>
      </form>
      {!hideResult && result && (
        <div className={`rag-out-academis ${result.error ? 'error' : 'success'}`}>
          {result.error || t('ragPage.uploadedChunks', {
            chunks: result.chunks_count,
            document: result.document_id,
            collection: result.collection_name,
          })}
        </div>
      )}
    </div>
  )
}

export default IngestSection
