import { resolveAvatarUrl } from '@/shared/lib/profileHelpers'

/** Compact avatar for navbar / sidebar only — never use profile-page sizes here. */
export default function NavAvatar({ avatarUrl, initials, small = false }) {
  const src = resolveAvatarUrl(avatarUrl)
  const className = small ? 'avatar avatar-sm' : 'avatar'

  if (src) {
    return <img src={src} alt="" className={`${className} nav-avatar-img`} />
  }

  return <span className={className}>{initials}</span>
}
