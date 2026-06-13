import React, { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'

export default function PageHeader({ title, subtitle, actions, back, breadcrumb }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        {breadcrumb?.length > 0 && (
          <div className="breadcrumb">
            {breadcrumb.map((item, index) => (
              <Fragment key={`${item.label}-${index}`}>
                {index > 0 && <Icon name="chevRight" size={13} style={{ color: 'var(--text-3)' }} />}
                {item.to ? (
                  <Link to={item.to} className="bc-link">
                    {item.label}
                  </Link>
                ) : (
                  <span className="bc-current">{item.label}</span>
                )}
              </Fragment>
            ))}
          </div>
        )}
        <div className="row gap10" style={{ alignItems: 'center' }}>
          {back && (
            <button type="button" className="btn btn-icon btn-outline btn-sm" onClick={handleBack} aria-label="Back">
              <Icon name="chevLeft" size={18} />
            </button>
          )}
          <h1 className="h1" style={{ fontSize: 25 }}>
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="muted" style={{ marginTop: 5, fontSize: 14 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="row gap10 wrap" style={{ flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}
