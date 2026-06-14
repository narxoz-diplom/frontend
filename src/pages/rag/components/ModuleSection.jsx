import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'

const ModuleSection = ({
  prompt,
  collection,
  topK,
  result,
  loading,
  hideResult,
  onPromptChange,
  onCollectionChange,
  onTopKChange,
  onSubmit,
}) => {
  const { t } = useTranslation()

  return (
    <div className="col gap12">
      <div className="sec-head" style={{ padding: 0, border: 'none', marginBottom: 4 }}>
        <h3 className="h3 row gap8">
          <Icon name="doc" size={16} />
          {t('ragPage.generateModule')}
        </h3>
      </div>
      <form onSubmit={onSubmit} className="col gap12">
        <div className="field">
          <label className="label" htmlFor="rag-prompt">{t('ragPage.request')}</label>
          <textarea
            id="rag-prompt"
            className="textarea"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={t('ragPage.modulePromptPlaceholder')}
            rows={4}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="rag-mod-collection">{t('ragPage.collectionOptional')}</label>
          <input
            id="rag-mod-collection"
            className="input"
            type="text"
            value={collection}
            onChange={(e) => onCollectionChange(e.target.value)}
            placeholder=""
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="rag-topk">{t('ragPage.chunkCount')}</label>
          <input
            id="rag-topk"
            className="input"
            type="number"
            min={1}
            max={50}
            value={topK}
            onChange={(e) => onTopKChange(Number(e.target.value) || 8)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Spinner size={16} color="#fff" /> : <Icon name="sparkles" size={16} />}
          {loading ? t('common.loading') : t('ragPage.generate')}
        </button>
      </form>
      {!hideResult && result && (
        <div className={`rag-out-academis ${result.error ? 'error' : ''}`}>
          {result.error || (
            <>
              <p style={{ whiteSpace: 'pre-wrap' }}>{result.module_text}</p>
              {result.chunks_used != null && (
                <p className="rag-meta-line">
                  {t('ragPage.chunksUsed', { chunks: result.chunks_used, collection: result.collection_name })}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ModuleSection
