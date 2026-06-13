import React from 'react'

export default function Spinner({ size = 18, color }) {
  return (
    <span
      className="spin"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        border: `2.5px solid ${color ? 'rgba(255,255,255,.35)' : 'var(--border-strong)'}`,
        borderTopColor: color || 'var(--brand)',
        borderRadius: '50%',
      }}
      aria-hidden
    />
  )
}
