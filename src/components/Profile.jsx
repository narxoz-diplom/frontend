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
      <div className="profile-header">
        <div className="profile-avatar">
          {userInfo.firstName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-header-info">
          <h1>{userInfo.fullName}</h1>
          <p className="profile-username">@{userInfo.username}</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-info-grid">
            <div className="profile-info-item">
              <label>First Name</label>
              <p>{userInfo.firstName}</p>
            </div>
            <div className="profile-info-item">
              <label>Last Name</label>
              <p>{userInfo.lastName}</p>
            </div>
            <div className="profile-info-item">
              <label>Email</label>
              <p>
                {userInfo.email}
                {userInfo.emailVerified && (
                  <span className="verified-badge">✓ Verified</span>
                )}
              </p>
            </div>
            <div className="profile-info-item">
              <label>Username</label>
              <p>{userInfo.username}</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Roles & Permissions</h2>
          <div className="profile-roles">
            {roles.length > 0 ? (
              <div className="roles-list">
                {roles.map(role => getRoleBadge(role))}
              </div>
            ) : (
              <p className="no-roles">No roles assigned</p>
            )}
          </div>
          <div className="role-description">
            <p>{getRoleDescription()}</p>
          </div>
        </div>

        <div className="profile-section">
          <h2>Account Statistics</h2>
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">-</div>
              <div className="stat-label">Courses Enrolled</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">-</div>
              <div className="stat-label">Lessons Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">-</div>
              <div className="stat-label">Files Uploaded</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

