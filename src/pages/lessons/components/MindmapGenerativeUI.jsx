import React from 'react'
import { useTranslation } from 'react-i18next'

function MindmapGenerativeUI({ result, theme = {} }) {
  const { t } = useTranslation()
  const branches = Array.isArray(result?.branches) ? result.branches : []
  const centralTopic = result?.central_topic || result?.lesson_title || ''
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'

  if (!centralTopic && !branches.length) return null

  return (
    <div className="ag-ui-gen-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-gen-header">
        <span className="ag-ui-gen-icon">🧠</span>
        <div className="ag-ui-gen-header-text">
          <h3>{t('lessonChat.lessonMindmap')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
      </div>
      <div className="ag-ui-gen-body">
        <div className="ag-ui-mindmap">
          {centralTopic && (
            <div className="ag-ui-mindmap-center">{centralTopic}</div>
          )}
          {branches.length > 0 && (
            <div className="ag-ui-mindmap-branches">
              {branches.map((branch, i) => {
                const children = Array.isArray(branch.children) ? branch.children : []
                return (
                  <div key={i} className="ag-ui-mindmap-branch">
                    <div className="ag-ui-mindmap-branch-label">{branch.label}</div>
                    {children.length > 0 && (
                      <ul className="ag-ui-mindmap-children">
                        {children.map((child, j) => (
                          <li key={j}>{typeof child === 'string' ? child : child.label || child}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MindmapGenerativeUI
