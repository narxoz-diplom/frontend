import React from 'react'
import { useTranslation } from 'react-i18next'

function StepsGenerativeUI({ result, theme = {} }) {
  const { t } = useTranslation()
  const steps = Array.isArray(result?.steps) ? result.steps : []
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'

  if (!steps.length) return null

  return (
    <div className="ag-ui-gen-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-gen-header">
        <span className="ag-ui-gen-icon">🔢</span>
        <div className="ag-ui-gen-header-text">
          <h3>{result?.title || t('lessonChat.lessonSteps')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
      </div>
      <div className="ag-ui-gen-body">
        <ol className="ag-ui-steps-list">
          {steps.map((step, i) => (
            <li key={i} className="ag-ui-steps-item">
              <div className="ag-ui-steps-number">{i + 1}</div>
              <div className="ag-ui-steps-content">
                {step.title && <h4>{step.title}</h4>}
                {step.description && <p>{step.description}</p>}
                {step.tip && <p className="ag-ui-steps-tip">💡 {step.tip}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default StepsGenerativeUI
