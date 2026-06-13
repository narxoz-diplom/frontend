import React, { useId } from 'react'

export default function LineChart({
  data = [],
  height = 170,
  color = 'var(--brand)',
  area = true,
}) {
  const gradientId = useId().replace(/:/g, '')
  if (data.length < 2) {
    return (
      <div className="muted" style={{ padding: '24px 0', textAlign: 'center', fontSize: 13 }}>
        —
      </div>
    )
  }

  const w = 480
  const h = height
  const pad = 14
  const max = Math.max(...data.map((d) => d.v)) * 1.1
  const min = Math.min(...data.map((d) => d.v)) * 0.85
  const xs = (i) => pad + (i * (w - pad * 2)) / (data.length - 1)
  const ys = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2)
  const pts = data.map((d, i) => [xs(i), ys(d.v)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${line} L ${xs(data.length - 1)} ${h - pad} L ${pad} ${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={pad}
          x2={w - pad}
          y1={pad + (i * (h - pad * 2)) / 3}
          y2={pad + (i * (h - pad * 2)) / 3}
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}
      {area && <path d={areaPath} fill={`url(#${gradientId})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="academis-line-path"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
      ))}
      {data.map((d, i) => (
        <text
          key={`x-${d.l}`}
          x={xs(i)}
          y={h - 1}
          fontSize="10"
          fill="var(--text-3)"
          textAnchor="middle"
          fontWeight="600"
        >
          {d.l}
        </text>
      ))}
    </svg>
  )
}
