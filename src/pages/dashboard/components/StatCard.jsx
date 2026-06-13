import React from 'react'
import { Icon } from '@/shared/ui/academis'

const TONE_COLORS = {
  primary: 'linear-gradient(135deg,#e41616,#a00d0d)',
  success: 'linear-gradient(135deg,#11a957,#0e8f49)',
  warning: 'linear-gradient(135deg,#e8920c,#b45309)',
  info: 'linear-gradient(135deg,#2563eb,#1e3a8a)',
}

const StatCard = ({
  icon,
  iconName,
  color,
  tone,
  value,
  label,
  delta,
  deltaDir = 'up',
  onClick,
}) => {
  const background = color || TONE_COLORS[tone] || 'var(--surface-3)'
  const iconContent = (typeof icon === 'string' || iconName)
    ? <Icon name={iconName || icon} size={19} />
    : icon

  return (
    <div
      className="stat fade-up"
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <span className="s-ic" style={{ background }}>
        {iconContent}
      </span>
      <div className="s-val mono">{value}</div>
      <div className="s-label">{label}</div>
      {delta != null && delta !== '' && (
        <div className={`s-delta ${deltaDir}`}>
          <Icon name="trend" size={13} />
          {delta}
        </div>
      )}
    </div>
  )
}

export default StatCard
