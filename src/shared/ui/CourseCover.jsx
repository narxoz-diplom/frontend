import React from 'react'
import { Icon } from '@/shared/ui/Icon'

const COVER_ICONS = {
  ml: 'sparkles',
  react: 'bolt',
  pg: 'layers',
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #e41616, #a00d0d 65%, #7d0e0e)'

const isGradient = (value) =>
  typeof value === 'string' && /(^|\s)(linear|radial|conic)-gradient\(/.test(value)

const hasContent = (value) => typeof value === 'string' && value.trim() !== ''

export default function CourseCover({
  course,
  height = 130,
  width = '100%',
  radius = 12,
  big = false,
  image,
  coverKey,
}) {
  const icon = COVER_ICONS[coverKey || course?.cover] || 'book'

  // Resolve a usable cover source. `coverGradient` is a CSS gradient,
  // while `image`/`imageUrl` is a plain URL that must be wrapped in url().
  const rawImage = [image, course?.image, course?.imageUrl].find(hasContent)
  const gradient = isGradient(course?.coverGradient) ? course.coverGradient : DEFAULT_GRADIENT

  let background
  let showOverlay = true
  if (hasContent(rawImage)) {
    if (isGradient(rawImage)) {
      background = rawImage
    } else {
      // Image layer on top, gradient as fallback behind (shown if the image fails to load)
      background = `url("${rawImage.trim()}") center / cover no-repeat, ${gradient}`
      showOverlay = false
    }
  } else {
    background = gradient
  }

  const h = typeof height === 'number' ? height : 130
  const isSmall = !big && h < 80

  const tileSize = big ? 56 : isSmall ? Math.round(h * 0.58) : 44
  const tileIcon = big ? 28 : isSmall ? Math.round(h * 0.32) : 22
  const tileRadius = isSmall ? 9 : 14
  const bgIcon = big ? 130 : isSmall ? Math.round(h * 1.1) : 92
  const bgOffset = isSmall ? -10 : -18

  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background,
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {showOverlay && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,.22), transparent 55%)',
            }}
          />
          <div style={{ position: 'absolute', right: bgOffset, bottom: bgOffset, opacity: 0.16, color: '#fff' }}>
            <Icon name={icon} size={bgIcon} />
          </div>
        </>
      )}
      {showOverlay && (
      <span
        style={{
          position: 'relative',
          color: '#fff',
          opacity: 0.95,
          display: 'grid',
          placeItems: 'center',
          width: tileSize,
          height: tileSize,
          borderRadius: tileRadius,
          background: 'rgba(255,255,255,.16)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,.25)',
        }}
      >
        <Icon name={icon} size={tileIcon} />
      </span>
      )}
    </div>
  )
}
