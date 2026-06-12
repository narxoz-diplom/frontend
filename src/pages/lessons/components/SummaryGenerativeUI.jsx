import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { dedupeSummaryBlocks } from '../lib/chatMessages'

function SummaryGenerativeUI({ result, theme = {}, onClose }) {
  const { t } = useTranslation()
  const summary = dedupeSummaryBlocks(String(result?.summary || ''))
  const primary = theme.primary || '#e41616'
  const accent = theme.accent || '#ed5a5a'
  if (!summary) return null
  return (
    <div className="ag-ui-summary-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-summary-header">
        <span className="ag-ui-summary-icon">📋</span>
        <div>
          <h3>{t('lessonChat.lessonSummary')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="ag-ui-card-close" onClick={onClose} aria-label={t('lessonChat.close')}>
            <FiX />
          </button>
        )}
      </div>
      <div className="ag-ui-summary-body ag-ui-summary-body--md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
      </div>
    </div>
  )
}

export default SummaryGenerativeUI
