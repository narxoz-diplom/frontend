import React from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to EduPlatform</h1>
        <p>Your learning journey starts here</p>
      </div>
      
      <div className="dashboard-grid">
        <Link to="/courses" className="dashboard-card courses-card">
          <div className="card-icon">📚</div>
          <h2>Courses</h2>
          <p>Browse and enroll in courses</p>
          <div className="card-arrow">→</div>
        </Link>
        
        <Link to="/files" className="dashboard-card files-card">
          <div className="card-icon">📁</div>
          <h2>File Management</h2>
          <p>View and manage your files</p>
          <div className="card-arrow">→</div>
        </Link>
        
        <Link to="/notifications" className="dashboard-card notifications-card">
          <div className="card-icon">🔔</div>
          <h2>Notifications</h2>
          <p>View your notifications and updates</p>
          <div className="card-arrow">→</div>
        </Link>
        
        <Link to="/profile" className="dashboard-card profile-card">
          <div className="card-icon">👤</div>
          <h2>Profile</h2>
          <p>View and manage your profile</p>
          <div className="card-arrow">→</div>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard


