import React from 'react'

export default function Donut({
  value = 0,
  size = 120,
  stroke = 13,
  color = 'var(--brand)',
  label,
  sub,
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 1s var(--ease-out)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="mono" style={{ fontSize: size * 0.26, fontWeight: 800, letterSpacing: '-0.03em' }}>
          {label != null ? label : `${pct}%`}
        </div>
        {sub && (
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
