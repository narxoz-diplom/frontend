import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiBook, 
  FiFolder, 
  FiBell, 
  FiUser, 
  FiArrowRight,
  FiTrendingUp,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi'
import api from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedLessons: 0,
    activeCourses: 0
  })
  const [recentCourses, setRecentCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadDashboardData()
    if (window.keycloak && window.keycloak.tokenParsed) {
      const token = window.keycloak.tokenParsed
      setUserName(token.preferred_username || token.name || 'User')
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Загружаем все курсы
      const coursesResponse = await api.get('/courses')
      const allCourses = coursesResponse.data || []
      
      // Загружаем записанные курсы
      let enrolledCourses = []
      try {
        const enrolledResponse = await api.get('/courses/enrolled')
        enrolledCourses = enrolledResponse.data || []
      } catch (err) {
        console.log('No enrolled courses or error:', err)
      }
      
      // Подсчитываем статистику
      const enrolledIds = new Set(enrolledCourses.map(c => c.id))
      const totalCourses = allCourses.length
      const enrolledCount = enrolledCourses.length
      
      // Подсчитываем завершенные уроки из localStorage
      let completedLessons = 0
      if (typeof Storage !== 'undefined') {
        const progressData = localStorage.getItem('videoProgress')
        if (progressData) {
          try {
            const progress = JSON.parse(progressData)
            completedLessons = Object.values(progress).filter(p => p.completed).length
          } catch (e) {
            console.error('Error parsing progress data:', e)
          }
        }
      }
      
      setStats({
        totalCourses,
        enrolledCourses: enrolledCount,
        completedLessons,
        activeCourses: enrolledCount
      })
      
      // Берем последние 3 записанных курса
      setRecentCourses(enrolledCourses.slice(0, 3))
      
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            {getGreeting()}, {userName.split(' ')[0]}! 👋
          </h1>
          <p className="hero-subtitle">
            Ready to continue your learning journey?
          </p>
        </div>
        <div className="hero-illustration">
          <div className="illustration-circle"></div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <FiBook />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.enrolledCourses}</h3>
            <p className="stat-label">Enrolled Courses</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.completedLessons}</h3>
            <p className="stat-label">Completed Lessons</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <FiClock />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.activeCourses}</h3>
            <p className="stat-label">Active Courses</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalCourses}</h3>
            <p className="stat-label">Total Courses</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="dashboard-grid">
          <Link to="/courses" className="dashboard-card courses-card">
            <div className="card-icon-wrapper">
              <div className="card-icon">
                <FiBook />
              </div>
            </div>
            <div className="card-content">
              <h2>Courses</h2>
              <p>Browse and enroll in courses</p>
            </div>
            <div className="card-arrow">
              <FiArrowRight />
            </div>
          </Link>
          
          <Link to="/files" className="dashboard-card files-card">
            <div className="card-icon-wrapper">
              <div className="card-icon">
                <FiFolder />
              </div>
            </div>
            <div className="card-content">
              <h2>File Management</h2>
              <p>View and manage your files</p>
            </div>
            <div className="card-arrow">
              <FiArrowRight />
            </div>
          </Link>
          
          <Link to="/notifications" className="dashboard-card notifications-card">
            <div className="card-icon-wrapper">
              <div className="card-icon">
                <FiBell />
              </div>
            </div>
            <div className="card-content">
              <h2>Notifications</h2>
              <p>View your notifications and updates</p>
            </div>
            <div className="card-arrow">
              <FiArrowRight />
            </div>
          </Link>
          
          <Link to="/profile" className="dashboard-card profile-card">
            <div className="card-icon-wrapper">
              <div className="card-icon">
                <FiUser />
              </div>
            </div>
            <div className="card-content">
              <h2>Profile</h2>
              <p>View and manage your profile</p>
            </div>
            <div className="card-arrow">
              <FiArrowRight />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Courses */}
      {recentCourses.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Continue Learning</h2>
            <Link to="/courses" className="section-link">
              View all <FiArrowRight />
            </Link>
          </div>
          <div className="recent-courses">
            {recentCourses.map((course) => (
              <Link 
                key={course.id} 
                to={`/courses/${course.id}`} 
                className="recent-course-card"
              >
                {course.imageUrl && (
                  <div className="recent-course-image">
                    <img src={course.imageUrl} alt={course.title} />
                  </div>
                )}
                <div className="recent-course-content">
                  <h3>{course.title}</h3>
                  <p className="recent-course-description">
                    {course.description || 'No description available'}
                  </p>
                  <div className="recent-course-meta">
                    <span className="course-status-badge">{course.status}</span>
                    {course.lessons && (
                      <span className="course-lessons-count">
                        {course.lessons.length} lessons
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
