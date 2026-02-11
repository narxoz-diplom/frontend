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
  FiBookOpen,
  FiLayers
} from 'react-icons/fi'
import auth from './config/auth'
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
import RAG from './components/RAG'
import { getRoles } from './utils/roles'
import './index.css'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRoles, setUserRoles] = useState([])

  useEffect(() => {
    auth.initSafe().then((isAuth) => {
      setAuthenticated(isAuth)
      setLoading(false)
      if (isAuth) {
        setUserRoles(getRoles(auth))
      }
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
              <Route path="/rag" element={<RAG />} />
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
    const kc = window.keycloak || auth
    if (kc && kc.tokenParsed) {
      setUserName(kc.tokenParsed.preferred_username || kc.tokenParsed.name || 'User')
    }
  }, [])

  useEffect(() => {
    // Закрываем мобильное меню при изменении маршрута
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    const kc = window.keycloak || auth
    if (kc && typeof kc.logout === 'function') {
      kc.logout()
    } else {
      auth.logout()
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
          {(userRoles.includes('admin') || userRoles.includes('teacher') || userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_TEACHER')) && (
            <Link 
              to="/rag" 
              className={`nav-link ${isActive('/rag') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">
                <FiLayers />
              </span>
              <span>RAG / Модули</span>
            </Link>
          )}
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

