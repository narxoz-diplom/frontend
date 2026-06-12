import React from 'react'
import { FiEdit3 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const ExamSection = ({ collection, result, loading, onCollectionChange, onSubmit }) => {
  const { t } = useTranslation()

  return (
    <section className="rag-card">
      <h2><FiEdit3 /> {t('ragPage.examQuestions')}</h2>
      <form onSubmit={onSubmit}>
        <label>{t('ragPage.collection')}</label>
        <input
          type="text"
          value={collection}
          onChange={(e) => onCollectionChange(e.target.value)}
          placeholder="default"
        />
        <button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('ragPage.generateQuestions')}
        </button>
      </form>
      {result && (
        <div className={`rag-out ${result.error ? 'error' : 'text'}`}>
          {result.error || (
            <>
              {result.text}
              {result.chunks_used != null && (
                <p className="rag-meta">{t('ragPage.chunksShort', { chunks: result.chunks_used, collection: result.collection_name })}</p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default ExamSection
