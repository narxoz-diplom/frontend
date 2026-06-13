import React, { useState, useEffect, useMemo } from 'react'
import auth from '@/shared/config/auth'
import { getRoles, isAdmin, isTeacher } from '@/shared/lib/roles'
import { getCurrentUser } from '@/shared/api/authApi'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import '../secondary-academis.css'

const formatField = (value) => {
  if (value == null || String(value).trim() === '') return '—'
  return String(value).trim()
}

const buildFullName = (firstName, lastName, username) => {
  const parts = [firstName, lastName].filter((p) => p && String(p).trim() !== '' && String(p) !== '—')
  if (parts.length > 0) return parts.join(' ')
  return username || '—'
}

const buildInitials = (firstName, lastName, username) => {
  const f = firstName && String(firstName).trim() && firstName !== '—' ? firstName.trim().charAt(0) : ''
  const l = lastName && String(lastName).trim() && lastName !== '—' ? lastName.trim().charAt(0) : ''
  if (f && l) return `${f}${l}`.toUpperCase()
  const u = (username || '').trim()
  if (u.length >= 2) return u.slice(0, 2).toUpperCase()
  if (u.length === 1) return `${u}${u}`.toUpperCase()
  return '?'
}

const Profile = () => {
  const { t } = useTranslation()
  const [userInfo, setUserInfo] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fromToken = () => {
      if (!auth.tokenParsed) return null
      const token = auth.tokenParsed
      return {
        username: token.preferred_username || token.sub,
        email: formatField(token.email),
        firstName: formatField(token.given_name),
        lastName: formatField(token.family_name),
        fullName:
          token.name
          || [token.given_name, token.family_name].filter(Boolean).join(' ').trim()
          || token.preferred_username
          || '—',
        emailVerified: Boolean(token.email_verified),
        accountEnabled: true,
      }
    }

    const applyUserPayload = (data, fallbackRoles) => {
      const first = data.firstName != null ? formatField(data.firstName) : null
      const last = data.lastName != null ? formatField(data.lastName) : null
      const username = data.username || auth.tokenParsed?.preferred_username || '—'
      const fn = first === '—' ? null : first
      const ln = last === '—' ? null : last
      setUserInfo({
        username,
        email: formatField(data.email),
        firstName: fn != null ? fn : '—',
        lastName: ln != null ? ln : '—',
        fullName: buildFullName(fn, ln, username),
        emailVerified: Boolean(data.emailVerified),
        accountEnabled: data.enabled !== false,
        userId: data.id || null,
      })
      const r = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : fallbackRoles
      setRoles(r.length ? r : fallbackRoles)
    }

    const applyTokenFallback = () => {
      const fallback = fromToken()
      if (fallback) {
        setUserInfo(fallback)
        setRoles(getRoles(auth))
        return true
      }
      return false
    }

    const load = async () => {
      setError(null)
      try {
        const { data } = await getCurrentUser()
        if (!cancelled) {
          applyUserPayload(data, getRoles(auth))
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          if (!applyTokenFallback()) {
            setError(t('profilePage.loadError'))
          }
          setLoading(false)
        }
      }
    }

    if (auth.token) {
      load()
    } else {
      applyTokenFallback()
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [t])

  const roleConfig = useMemo(
    () => ({
      admin: { label: t('profilePage.administrator') },
      teacher: { label: t('profilePage.teacher') },
      client: { label: t('profilePage.student') },
      ROLE_ADMIN: { label: t('profilePage.administrator') },
      ROLE_TEACHER: { label: t('profilePage.teacher') },
      ROLE_CLIENT: { label: t('profilePage.student') },
    }),
    [t],
  )

  const statItems = useMemo(() => {
    if (isAdmin(auth)) {
      return [
        ['users', roles.length || '—', t('profilePage.roles')],
        ['book', '—', t('common.courses')],
        ['settings', '✓', t('profilePage.auth')],
      ]
    }
    if (isTeacher(auth)) {
      return [
        ['books', '—', t('common.courses')],
        ['users', '—', t('profilePage.student')],
        ['sparkles', '—', 'AI'],
      ]
    }
    return [
      ['book', '—', t('common.course')],
      ['award', '—', t('nav.myGrades')],
      ['check', userInfo?.emailVerified ? '✓' : '—', t('common.verified')],
    ]
  }, [auth, roles.length, t, userInfo?.emailVerified])

  const initials = userInfo
    ? buildInitials(userInfo.firstName, userInfo.lastName, userInfo.username)
    : ''

  if (loading) {
    return (
      <div className="page profile-page-academis secondary-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (error || !userInfo) {
    return (
      <div className="page profile-page-academis">
        <div className="secondary-flash secondary-flash--error">{error || t('profilePage.loadError')}</div>
      </div>
    )
  }

  const infoRows = [
    ['mail', t('profilePage.email'), userInfo.email],
    ['user', t('profilePage.username'), `@${userInfo.username}`],
    ['check', t('profilePage.account'), userInfo.accountEnabled ? t('common.active') : t('common.disabled')],
    ['check', t('common.verified'), userInfo.emailVerified ? t('common.verified') : t('common.notVerified')],
  ]

  return (
    <div className="page profile-page-academis">
      <PageHeader title={t('profilePage.title')} subtitle={t('profilePage.subtitle')} />

      <div className="card profile-card">
        <div className="profile-banner" />
        <div className="profile-body">
          <span
            className="avatar"
            style={{
              width: 84,
              height: 84,
              fontSize: 30,
              border: '4px solid var(--surface)',
              marginTop: -52,
            }}
            aria-hidden
          >
            {initials}
          </span>

          <div className="row between wrap gap12" style={{ marginTop: 12, alignItems: 'flex-start' }}>
            <div>
              <h2 className="h2">{userInfo.fullName}</h2>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>
                @{userInfo.username} · {userInfo.email}
              </div>
              <div className="row gap6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                {roles.map((role) => (
                  <span key={role} className="badge badge-red row gap4">
                    <Icon name="award" size={12} />
                    {roleConfig[role]?.label || role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-grid s3" style={{ marginTop: 20 }}>
            {statItems.map(([icon, value, label]) => (
              <div key={label} className="card card-pad" style={{ textAlign: 'center' }}>
                <span style={{ color: 'var(--brand)' }}>
                  <Icon name={icon} size={20} />
                </span>
                <div className="mono" style={{ fontWeight: 800, fontSize: 22, marginTop: 6 }}>
                  {value}
                </div>
                <div className="dim" style={{ fontSize: 12 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="col gap10" style={{ marginTop: 18 }}>
            <div className="eyebrow">{t('profilePage.personalInfo')}</div>
            {infoRows.map(([icon, key, value]) => (
              <div
                key={key}
                className="row between"
                style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}
              >
                <span className="row gap10 muted" style={{ fontSize: 13.5 }}>
                  <Icon name={icon} size={16} />
                  {key}
                </span>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{value}</span>
              </div>
            ))}
            {userInfo.userId && (
              <div
                className="row between"
                style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}
              >
                <span className="row gap10 muted" style={{ fontSize: 13.5 }}>
                  <Icon name="user" size={16} />
                  {t('profilePage.userId')}
                </span>
                <span className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
                  {userInfo.userId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
