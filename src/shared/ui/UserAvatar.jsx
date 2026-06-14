import Avatar from '@/shared/ui/Avatar'

/** Reusable avatar for lists, course pages, etc. */
export default function UserAvatar({ avatarUrl, initials, small = false, className = '', alt = '' }) {
  return (
    <Avatar
      avatarUrl={avatarUrl}
      initials={initials}
      size={small ? 'sm' : 'md'}
      className={className}
      alt={alt}
    />
  )
}
