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

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>
  }

  if (!userInfo) {
    return <div className="profile-error">Unable to load user information</div>
  }

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: '#e74c3c',
      teacher: '#3498db',
      client: '#27ae60'
    }
    return (
      <span 
        key={role} 
        className="role-badge"
        style={{ backgroundColor: roleColors[role] || '#95a5a6' }}
      >
        {role.toUpperCase()}
      </span>
    )
  }

  const getRoleDescription = () => {
    if (isAdmin(window.keycloak)) {
      return 'You have full access to all features including editing, deleting, and managing courses.'
    } else if (isTeacher(window.keycloak)) {
      return 'You can upload videos, create courses, and manage your own content.'
    } else if (isClient(window.keycloak)) {
      return 'You can view courses, enroll in courses, and track your progress.'
    }
    return 'Limited access. Please contact administrator for role assignment.'
  }

    return (
        <div className="profile-container">
            {/* ЛЕВАЯ КОЛОНКА: Стеклянный контейнер с аватаром */}
            <aside className="profile-sidebar-glass">
                <div className="profile-avatar">
                    {userInfo.firstName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-sidebar-info">
                    <h1>{userInfo.fullName}</h1>
                    <p className="profile-username">@{userInfo.username}</p>
                </div>
            </aside>

            {/* ПРАВАЯ КОЛОНКА */}
            <main className="profile-main-content">

                {/* ВЕРХНИЙ БЛОК: Личные данные */}
                <section className="user-info-card">
                    <h2>Personal Information</h2>
                    <div className="profile-info-grid">
                        <div className="profile-info-item">
                            <label>Full Name</label>
                            <p>{userInfo.fullName}</p>
                        </div>
                        <div className="profile-info-item">
                            <label>Email</label>
                            <p>
                                {userInfo.email}
                                {userInfo.emailVerified && <span className="verified-text"> ✓</span>}
                            </p>
                        </div>
                        <div className="profile-info-item">
                            <label>Username</label>
                            <p>{userInfo.username}</p>
                        </div>
                    </div>
                </section>

                {/* НИЖНИЙ РЯД: Роли и Статистика */}
                <div className="bottom-row">
                    {/* РОЛИ */}
                    <section className="role-card">
                        <h2>Role</h2>
                        <div className="profile-roles">
                            {roles.length > 0 ? (
                                roles.map(role => getRoleBadge(role))
                            ) : (
                                <p className="no-roles">No roles</p>
                            )}
                        </div>
                    </section>

                    {/* СТАТИСТИКА */}
                    <section className="stats-card">
                        <h2>Statistics</h2>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">-</span>
                                <span className="stat-label">Courses</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">-</span>
                                <span className="stat-label">Lessons</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">-</span>
                                <span className="stat-label">Files</span>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Profile

