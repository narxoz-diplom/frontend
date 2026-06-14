import Avatar from '@/shared/ui/Avatar'

/** Compact avatar for navbar / sidebar only — never use profile-page sizes here. */
export default function NavAvatar({ avatarUrl, initials, small = false }) {
  return (
    <Avatar
      avatarUrl={avatarUrl}
      initials={initials}
      size={small ? 'sm' : 'md'}
    />
  )
}
