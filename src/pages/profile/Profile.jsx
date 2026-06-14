import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { isAdmin, isTeacher } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import ProfileAvatar from './components/ProfileAvatar'
import { buildProfileInitials } from '@/shared/lib/profileHelpers'
import { useProfileData } from './hooks/useProfileData'
import '../secondary-academis.css'
import './Profile.css'

const Profile = () => {
  const { t } = useTranslation()
  const { userInfo, roles, loading, error } = useProfileData(t)

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
  }, [roles.length, t, userInfo?.emailVerified])

  const initials = userInfo
    ? buildProfileInitials(userInfo.firstName, userInfo.lastName, userInfo.username)
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
    ['user', t('profilePage.firstName'), userInfo.firstName],
    ['user', t('profilePage.lastName'), userInfo.lastName],
    ['check', t('profilePage.account'), userInfo.accountEnabled ? t('common.active') : t('common.disabled')],
    ['check', t('common.verified'), userInfo.emailVerified ? t('common.verified') : t('common.notVerified')],
  ]

  const canEdit = Boolean(userInfo.userId || auth.tokenParsed?.sub)

  return (
    <div className="page profile-page-academis">
      <PageHeader
        title={t('profilePage.title')}
        subtitle={t('profilePage.subtitle')}
        actions={
          canEdit ? (
            <Link to="/profile/edit" className="btn btn-outline btn-sm">
              <Icon name="edit" size={16} />
              {t('profilePage.editProfile')}
            </Link>
          ) : null
        }
      />

      <div className="card profile-card">
        <div className="profile-hero">
          <div className="profile-banner" aria-hidden />
          <div className="profile-avatar-wrap">
            <ProfileAvatar
              avatarUrl={userInfo.avatarUrl}
              initials={initials}
              alt={userInfo.fullName}
            />
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-identity">
            <h2 className="h2 profile-name">{userInfo.fullName}</h2>
            <p className="profile-meta">
              @{userInfo.username} · {userInfo.email}
            </p>
            <div className="profile-roles">
              {roles.map((role) => (
                <span key={role} className="badge badge-red row gap4">
                  <Icon name="award" size={12} />
                  {roleConfig[role]?.label || role}
                </span>
              ))}
            </div>
          </div>

          <div className="stat-grid s3 profile-stats">
            {statItems.map(([icon, value, label]) => (
              <div key={label} className="card card-pad profile-stat">
                <span className="profile-stat-icon">
                  <Icon name={icon} size={20} />
                </span>
                <div className="mono profile-stat-value">{value}</div>
                <div className="dim profile-stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="profile-info">
            <div className="eyebrow">{t('profilePage.personalInfo')}</div>
            {infoRows.map(([icon, key, value]) => (
              <div key={key} className="profile-info-row">
                <span className="profile-info-label">
                  <Icon name={icon} size={16} />
                  {key}
                </span>
                <span className="profile-info-value">{value}</span>
              </div>
            ))}
            {userInfo.userId && (
              <div className="profile-info-row">
                <span className="profile-info-label">
                  <Icon name="user" size={16} />
                  {t('profilePage.userId')}
                </span>
                <span className="profile-info-value mono">{userInfo.userId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
