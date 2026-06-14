import React, { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

function GlossaryGenerativeUI({ result, theme = {} }) {
  const { t } = useTranslation()
  const terms = Array.isArray(result?.terms) ? result.terms : []
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (!terms.length) return null

  const current = terms[index]
  const goTo = (next) => {
    setIndex(next)
    setFlipped(false)
  }

  return (
    <div className="ag-ui-gen-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-gen-header">
        <span className="ag-ui-gen-icon">📖</span>
        <div className="ag-ui-gen-header-text">
          <h3>{t('lessonChat.lessonGlossary')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
      </div>
      <div className="ag-ui-gen-body">
        <div className="ag-ui-glossary-nav">
          <button
            type="button"
            className="ag-ui-glossary-nav-btn"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            aria-label="Previous term"
          >
            <FiChevronLeft />
          </button>
          <span className="ag-ui-glossary-counter">{index + 1} / {terms.length}</span>
          <button
            type="button"
            className="ag-ui-glossary-nav-btn"
            disabled={index === terms.length - 1}
            onClick={() => goTo(index + 1)}
            aria-label="Next term"
          >
            <FiChevronRight />
          </button>
        </div>
        <button
          type="button"
          className={`ag-ui-flashcard${flipped ? ' is-flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          aria-label={t('lessonChat.flipCard')}
        >
          <div className="ag-ui-flashcard-inner">
            <div className="ag-ui-flashcard-front">
              <span className="ag-ui-flashcard-label">{t('lessonChat.term')}</span>
              <strong>{current.term}</strong>
              <span className="ag-ui-flashcard-hint">{t('lessonChat.tapToFlip')}</span>
            </div>
            <div className="ag-ui-flashcard-back">
              <span className="ag-ui-flashcard-label">{t('lessonChat.definition')}</span>
              <p>{current.definition}</p>
              {current.example && (
                <p className="ag-ui-flashcard-example">
                  {t('lessonChat.example')}: {current.example}
                </p>
              )}
            </div>
          </div>
        </button>
        <div className="ag-ui-glossary-dots">
          {terms.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`ag-ui-glossary-dot${i === index ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Term ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default GlossaryGenerativeUI
