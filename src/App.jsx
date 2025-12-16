import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiBook, 
  FiFolder, 
  FiBell, 
  FiUser, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiBookOpen
} from 'react-icons/fi'
import keycloak from './config/keycloak'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Files from './components/Files'
import Notifications from './components/Notifications'
import Courses from './components/Courses'
import CourseDetail from './components/CourseDetail'
import LessonDetail from './components/LessonDetail'
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
    
    // Проверяем, есть ли callback от Keycloak в URL (после редиректа после логина)
    const urlParams = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    const hasKeycloakCallback = urlParams.has('code') || urlParams.has('state') || 
                                hash.includes('access_token') || hash.includes('code=') || hash.includes('state=')
    
    // Используем безопасную инициализацию (не будет повторной инициализации)
    // Если есть callback от Keycloak, используем 'login-required' для обработки callback
    const initOptions = hasKeycloakCallback 
      ? { onLoad: 'login-required', checkLoginIframe: false }
      : { onLoad: 'check-sso', checkLoginIframe: false }
    
    keycloak.initSafe(initOptions)
      .then((auth) => {
        // Убеждаемся, что keycloak все еще в window
        if (typeof window !== 'undefined') {
          window.keycloak = keycloak
        }
        
        // Проверяем как результат инициализации, так и состояние keycloak
        const isAuth = auth || keycloak.authenticated
        
        // Если только что прошли аутентификацию через Keycloak callback, очищаем URL
        if (isAuth && hasKeycloakCallback) {
          // Очищаем hash или query параметры от Keycloak callback
          // Если мы на странице логина, перенаправляем на главную страницу
          const currentPath = window.location.pathname
          if (currentPath === '/login' || currentPath === '/register') {
            window.history.replaceState(null, '', '/')
          } else {
            // Оставляем текущий путь, очищая только hash и query параметры
            const cleanPath = currentPath || '/'
            window.history.replaceState(null, '', cleanPath)
          }
        }
        
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
              <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (window.keycloak && window.keycloak.tokenParsed) {
      const token = window.keycloak.tokenParsed
      setUserName(token.preferred_username || token.name || 'User')
    }
  }, [])

  useEffect(() => {
    // Закрываем мобильное меню при изменении маршрута
    setMobileMenuOpen(false)
  }, [location.pathname])

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

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <FiX /> : <FiMenu />}
      </button>
      
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
      />
      
      <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-brand">
          <Link to="/" className="brand-link" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-icon">
              <FiBookOpen />
            </span>
            <span className="brand-text">EduPlatform</span>
          </Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="nav-icon">
              <FiHome />
            </span>
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/courses" 
            className={`nav-link ${isActive('/courses') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="nav-icon">
              <FiBook />
            </span>
            <span>Courses</span>
          </Link>
          <Link 
            to="/files" 
            className={`nav-link ${isActive('/files') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="nav-icon">
              <FiFolder />
            </span>
            <span>Files</span>
          </Link>
          <Link 
            to="/notifications" 
            className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="nav-icon">
              <FiBell />
            </span>
            <span>Notifications</span>
          </Link>
        </div>

        <div className="nav-user">
          <Link 
            to="/profile" 
            className={`nav-link profile-link ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
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
            <FiLogOut />
          </button>
        </div>
      </nav>
    </>
  )
}

export default App

