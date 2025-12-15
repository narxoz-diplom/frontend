import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import keycloak from './config/keycloak'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Files from './components/Files'
import Notifications from './components/Notifications'
import Courses from './components/Courses'
import CourseDetail from './components/CourseDetail'
import VideoPlayer from './components/VideoPlayer'
import Profile from './components/Profile'
import { getRoles } from './utils/roles'
import './index.css'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRoles, setUserRoles] = useState([])

  useEffect(() => {
    // Всегда устанавливаем keycloak в window для глобального доступа
    if (typeof window !== 'undefined') {
      window.keycloak = keycloak
    }
    
    // Используем безопасную инициализацию (не будет повторной инициализации)
    keycloak.initSafe({ onLoad: 'check-sso', checkLoginIframe: false })
      .then((auth) => {
        // Убеждаемся, что keycloak все еще в window
        if (typeof window !== 'undefined') {
          window.keycloak = keycloak
        }
        
        // Проверяем как результат инициализации, так и состояние keycloak
        const isAuth = auth || keycloak.authenticated
        setAuthenticated(isAuth)
        setLoading(false)
        if (isAuth) {
          const roles = getRoles(keycloak)
          setUserRoles(roles)
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error)
        // Убеждаемся, что keycloak все еще в window даже при ошибке
        if (typeof window !== 'undefined') {
          window.keycloak = keycloak
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      {!authenticated ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="app-container">
          <Navigation userRoles={userRoles} />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/courses/:courseId/lessons/:lessonId/videos/:videoId" element={<VideoPlayer />} />
              <Route path="/files" element={<Files />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  )
}

// Navigation Component
const Navigation = ({ userRoles }) => {
  const location = useLocation()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (window.keycloak && window.keycloak.tokenParsed) {
      const token = window.keycloak.tokenParsed
      setUserName(token.preferred_username || token.name || 'User')
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Очищаем localStorage
      localStorage.removeItem('kc-access-token')
      localStorage.removeItem('kc-refresh-token')
      localStorage.removeItem('kc-id-token')
      localStorage.removeItem('kc-authenticated')
      
      // Получаем keycloak экземпляр
      const kc = window.keycloak || keycloak
      
      // Проверяем, что keycloak существует и инициализирован
      if (kc && kc.authenticated !== undefined) {
        // Если метод logout доступен, используем его
        if (typeof kc.logout === 'function') {
          try {
            await kc.logout()
          } catch (logoutError) {
            console.warn('Keycloak logout error:', logoutError)
            // В случае ошибки просто перенаправляем на логин
            window.location.href = '/login'
          }
        } else {
          // Если logout недоступен, просто перенаправляем
          window.location.href = '/login'
        }
      } else {
        // Если keycloak не инициализирован, просто перенаправляем
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // В любом случае перенаправляем на логин
      window.location.href = '/login'
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">📚</span>
          <span className="brand-text">EduPlatform</span>
        </Link>
      </div>
      
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          <span>Dashboard</span>
        </Link>
        <Link 
          to="/courses" 
          className={`nav-link ${isActive('/courses') ? 'active' : ''}`}
        >
          <span className="nav-icon">📖</span>
          <span>Courses</span>
        </Link>
        <Link 
          to="/files" 
          className={`nav-link ${isActive('/files') ? 'active' : ''}`}
        >
          <span className="nav-icon">📁</span>
          <span>Files</span>
        </Link>
        <Link 
          to="/notifications" 
          className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}
        >
          <span className="nav-icon">🔔</span>
          <span>Notifications</span>
        </Link>
      </div>

      <div className="nav-user">
        <Link 
          to="/profile" 
          className={`nav-link profile-link ${isActive('/profile') ? 'active' : ''}`}
        >
          <span className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="user-name">{userName}</span>
        </Link>
        <button 
          className="btn-logout" 
          onClick={handleLogout}
          title="Logout"
        >
          <span>🚪</span>
        </button>
      </div>
    </nav>
  )
}

export default App

