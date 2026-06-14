import React, { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

function FaqGenerativeUI({ result, theme = {} }) {
  const { t } = useTranslation()
  const items = Array.isArray(result?.items) ? result.items : []
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'
  const [openIndex, setOpenIndex] = useState(null)

  if (!items.length) return null

  return (
    <div className="ag-ui-gen-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-gen-header">
        <span className="ag-ui-gen-icon">❓</span>
        <div className="ag-ui-gen-header-text">
          <h3>{t('lessonChat.lessonFaq')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
      </div>
      <div className="ag-ui-gen-body">
        <div className="ag-ui-faq-list">
          {items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className={`ag-ui-faq-item${isOpen ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="ag-ui-faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <FiChevronDown className="ag-ui-faq-chevron" aria-hidden />
                </button>
                {isOpen && item.answer && (
                  <div className="ag-ui-faq-answer">{item.answer}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FaqGenerativeUI
