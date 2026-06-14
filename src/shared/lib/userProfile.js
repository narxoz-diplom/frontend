import { useEffect, useState } from 'react'
import auth from '@/shared/config/auth'
import { isAdmin, isTeacher } from '@/shared/lib/roles'
import { getStoredAvatarUrl } from '@/shared/lib/profileHelpers'

export const getUserProfile = () => {
  const parsed = auth?.tokenParsed
  if (!parsed) {
    return {
      initials: 'U',
      fullName: 'User',
      firstName: 'User',
      lastName: '',
      email: '',
      avatarUrl: null,
      userId: null,
    }
  }

  const firstName = parsed.given_name
    || (parsed.name && parsed.name.split(' ')[0])
    || parsed.preferred_username
    || 'User'
  const lastName = parsed.family_name
    || (parsed.name && parsed.name.split(' ').slice(1).join(' '))
    || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'U'
  const userId = parsed.sub || null

  return {
    initials,
    fullName,
    firstName,
    lastName,
    email: parsed.email || '',
    avatarUrl: getStoredAvatarUrl(userId),
    userId,
  }
}

export const getPrimaryRoleLabel = (t) => {
  if (isAdmin(auth)) return 'Admin'
  if (isTeacher(auth)) return t('auth.teacher')
  return t('auth.student')
}

export const useLiveUserProfile = () => {
  const [profile, setProfile] = useState(() => getUserProfile())

  useEffect(() => {
    const refresh = () => setProfile(getUserProfile())
    window.addEventListener('academis:avatar-updated', refresh)
    return () => window.removeEventListener('academis:avatar-updated', refresh)
  }, [])

  return profile
}
