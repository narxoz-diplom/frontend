import React from 'react'
import { useTranslation } from 'react-i18next'

function ComparisonGenerativeUI({ result, theme = {} }) {
  const { t } = useTranslation()
  const columns = Array.isArray(result?.columns) ? result.columns : []
  const rows = Array.isArray(result?.rows) ? result.rows : []
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'

  if (!columns.length || !rows.length) return null

  return (
    <div className="ag-ui-gen-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-gen-header">
        <span className="ag-ui-gen-icon">⚖️</span>
        <div className="ag-ui-gen-header-text">
          <h3>{result?.title || t('lessonChat.lessonComparison')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
      </div>
      <div className="ag-ui-gen-body">
        <div className="ag-ui-comparison-table-wrap">
          <table className="ag-ui-comparison-table">
            <thead>
              <tr>
                <th>{t('lessonChat.criterion')}</th>
                {columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="ag-ui-comparison-label">{row.label}</td>
                  {(Array.isArray(row.values) ? row.values : []).map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ComparisonGenerativeUI
