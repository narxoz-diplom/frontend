import Avatar from '@/shared/ui/Avatar'

/** Large avatar for profile pages only — do not use in navbar/sidebar. */
export default function ProfileAvatar({
  avatarUrl,
  initials,
  size = 'profile',
  className = '',
  alt = '',
}) {
  const avatarSize = size === 'profile-lg' ? 'profile-lg' : 'profile'
  return (
    <Avatar
      avatarUrl={avatarUrl}
      initials={initials}
      size={avatarSize}
      className={className}
      alt={alt}
    />
  )
}
