import React, { useState, useEffect, useMemo } from 'react'
import { getRoles, isAdmin, isTeacher, isClient } from '../utils/roles'
import api from '../services/api'
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
    const [userInfo, setUserInfo] = useState(null)
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false

        const fromToken = () => {
            if (!window.keycloak?.tokenParsed) return null
            const token = window.keycloak.tokenParsed
            const userRoles = getRoles(window.keycloak)
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
            const username = data.username || window.keycloak?.tokenParsed?.preferred_username || '—'
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

        const load = async () => {
            setError(null)
            try {
                const { data } = await api.get('/auth/user')
                if (!cancelled) {
                    applyUserPayload(data, getRoles(window.keycloak))
                    setLoading(false)
                }
            } catch {
                const fallback = fromToken()
                if (!cancelled) {
                    if (fallback) {
                        setUserInfo({
                            ...fallback,
                            firstName: fallback.firstName === 'N/A' ? '—' : fallback.firstName,
                            lastName: fallback.lastName === 'N/A' ? '—' : fallback.lastName,
                            fullName:
                                fallback.fullName === 'N/A'
                                    ? buildFullName(
                                          fallback.firstName === 'N/A' ? null : fallback.firstName,
                                          fallback.lastName === 'N/A' ? null : fallback.lastName,
                                          fallback.username
                                      )
                                    : fallback.fullName,
                        })
                        setRoles(getRoles(window.keycloak))
                    } else {
                        setError('Unable to load profile')
                    }
                    setLoading(false)
                }
            }
        }

        if (window.keycloak?.token) {
            load()
        } else {
            const fallback = fromToken()
            if (fallback) {
                setUserInfo({
                    ...fallback,
                    firstName: fallback.firstName === 'N/A' ? '—' : fallback.firstName,
                    lastName: fallback.lastName === 'N/A' ? '—' : fallback.lastName,
                })
                setRoles(getRoles(window.keycloak))
            }
            setLoading(false)
        }

        return () => {
            cancelled = true
        }
    }, [])

    const roleConfig = useMemo(
        () => ({
            admin: { label: 'Administrator' },
            teacher: { label: 'Teacher' },
            client: { label: 'Student' },
            ROLE_ADMIN: { label: 'Administrator' },
            ROLE_TEACHER: { label: 'Teacher' },
            ROLE_CLIENT: { label: 'Student' },
        }),
        []
    )

    const getRoleDescription = () => {
        if (isAdmin(window.keycloak)) return 'Full access to platform administration and user management.'
        if (isTeacher(window.keycloak)) return 'Course authoring, materials, and student progress.'
        if (isClient(window.keycloak)) return 'Course access, materials, and learning progress.'
        return 'No role assigned. Contact an administrator if you need access.'
    }

    const initials = userInfo
        ? buildInitials(userInfo.firstName, userInfo.lastName, userInfo.username)
        : ''

    if (loading) {
        return (
            <div className="profile-page profile-page--formal">
                <div className="profile-state">Loading…</div>
            </div>
        )
    }
    if (error || !userInfo) {
        return (
            <div className="profile-page profile-page--formal">
                <div className="profile-state error">{error || 'Unable to load profile'}</div>
            </div>
        )
    }

    return (
        <div className="profile-page profile-page--formal">
            <div className="profile-inner">
                <header className="profile-doc-header">
                    <h1 className="profile-doc-title">User profile</h1>
                    <p className="profile-doc-subtitle">Account details on the learning platform</p>
                </header>

                <section className="profile-card profile-card--hero" aria-labelledby="profile-identity">
                    <div className="profile-avatar" aria-hidden="true">
                        {initials}
                    </div>
                    <div className="profile-identity" id="profile-identity">
                        <h2 className="profile-display-name">{userInfo.fullName}</h2>
                        <p className="profile-meta-line">
                            <span className="profile-label-inline">Username</span>
                            <span className="profile-value-inline">@{userInfo.username}</span>
                        </p>
                        {userInfo.userId && (
                            <p className="profile-meta-line profile-meta-line--muted">
                                <span className="profile-label-inline">User ID</span>
                                <span className="profile-value-inline profile-value-mono">{userInfo.userId}</span>
                            </p>
                        )}
                    </div>
                </section>

                <div className="profile-grid">
                    <section className="profile-card" aria-labelledby="personal-heading">
                        <h2 id="personal-heading" className="profile-section-title">
                            Personal information
                        </h2>
                        <dl className="profile-dl">
                            <div className="profile-dl-row">
                                <dt>First name</dt>
                                <dd>{userInfo.firstName}</dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>Last name</dt>
                                <dd>{userInfo.lastName}</dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>Username</dt>
                                <dd>@{userInfo.username}</dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>Email</dt>
                                <dd className="profile-dd-with-badge">
                                    <span>{userInfo.email}</span>
                                    {userInfo.emailVerified && (
                                        <span className="profile-badge profile-badge--ok" title="Verified">
                                            Verified
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="profile-card" aria-labelledby="status-heading">
                        <h2 id="status-heading" className="profile-section-title">
                            Account status
                        </h2>
                        <dl className="profile-dl profile-dl--status">
                            <div className="profile-dl-row">
                                <dt>Account</dt>
                                <dd>
                                    <span
                                        className={`profile-badge ${userInfo.accountEnabled ? 'profile-badge--ok' : 'profile-badge--warn'}`}
                                    >
                                        {userInfo.accountEnabled ? 'Active' : 'Disabled'}
                                    </span>
                                </dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>Email</dt>
                                <dd>
                                    <span
                                        className={`profile-badge ${userInfo.emailVerified ? 'profile-badge--ok' : 'profile-badge--pending'}`}
                                    >
                                        {userInfo.emailVerified ? 'Verified' : 'Not verified'}
                                    </span>
                                </dd>
                            </div>
                            <div className="profile-dl-row">
                                <dt>Authentication</dt>
                                <dd>
                                    <span className="profile-badge profile-badge--neutral">Platform (JWT)</span>
                                </dd>
                            </div>
                            <div className="profile-dl-row profile-dl-row--roles">
                                <dt>Roles</dt>
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
                                        <span className="profile-empty-note">No role assigned</span>
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
