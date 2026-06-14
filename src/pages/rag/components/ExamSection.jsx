import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'

const ExamSection = ({ collection, result, loading, hideResult, onCollectionChange, onSubmit }) => {
  const { t } = useTranslation()

  return (
    <div className="col gap12">
      <div className="sec-head" style={{ padding: 0, border: 'none', marginBottom: 4 }}>
        <h3 className="h3 row gap8">
          <Icon name="edit" size={16} />
          {t('ragPage.examQuestions')}
        </h3>
      </div>
      <form onSubmit={onSubmit} className="col gap12">
        <div className="field">
          <label className="label" htmlFor="rag-exam-collection">{t('ragPage.collection')}</label>
          <input
            id="rag-exam-collection"
            className="input"
            type="text"
            value={collection}
            onChange={(e) => onCollectionChange(e.target.value)}
            placeholder=""
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Spinner size={16} color="#fff" /> : <Icon name="sparkles" size={16} />}
          {loading ? t('common.loading') : t('ragPage.generateQuestions')}
        </button>
      </form>
      {!hideResult && result && (
        <div className={`rag-out-academis ${result.error ? 'error' : ''}`}>
          {result.error || (
            <>
              <p style={{ whiteSpace: 'pre-wrap' }}>{result.text}</p>
              {result.chunks_used != null && (
                <p className="rag-meta-line">
                  {t('ragPage.chunksShort', { chunks: result.chunks_used, collection: result.collection_name })}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ExamSection
