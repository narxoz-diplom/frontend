import React from 'react'
import { Icon } from '@/shared/ui/Icon'

export default function EmptyState({ icon = 'files', title, desc, action }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '52px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--surface-3)',
          color: 'var(--text-3)',
          marginBottom: 6,
        }}
      >
        <Icon name={icon} size={28} />
      </span>
      <div className="h3">{title}</div>
      {desc && (
        <div className="muted" style={{ maxWidth: 320, fontSize: 13.5 }}>
          {desc}
        </div>
      )}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  )
}
