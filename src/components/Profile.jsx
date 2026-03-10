import React, { useState, useEffect } from 'react'
import { getRoles, isAdmin, isTeacher, isClient } from '../utils/roles'
import './Profile.css'

const Profile = () => {
    const [userInfo, setUserInfo] = useState(null)
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (window.keycloak && window.keycloak.tokenParsed) {
            const token = window.keycloak.tokenParsed
            const userRoles = getRoles(window.keycloak)
            setUserInfo({
                username: token.preferred_username || token.sub,
                email: token.email || 'N/A',
                firstName: token.given_name || token.name?.split(' ')[0] || 'N/A',
                lastName: token.family_name || token.name?.split(' ')[1] || 'N/A',
                fullName: token.name || `${token.given_name || ''} ${token.family_name || ''}`.trim() || 'N/A',
                emailVerified: token.email_verified || false
            })
            setRoles(userRoles)
            setLoading(false)
        } else {
            setLoading(false)
        }
    }, [])

    if (loading) return <div className="profile-state">Loading...</div>
    if (!userInfo) return <div className="profile-state error">Unable to load profile</div>

    const roleConfig = {
        admin:   { label: 'Admin',   color: '#ff6b6b' },
        teacher: { label: 'Teacher', color: '#74b9ff' },
        client:  { label: 'Student', color: '#55efc4' },
    }

    const getRoleDescription = () => {
        if (isAdmin(window.keycloak))   return 'Full access to all platform features, user management, and system settings.'
        if (isTeacher(window.keycloak)) return 'Create and manage courses, upload materials, and track student progress.'
        if (isClient(window.keycloak))  return 'Browse and enroll in courses, access materials, and track your learning.'
        return 'No role assigned. Contact an administrator for access.'
    }

    const initials = `${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`.toUpperCase()

    return (
        <div className="profile-page">

            {/* Декоративные фоновые пятна */}
            <div className="glass-bg">
                <div className="glass-orb orb-1" />
                <div className="glass-orb orb-2" />
                <div className="glass-orb orb-3" />
            </div>

            <div className="profile-inner">

                {/* ── Верхняя карточка: аватар + имя ── */}
                <div className="glass-card glass-hero">
                    <div className="glass-avatar">
                        {initials}
                    </div>
                    <div className="glass-hero-info">
                        <h1 className="glass-name">{userInfo.fullName}</h1>
                        <span className="glass-username">@{userInfo.username}</span>
                {/*        <div className="glass-roles">*/}
                {/*            {roles.length > 0 ? roles.map(role => (*/}
                {/*                <span*/}
                {/*                    key={role}*/}
                {/*                    className="glass-role-pill"*/}
                {/*                    style={{ '--rc': roleConfig[role]?.color || '#fff' }}*/}
                {/*                >*/}
                {/*  {roleConfig[role]?.label || role}*/}
                {/*</span>*/}
                {/*            )) : (*/}
                {/*                <span className="glass-role-pill" style={{ '--rc': '#aaa' }}>No Role</span>*/}
                {/*            )}*/}
                {/*        </div>*/}
                    </div>

                    {/* Статистика */}
                    <div className="glass-stats">
                        <div className="glass-stat">
                            <span className="glass-stat-value">—</span>
                            <span className="glass-stat-label">Courses</span>
                        </div>
                        <div className="glass-stat-sep" />
                        <div className="glass-stat">
                            <span className="glass-stat-value">—</span>
                            <span className="glass-stat-label">Lessons</span>
                        </div>
                        <div className="glass-stat-sep" />
                        <div className="glass-stat">
                            <span className="glass-stat-value">—</span>
                            <span className="glass-stat-label">Files</span>
                        </div>
                    </div>
                </div>

                {/* ── Нижние карточки ── */}
                <div className="glass-grid">

                    {/* Personal Info */}
                    <div className="glass-card">
                        <h2 className="glass-card-title">Personal Information</h2>
                        <div className="glass-info-grid">
                            <div className="glass-info-item">
                                <label>First Name</label>
                                <p>{userInfo.firstName}</p>
                            </div>
                            <div className="glass-info-item">
                                <label>Last Name</label>
                                <p>{userInfo.lastName}</p>
                            </div>
                            <div className="glass-info-item">
                                <label>Username</label>
                                <p>@{userInfo.username}</p>
                            </div>
                            <div className="glass-info-item">
                                <label>Email</label>
                                <p>
                                    {userInfo.email}
                                    {userInfo.emailVerified && (
                                        <span className="glass-verified">✓</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="glass-card">
                        <h2 className="glass-card-title">Account Status</h2>
                        <div className="glass-status-list">
                            <div className="glass-status-row">
                                <span className="glass-status-label">Account</span>
                                <span className="glass-badge active">Active</span>
                            </div>
                            <div className="glass-status-row">
                                <span className="glass-status-label">Email</span>
                                <span className={`glass-badge ${userInfo.emailVerified ? 'active' : 'pending'}`}>
                  {userInfo.emailVerified ? 'Verified' : 'Not verified'}
                </span>
                            </div>
                            <div className="glass-status-row">
                                <span className="glass-status-label">Auth</span>
                                <span className="glass-badge active">Keycloak SSO</span>
                            </div>
                            <div className="glass-status-row">
                                <span className="glass-status-label">Role</span>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {roles.length > 0 ? roles.map(role => (
                                        <span
                                            key={role}
                                            className="glass-role-pill small"
                                            style={{ '--rc': roleConfig[role]?.color || '#fff' }}
                                        >
                      {roleConfig[role]?.label || role}
                    </span>
                                    )) : <span className="glass-no-role">No role</span>}
                                </div>
                            </div>
                        </div>
                        <p className="glass-role-desc">{getRoleDescription()}</p>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Profile