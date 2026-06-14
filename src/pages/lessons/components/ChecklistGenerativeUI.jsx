import React, { useState } from 'react'
import { FiCheck } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

function ChecklistGenerativeUI({ result, theme = {} }) {
  const { t } = useTranslation()
  const items = Array.isArray(result?.items) ? result.items : []
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'
  const [checked, setChecked] = useState({})

  if (!items.length) return null

  const doneCount = items.filter((_, i) => checked[i]).length
  const progressPct = Math.round((doneCount / items.length) * 100)

  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }))

  return (
    <div className="ag-ui-gen-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-gen-header">
        <span className="ag-ui-gen-icon">✅</span>
        <div className="ag-ui-gen-header-text">
          <h3>{result?.title || t('lessonChat.lessonChecklist')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
      </div>
      <div className="ag-ui-gen-body">
        <div className="ag-ui-checklist-progress">
          <div className="ag-ui-checklist-progress-bar" style={{ width: `${progressPct}%` }} />
          <span>{t('lessonChat.checklistProgress', { done: doneCount, total: items.length })}</span>
        </div>
        <ul className="ag-ui-checklist">
          {items.map((item, i) => {
            const isChecked = !!checked[i]
            const importance = item.importance || 'medium'
            return (
              <li
                key={i}
                className={`ag-ui-checklist-item importance-${importance}${isChecked ? ' is-checked' : ''}`}
              >
                <button
                  type="button"
                  className="ag-ui-checklist-check"
                  onClick={() => toggle(i)}
                  aria-label={isChecked ? 'Uncheck' : 'Check'}
                >
                  {isChecked && <FiCheck />}
                </button>
                <span className={isChecked ? 'ag-ui-checklist-text-done' : undefined}>
                  {item.text}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default ChecklistGenerativeUI
