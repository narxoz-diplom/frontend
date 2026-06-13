import React from 'react'

export default function BarChart({
  data = [],
  height = 160,
  color = 'var(--brand)',
  labels = true,
  animate = true,
}) {
  const max = Math.max(...data.map((d) => d.v), 1)

  return (
    <div className="academis-bar-chart" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div
          key={`${d.l}-${i}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 7,
            height: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>{d.v}</div>
          <div
            className={animate ? 'academis-bar-fill' : undefined}
            style={{
              width: '100%',
              maxWidth: 38,
              height: `${(d.v / max) * 100}%`,
              minHeight: 4,
              background: d.color || color,
              borderRadius: '6px 6px 3px 3px',
              animationDelay: animate ? `${i * 0.06}s` : undefined,
              boxShadow: 'inset 0 -10px 18px rgba(0,0,0,.08)',
            }}
          />
          {labels && (
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {d.l}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
