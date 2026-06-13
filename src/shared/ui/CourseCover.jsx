import React from 'react'
import { Icon } from '@/shared/ui/Icon'

const COVER_ICONS = {
  ml: 'sparkles',
  react: 'bolt',
  pg: 'layers',
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #e41616, #a00d0d 65%, #7d0e0e)'

export default function CourseCover({
  course,
  height = 130,
  radius = 12,
  big = false,
  image,
  coverKey,
}) {
  const icon = COVER_ICONS[coverKey || course?.cover] || 'book'
  const background = image || course?.image || course?.coverGradient || DEFAULT_GRADIENT

  return (
    <div
      style={{
        height,
        borderRadius: radius,
        background,
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,.22), transparent 55%)',
        }}
      />
      <div style={{ position: 'absolute', right: -18, bottom: -18, opacity: 0.16, color: '#fff' }}>
        <Icon name={icon} size={big ? 130 : 92} />
      </div>
      <span
        style={{
          position: 'relative',
          color: '#fff',
          opacity: 0.95,
          display: 'grid',
          placeItems: 'center',
          width: big ? 56 : 44,
          height: big ? 56 : 44,
          borderRadius: 14,
          background: 'rgba(255,255,255,.16)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,.25)',
        }}
      >
        <Icon name={icon} size={big ? 28 : 22} />
      </span>
    </div>
  )
}
