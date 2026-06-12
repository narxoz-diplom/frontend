import React, { useState, useEffect, useMemo } from 'react'
import auth from '@/shared/config/auth'
import { getRoles, isAdmin, isTeacher, isClient } from '@/shared/lib/roles'
import { getCurrentUser } from '@/shared/api/authApi'
import { useTranslation } from 'react-i18next'
import './Profile.css'

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
                    token.name ||
                    [token.given_name, token.family_name].filter(Boolean).join(' ').trim() ||
                    token.preferred_username ||
                    '—',
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
    }, [])

    const roleConfig = useMemo(
        () => ({
            admin: { label: t('profilePage.administrator') },
            teacher: { label: t('profilePage.teacher') },
            client: { label: t('profilePage.student') },
            ROLE_ADMIN: { label: t('profilePage.administrator') },
            ROLE_TEACHER: { label: t('profilePage.teacher') },
            ROLE_CLIENT: { label: t('profilePage.student') },
        }),
        [t]
    )

    const getRoleDescription = () => {
        if (isAdmin(auth)) return t('profilePage.adminDesc')
        if (isTeacher(auth)) return t('profilePage.teacherDesc')
        if (isClient(auth)) return t('profilePage.studentDesc')
        return t('profilePage.noRoleDesc')
    }

    const initials = userInfo
        ? buildInitials(userInfo.firstName, userInfo.lastName, userInfo.username)
        : ''

    if (loading) {
        return (
            <div className="profile-page profile-page--formal">
                <div className="profile-state">{t('common.loading')}</div>
            </div>
        )
    }
    if (error || !userInfo) {
        return (
            <div className="profile-page profile-page--formal">
                <div className="profile-state error">{error || t('profilePage.loadError')}</div>
            </div>
        )
    }

    return (
        <div className="profile-page profile-page--formal">
            <div className="profile-inner">
                <header className="profile-doc-header">
                    <h1 className="profile-doc-title">{t('profilePage.title')}</h1>
                    <p className="profile-doc-subtitle">{t('profilePage.subtitle')}</p>
                </header>

                <section className="profile-card profile-card--hero" aria-labelledby="profile-identity">
                    <div className="profile-avatar" aria-hidden="true">
                        {initials}
                    </div>
                    <div className="profile-identity" id="profile-identity">
                        <h2 className="profile-display-name">{userInfo.fullName}</h2>
                        <p className="profile-meta-line">
                            <span className="profile-label-inline">{t('profilePage.username')}</span>
                            <span className="profile-value-inline">@{userInfo.username}</span>
                        </p>
                        {userInfo.userId && (
                            <p className="profile-meta-line profile-meta-line--muted">
                                <span className="profile-label-inline">{t('profilePage.userId')}</span>
                                <span className="profile-value-inline profile-value-mono">{userInfo.userId}</span>
                            </p>
                        )}
                    </div>
                </section>

                <div className="profile-grid">
                    <section className="profile-card" aria-labelledby="personal-heading">
                        <h2 id="personal-heading" className="profile-section-title">
                            {t('profilePage.personalInfo')}
                        </h2>
                        <dl className="profile-dl">
                            <div className="profile-dl-row">
                                <dt>{t('profilePage.firstName')}</dt>
                                <dd>{userInfo.firstName}</dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>{t('profilePage.lastName')}</dt>
                                <dd>{userInfo.lastName}</dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>{t('profilePage.username')}</dt>
                                <dd>@{userInfo.username}</dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>{t('profilePage.email')}</dt>
                                <dd className="profile-dd-with-badge">
                                    <span>{userInfo.email}</span>
                                    {userInfo.emailVerified && (
                                        <span className="profile-badge profile-badge--ok" title={t('common.verified')}>
                                            {t('common.verified')}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="profile-card" aria-labelledby="status-heading">
                        <h2 id="status-heading" className="profile-section-title">
                            {t('profilePage.accountStatus')}
                        </h2>
                        <dl className="profile-dl profile-dl--status">
                            <div className="profile-dl-row">
                                <dt>{t('profilePage.account')}</dt>
                                <dd>
                                    <span
                                        className={`profile-badge ${userInfo.accountEnabled ? 'profile-badge--ok' : 'profile-badge--warn'}`}
                                    >
                                        {userInfo.accountEnabled ? t('common.active') : t('common.disabled')}
                                    </span>
                                </dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>{t('profilePage.email')}</dt>
                                <dd>
                                    <span
                                        className={`profile-badge ${userInfo.emailVerified ? 'profile-badge--ok' : 'profile-badge--pending'}`}
                                    >
                                        {userInfo.emailVerified ? t('common.verified') : t('common.notVerified')}
                                    </span>
                                </dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>{t('profilePage.auth')}</dt>
                                <dd>
                                    <span className="profile-badge profile-badge--neutral">{t('profilePage.platformJwt')}</span>
                                </dd>
                            </div>
                            <div className="profile-dl-row profile-dl-row--roles">
                                <dt>{t('profilePage.roles')}</dt>
                                <dd>
                                    {roles.length > 0 ? (
                                        <ul className="profile-role-list">
                                            {roles.map((role) => (
                                                <li key={role}>
                                                    <span className="profile-role-pill">
                                                        {roleConfig[role]?.label || role}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="profile-empty-note">{t('profilePage.noRole')}</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <p className="profile-role-desc">{getRoleDescription()}</p>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default Profile
