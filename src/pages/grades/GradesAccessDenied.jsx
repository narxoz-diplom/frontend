import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/shared/ui/academis'

export default function GradesAccessDenied({ title, body, backLabel, backTo = '/' }) {
  return (
    <div className="page page-wide grades-page grades-page--center">
      <div className="card card-pad grades-access-card" role="alert">
        <div className="grades-access-icon" aria-hidden>
          <Icon name="lock" size={28} />
        </div>
        {title && <h2 className="h2">{title}</h2>}
        {body && (
          <p className="muted" style={{ marginTop: 8 }}>
            {body}
          </p>
        )}
        <Link to={backTo} className="btn btn-primary" style={{ marginTop: 16 }}>
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
