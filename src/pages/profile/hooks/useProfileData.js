import { useState, useEffect, useCallback } from 'react'
import auth from '@/shared/config/auth'
import { getRoles } from '@/shared/lib/roles'
import { getCurrentUser } from '@/shared/api/authApi'
import {
  formatProfileField,
  buildProfileFullName,
} from '@/shared/lib/profileHelpers'

const fromToken = () => {
  if (!auth.tokenParsed) return null
  const token = auth.tokenParsed
  const userId = token.sub || null
  return {
    username: token.preferred_username || token.sub,
    email: formatProfileField(token.email),
    firstName: formatProfileField(token.given_name),
    lastName: formatProfileField(token.family_name),
    fullName:
      token.name
      || [token.given_name, token.family_name].filter(Boolean).join(' ').trim()
      || token.preferred_username
      || '—',
    emailVerified: Boolean(token.email_verified),
    accountEnabled: true,
    userId,
    avatarUrl: null,
  }
}

const applyUserPayload = (data, fallbackRoles) => {
  const first = data.firstName != null ? formatProfileField(data.firstName) : null
  const last = data.lastName != null ? formatProfileField(data.lastName) : null
  const username = data.username || auth.tokenParsed?.preferred_username || '—'
  const fn = first === '—' ? null : first
  const ln = last === '—' ? null : last
  const userId = data.id || auth.tokenParsed?.sub || null
  return {
    userInfo: {
      username,
      email: formatProfileField(data.email),
      firstName: fn != null ? fn : '—',
      lastName: ln != null ? ln : '—',
      fullName: buildProfileFullName(fn, ln, username),
      emailVerified: Boolean(data.emailVerified),
      accountEnabled: data.enabled !== false,
      userId,
      avatarUrl: data.avatarUrl || null,
    },
    roles: (Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : fallbackRoles).length
      ? (Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : fallbackRoles)
      : fallbackRoles,
  }
}

export function useProfileData(t) {
  const [userInfo, setUserInfo] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProfile = useCallback(async () => {
    setError(null)
    try {
      const { data } = await getCurrentUser()
      const { userInfo: info, roles: r } = applyUserPayload(data, getRoles(auth))
      setUserInfo(info)
      setRoles(r)
    } catch {
      const fallback = fromToken()
      if (fallback) {
        setUserInfo(fallback)
        setRoles(getRoles(auth))
      } else {
        setError(t('profilePage.loadError'))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (auth.token) loadProfile()
    else {
      const fallback = fromToken()
      if (fallback) {
        setUserInfo(fallback)
        setRoles(getRoles(auth))
      }
      setLoading(false)
    }
  }, [loadProfile])

  useEffect(() => {
    const onAvatarUpdated = (e) => {
      const { userId, url } = e.detail || {}
      setUserInfo((prev) => (prev && prev.userId === userId ? { ...prev, avatarUrl: url } : prev))
    }
    window.addEventListener('academis:avatar-updated', onAvatarUpdated)
    return () => window.removeEventListener('academis:avatar-updated', onAvatarUpdated)
  }, [])

  return { userInfo, setUserInfo, roles, loading, error, loadProfile }
}
