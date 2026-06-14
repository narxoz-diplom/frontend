import { useEffect, useState } from 'react'
import { resolveAvatarUrl } from '@/shared/lib/profileHelpers'
import './Avatar.css'

const SIZE_CLASS = {
  sm: 'avatar-shell--sm',
  md: 'avatar-shell--md',
  lg: 'avatar-shell--lg',
  profile: 'avatar-shell--profile',
  'profile-lg': 'avatar-shell--profile-lg',
}

/**
 * Fixed-size circular avatar. Image is always clipped inside the shell.
 * @param {'sm'|'md'|'lg'|'profile'|'profile-lg'} size
 */
export default function Avatar({
  avatarUrl,
  initials = '?',
  size = 'md',
  className = '',
  alt = '',
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const src = resolveAvatarUrl(avatarUrl)
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md
  const shellClass = ['avatar-shell', sizeClass, className].filter(Boolean).join(' ')

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  const showImage = Boolean(src && !imageFailed)

  return (
    <span className={shellClass} aria-hidden={!alt && !showImage}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="avatar-shell__img"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="avatar-shell__initials">{initials}</span>
      )}
    </span>
  )
}
