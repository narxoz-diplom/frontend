import React from 'react'
import { resolveAvatarUrl } from '@/shared/lib/profileHelpers'

/** Large avatar for profile pages only — do not use in navbar/sidebar. */
export default function ProfileAvatar({
  avatarUrl,
  initials,
  size = 'profile',
  className = '',
  alt = '',
}) {
  const src = resolveAvatarUrl(avatarUrl)
  const sizeClass =
    size === 'profile-lg' ? 'profile-avatar profile-avatar--lg' : 'profile-avatar'

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} profile-avatar-img${className ? ` ${className}` : ''}`}
      />
    )
  }

  return (
    <span className={`${sizeClass}${className ? ` ${className}` : ''}`} aria-hidden>
      {initials}
    </span>
  )
}
