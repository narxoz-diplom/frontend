import React from 'react'

export function LogoMark({ size = 30, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="academis-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3a3a" />
          <stop offset="1" stopColor="#c50f0f" />
        </linearGradient>
      </defs>
      <path
        fill="url(#academis-logo-grad)"
        fillRule="evenodd"
        d="M24 2.5 L46 43 H30.7 L24 30.2 L17.3 43 H2 Z M24 17.4 L18.9 27.2 H29.1 Z"
      />
      <path
        fill="url(#academis-logo-grad)"
        d="M33.4 28.2 L46.5 43 H33.6 L28.7 33.7 Z"
        opacity="0.55"
      />
    </svg>
  )
}

export function Logo({ size = 30, showText = true, compact = false, className = '' }) {
  return (
    <div className={`logo-lockup ${className}`.trim()} style={{ display: 'flex', alignItems: 'center', gap: showText ? 10 : 0 }}>
      <LogoMark size={size} />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: size * 0.6, fontWeight: 850, letterSpacing: '-0.04em', color: 'var(--text)' }}>
            Academis
          </span>
          {!compact && (
            <span
              style={{
                fontSize: size * 0.255,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'var(--brand)',
                textTransform: 'uppercase',
                marginTop: 3,
              }}
            >
              AI Learning
            </span>
          )}
        </div>
      )}
    </div>
  )
}
