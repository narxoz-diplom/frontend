const AVATAR_KEY_PREFIX = 'academis_avatar:'

export const formatProfileField = (value) => {
  if (value == null || String(value).trim() === '') return '—'
  return String(value).trim()
}

export const buildProfileFullName = (firstName, lastName, username) => {
  const parts = [firstName, lastName].filter((p) => p && String(p).trim() !== '' && String(p) !== '—')
  if (parts.length > 0) return parts.join(' ')
  return username || '—'
}

export const buildProfileInitials = (firstName, lastName, username) => {
  const f = firstName && String(firstName).trim() && firstName !== '—' ? firstName.trim().charAt(0) : ''
  const l = lastName && String(lastName).trim() && lastName !== '—' ? lastName.trim().charAt(0) : ''
  if (f && l) return `${f}${l}`.toUpperCase()
  const u = (username || '').trim()
  if (u.length >= 2) return u.slice(0, 2).toUpperCase()
  if (u.length === 1) return `${u}${u}`.toUpperCase()
  return '?'
}

export const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:')) {
    return avatarUrl
  }
  const origin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`
  return `${origin}${path}`
}

export const getStoredAvatarUrl = (userId) => {
  if (!userId || typeof window === 'undefined') return null
  try {
    return localStorage.getItem(`${AVATAR_KEY_PREFIX}${userId}`) || null
  } catch {
    return null
  }
}

export const setStoredAvatarUrl = (userId, url) => {
  if (!userId || typeof window === 'undefined') return
  try {
    const key = `${AVATAR_KEY_PREFIX}${userId}`
    if (!url) localStorage.removeItem(key)
    else localStorage.setItem(key, url)
    window.dispatchEvent(new CustomEvent('academis:avatar-updated', { detail: { userId, url } }))
  } catch {
    /* ignore quota errors */
  }
}

export const buildFileContentUrl = (fileId) => (fileId ? `/api/files/${fileId}/content` : null)
