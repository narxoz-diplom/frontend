import React from 'react'
import { FiFileText } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const ModuleSection = ({
  prompt,
  collection,
  topK,
  result,
  loading,
  onPromptChange,
  onCollectionChange,
  onTopKChange,
  onSubmit
}) => {
  const { t } = useTranslation()

  return (
    <section className="rag-card">
      <h2><FiFileText /> {t('ragPage.generateModule')}</h2>
      <form onSubmit={onSubmit}>
        <label>{t('ragPage.request')}</label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('ragPage.modulePromptPlaceholder')}
          rows={3}
        />
        <label>{t('ragPage.collectionOptional')}</label>
        <input
          type="text"
          value={collection}
          onChange={(e) => onCollectionChange(e.target.value)}
          placeholder="default"
        />
        <label>{t('ragPage.chunkCount')}</label>
        <input
          type="number"
          min={1}
          max={50}
          value={topK}
          onChange={(e) => onTopKChange(Number(e.target.value) || 8)}
        />
        <button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('ragPage.generate')}
        </button>
      </form>
      {result && (
        <div className={`rag-out ${result.error ? 'error' : 'text'}`}>
          {result.error || (
            <>
              {result.module_text}
              {result.chunks_used != null && (
                <p className="rag-meta">{t('ragPage.chunksUsed', { chunks: result.chunks_used, collection: result.collection_name })}</p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default ModuleSection
