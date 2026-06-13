import React from 'react'
import { Icon } from '@/shared/ui/Icon'

export default function SectionCard({ title, action, children, pad = true, icon }) {
  return (
    <div className="card">
      {title && (
        <div className="sec-head">
          <div className="row gap8" style={{ alignItems: 'center' }}>
            {icon && (
              <span style={{ color: 'var(--brand)' }}>
                <Icon name={icon} size={18} />
              </span>
            )}
            <h3 className="h3">{title}</h3>
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: pad ? '6px 18px 18px' : 0 }}>{children}</div>
    </div>
  )
}
