import React from 'react'
import { useTranslation } from 'react-i18next'

function TimelineGenerativeUI({ result, theme = {} }) {
  const { t } = useTranslation()
  const events = Array.isArray(result?.events) ? result.events : []
  const primary = theme.primary || '#6366f1'
  const accent = theme.accent || '#a5b4fc'

  if (!events.length) return null

  return (
    <div className="ag-ui-gen-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-gen-header">
        <span className="ag-ui-gen-icon">🕐</span>
        <div className="ag-ui-gen-header-text">
          <h3>{t('lessonChat.lessonTimeline')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
      </div>
      <div className="ag-ui-gen-body">
        <div className="ag-ui-timeline">
          {events.map((event, i) => (
            <div key={i} className="ag-ui-timeline-item">
              <div className="ag-ui-timeline-marker">
                <div className="ag-ui-timeline-dot" />
                {i < events.length - 1 && <div className="ag-ui-timeline-line" />}
              </div>
              <div className="ag-ui-timeline-content">
                {event.date && <span className="ag-ui-timeline-date">{event.date}</span>}
                {event.title && <h4>{event.title}</h4>}
                {event.description && <p>{event.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TimelineGenerativeUI
