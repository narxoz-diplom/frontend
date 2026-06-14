import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { updateUser } from '@/shared/api/authApi'
import { uploadNewsImage } from '@/shared/api/filesApi'
import { resolveApiError } from '@/shared/lib/apiError'
import { useAlert } from '@/app/providers/AlertProvider'
import {
  buildFileContentUrl,
  buildProfileInitials,
  setStoredAvatarUrl,
} from '@/shared/lib/profileHelpers'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import SectionCard from '@/shared/ui/SectionCard'
import ProfileAvatar from './components/ProfileAvatar'
import { useProfileData } from './hooks/useProfileData'
import '../secondary-academis.css'
import './Profile.css'

const emptyForm = { firstName: '', lastName: '', email: '' }

const ROLE_META = {
  admin:        { label: 'Администратор', icon: 'settings', color: 'var(--brand)' },
  ROLE_ADMIN:   { label: 'Администратор', icon: 'settings', color: 'var(--brand)' },
  teacher:      { label: 'Преподаватель', icon: 'book',     color: 'var(--blue-500)' },
  ROLE_TEACHER: { label: 'Преподаватель', icon: 'book',     color: 'var(--blue-500)' },
  client:       { label: 'Студент',       icon: 'award',    color: 'var(--green-600)' },
  ROLE_CLIENT:  { label: 'Студент',       icon: 'award',    color: 'var(--green-600)' },
}

const ProfileEdit = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useAlert()
  const fileRef = useRef(null)
  const { userInfo, loading, error, roles, loadProfile } = useProfileData(t)

  const [form, setForm] = useState(emptyForm)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userInfo) return
    setForm({
      firstName: userInfo.firstName === '—' ? '' : userInfo.firstName,
      lastName: userInfo.lastName === '—' ? '' : userInfo.lastName,
      email: userInfo.email === '—' ? '' : userInfo.email,
    })
    setAvatarPreview(userInfo.avatarUrl || null)
    setAvatarFile(null)
    setRemoveAvatar(false)
  }, [userInfo])

  const initials = useMemo(
    () => (userInfo ? buildProfileInitials(form.firstName, form.lastName, userInfo.username) : ''),
    [userInfo, form.firstName, form.lastName],
  )

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const handlePickAvatar = () => fileRef.current?.click()

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast(t('profilePage.avatarInvalidType'), 'error'); return }
    if (file.size > 5 * 1024 * 1024) { toast(t('profilePage.avatarTooLarge'), 'error'); return }
    setAvatarFile(file)
    setRemoveAvatar(false)
    setAvatarPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const userId = userInfo?.userId || auth.tokenParsed?.sub
    if (!userId) { toast(t('profilePage.saveError'), 'error'); return }

    const email = form.email.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast(t('profilePage.emailInvalid'), 'error'); return
    }

    setSaving(true)
    try {
      let nextAvatarUrl = userInfo.avatarUrl || null
      if (avatarFile) {
        const up = new FormData()
        up.append('file', avatarFile)
        const uploadRes = await uploadNewsImage(up)
        const fileId = uploadRes.data?.id
        if (!fileId) { toast(t('profilePage.avatarUploadError'), 'error'); setSaving(false); return }
        nextAvatarUrl = buildFileContentUrl(fileId)
      } else if (removeAvatar) {
        nextAvatarUrl = null
      }
      await updateUser(userId, {
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        email,
      })
      setStoredAvatarUrl(userId, nextAvatarUrl)
      await loadProfile()
      toast(t('profilePage.saveSuccess'), 'success')
      navigate('/profile')
    } catch (err) {
      toast(resolveApiError(err, t, 'profilePage.saveError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page profile-page-academis secondary-page-loading">
        <Spinner size={28} /><span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (error || !userInfo) {
    return (
      <div className="page profile-page-academis">
        <div className="secondary-flash secondary-flash--error">{error || t('profilePage.loadError')}</div>
        <Link to="/profile" className="btn btn-outline" style={{ marginTop: 12 }}>{t('profilePage.backToProfile')}</Link>
      </div>
    )
  }

  const canEdit = Boolean(userInfo.userId || auth.tokenParsed?.sub)
  const hasAvatar = Boolean(avatarPreview || userInfo.avatarUrl)

  return (
    <div className="page profile-page-academis">
      <PageHeader
        title={t('profilePage.editTitle')}
        subtitle={t('profilePage.editSubtitle')}
        back="/profile"
      />

      <form className="pe-layout" onSubmit={handleSubmit}>

        {/* ══ LEFT COLUMN ══════════════════════════════ */}
        <div className="pe-main col gap16">

          {/* Avatar */}
          <SectionCard title={t('profilePage.avatarSection')} icon="user" pad={false}>
            <div className="pe-avatar-block">
              <div className="pe-avatar-left">
                <ProfileAvatar
                  avatarUrl={avatarPreview}
                  initials={initials}
                  size="profile-lg"
                  alt={userInfo.fullName}
                />
              </div>
              <div className="pe-avatar-right col gap10">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                <button
                  type="button"
                  className="pe-upload-zone"
                  onClick={handlePickAvatar}
                  disabled={saving || !canEdit}
                >
                  <span className="pe-upload-ic" aria-hidden><Icon name="upload" size={18} /></span>
                  <span className="pe-upload-text">
                    <strong>{t('profilePage.changeAvatar')}</strong>
                    <span>{t('profilePage.avatarHint')}</span>
                  </span>
                </button>
                {hasAvatar && (
                  <button type="button" className="btn btn-ghost btn-sm pe-remove-btn" onClick={handleRemoveAvatar} disabled={saving}>
                    <Icon name="trash" size={14} />{t('profilePage.removeAvatar')}
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Personal info */}
          <SectionCard title={t('profilePage.personalInfo')} icon="settings" pad={false}>
            <div className="pe-fields">
              <div className="pe-fields-grid">
                <div className="field">
                  <label className="label" htmlFor="pe-first">{t('profilePage.firstName')}</label>
                  <input id="pe-first" className="input" type="text" value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                    disabled={saving} autoComplete="given-name" placeholder="Иван" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="pe-last">{t('profilePage.lastName')}</label>
                  <input id="pe-last" className="input" type="text" value={form.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                    disabled={saving} autoComplete="family-name" placeholder="Иванов" />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="pe-email">{t('profilePage.email')}</label>
                <input
                  id="pe-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  disabled={saving}
                  autoComplete="email"
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="field">
                <label className="label">{t('profilePage.username')}</label>
                <input
                  className="input pe-input-readonly"
                  type="text"
                  value={`@${userInfo.username}`}
                  disabled
                  readOnly
                />
                <p className="pe-field-hint">{t('profilePage.usernameReadonly')}</p>
              </div>
            </div>
          </SectionCard>

          {/* Footer */}
          <div className="pe-foot">
            <Link to="/profile" className="btn btn-ghost">{t('common.cancel')}</Link>
            <button type="submit" className="btn btn-primary" disabled={saving || !canEdit}>
              {saving ? <><Spinner size={14} />{t('profilePage.saving')}</> : t('common.save')}
            </button>
          </div>
        </div>

        {/* ══ RIGHT SIDEBAR ════════════════════════════ */}
        <aside className="pe-sidebar col gap16">

          {/* Account details */}
          <div className="card pe-info-card">
            <div className="pe-info-head">
              <span className="pe-info-icon" aria-hidden><Icon name="lock" size={15} /></span>
              <span className="h3">{t('profilePage.account')}</span>
            </div>

            <div className="pe-info-rows">
              <div className="pe-info-row">
                <span className="pe-info-label"><Icon name="user" size={14} />{t('profilePage.username')}</span>
                <span className="pe-info-val mono">@{userInfo.username}</span>
              </div>
              {userInfo.userId && (
                <div className="pe-info-row">
                  <span className="pe-info-label"><Icon name="layers" size={14} />ID</span>
                  <span className="pe-info-val mono pe-info-id">{userInfo.userId.slice(0, 8)}…</span>
                </div>
              )}
              <div className="pe-info-row">
                <span className="pe-info-label"><Icon name="check" size={14} />{t('profilePage.account')}</span>
                <span className={`pe-status-dot ${userInfo.accountEnabled ? 'pe-status-dot--on' : 'pe-status-dot--off'}`}>
                  {userInfo.accountEnabled ? t('common.active') : t('common.disabled')}
                </span>
              </div>
              <div className="pe-info-row">
                <span className="pe-info-label"><Icon name="mail" size={14} />Email</span>
                <span className={`pe-status-dot ${userInfo.emailVerified ? 'pe-status-dot--on' : 'pe-status-dot--warn'}`}>
                  {userInfo.emailVerified ? t('common.verified') : t('common.notVerified')}
                </span>
              </div>
            </div>
          </div>

          {/* Roles */}
          {roles.length > 0 && (
            <div className="card pe-info-card">
              <div className="pe-info-head">
                <span className="pe-info-icon" aria-hidden><Icon name="award" size={15} /></span>
                <span className="h3">{t('profilePage.roles')}</span>
              </div>
              <div className="pe-roles-list">
                {roles.map((role) => {
                  const m = ROLE_META[role] || { label: role, icon: 'user', color: 'var(--text-3)' }
                  return (
                    <div key={role} className="pe-role-row">
                      <span className="pe-role-ic" style={{ '--rc': m.color }} aria-hidden>
                        <Icon name={m.icon} size={14} />
                      </span>
                      <span className="pe-role-label">{m.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="card pe-tip-card">
            <span className="pe-tip-ic" aria-hidden><Icon name="info" size={15} /></span>
            <p className="pe-tip-text">{t('profilePage.usernameReadonly')}</p>
          </div>

        </aside>
      </form>
    </div>
  )
}

export default ProfileEdit
