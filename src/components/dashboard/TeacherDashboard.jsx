import React from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiUsers,
    FiEdit,
    FiBarChart2,
    FiArrowRight,
    FiBookOpen
} from 'react-icons/fi'
import './Dashboard.css'

const TeacherDashboard = () => {
    return (
        <div className="dashboard">
            {/* Hero Section */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Панель преподавателя 👨‍🏫</h1>
                    <p className="hero-subtitle">Создавайте контент, управляйте доступом и следите за успехами студентов в реальном времени.</p>
                </div>
                <div className="hero-illustration">
                    <div className="illustration-circle">
                        <FiBookOpen size={60} color="white" />
                    </div>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><FiBook /></div>
                    <div className="stat-content">
                        <p className="stat-value">12</p>
                        <p className="stat-label">Мои курсы</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><FiUsers /></div>
                    <div className="stat-content">
                        <p className="stat-value">148</p>
                        <p className="stat-label">Студентов</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><FiEdit /></div>
                    <div className="stat-content">
                        <p className="stat-value">5</p>
                        <p className="stat-label">На проверке</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-info"><FiBarChart2 /></div>
                    <div className="stat-content">
                        <p className="stat-value">84%</p>
                        <p className="stat-label">Средний прогресс</p>
                    </div>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Управление</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/courses" className="dashboard-card">
                        Управление курсами <FiArrowRight />
                    </Link>

                    <Link to="/files" className="dashboard-card">
                        Учебные материалы <FiArrowRight />
                    </Link>

                    <Link to="/notifications" className="dashboard-card">
                        Объявления <FiArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default TeacherDashboard