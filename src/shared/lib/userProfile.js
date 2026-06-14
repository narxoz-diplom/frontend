import { useCallback, useEffect, useState } from 'react'
import auth from '@/shared/config/auth'
import { isAdmin, isTeacher } from '@/shared/lib/roles'
import { getCurrentUser } from '@/shared/api/authApi'

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
    avatarUrl: null,
    userId,
  }
}

export const getPrimaryRoleLabel = (t) => {
  if (isAdmin(auth)) return 'Admin'
  if (isTeacher(auth)) return t('auth.teacher')
  return t('auth.student')
}

const mergeProfileFromApi = (base, data) => {
  if (!data) return base
  const firstName = data.firstName || base.firstName
  const lastName = data.lastName || base.lastName
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || base.fullName
  const initials = `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || base.initials
  return {
    ...base,
    firstName,
    lastName,
    fullName,
    initials,
    email: data.email || base.email,
    avatarUrl: data.avatarUrl || null,
    userId: data.id || base.userId,
  }
}

export const useLiveUserProfile = () => {
  const [profile, setProfile] = useState(() => getUserProfile())

  const refresh = useCallback(async () => {
    const base = getUserProfile()
    if (!auth.token) {
      setProfile(base)
      return
    }
    try {
      const { data } = await getCurrentUser()
      setProfile(mergeProfileFromApi(base, data))
    } catch {
      setProfile(base)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onAvatarUpdated = (e) => {
      const { userId, url } = e.detail || {}
      setProfile((prev) => (prev.userId === userId ? { ...prev, avatarUrl: url } : prev))
    }
    window.addEventListener('academis:avatar-updated', onAvatarUpdated)
    return () => window.removeEventListener('academis:avatar-updated', onAvatarUpdated)
  }, [refresh])

  return profile
}
