import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiTrendingUp,
    FiClock,
    FiCheckCircle,
    FiPlayCircle,
    FiArrowRight
} from 'react-icons/fi'
import api from '../../services/api'
import './Dashboard.css'

const StudentDashboard = () => {
    const [stats, setStats] = useState({
        totalCourses: 0,
        enrolledCourses: 0,
        completedLessons: 0,
        activeCourses: 0
    })
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        loadDashboardData()
        // Проверка Keycloak или localStorage для имени
        const kc = window.keycloak
        if (kc && kc.tokenParsed) {
            setUserName(kc.tokenParsed.preferred_username || kc.tokenParsed.given_name || 'Student')
        }
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            const coursesResponse = await api.get('/courses')
            const allCourses = coursesResponse.data || []

            let enrolledCount = 0
            try {
                const enrolledResponse = await api.get('/courses/enrolled')
                enrolledCount = (enrolledResponse.data || []).length
            } catch (err) { console.error("Enrollment check failed", err) }

            setStats({
                totalCourses: allCourses.length,
                enrolledCourses: enrolledCount,
                completedLessons: 0,
                activeCourses: enrolledCount
            })
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="dashboard"><div className="loading">Загрузка...</div></div>
    }

    return (
        <div className="dashboard">
            {/* Hero Section */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome back, {userName.split(' ')[0]}! 👋</h1>
                    <p className="hero-subtitle">У вас {stats.activeCourses} активных курсов. Самое время продолжить обучение!</p>
                </div>
                <div className="hero-illustration">
                    <div className="illustration-circle">
                        <FiPlayCircle size={60} color="white" />
                    </div>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><FiBook /></div>
                    <div className="stat-content">
                        <p className="stat-value">{stats.enrolledCourses}</p>
                        <p className="stat-label">Мои курсы</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><FiCheckCircle /></div>
                    <div className="stat-content">
                        <p className="stat-value">{stats.completedLessons}</p>
                        <p className="stat-label">Завершено уроков</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-info"><FiClock /></div>
                    <div className="stat-content">
                        <p className="stat-value">{stats.activeCourses}</p>
                        <p className="stat-label">В процессе</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><FiTrendingUp /></div>
                    <div className="stat-content">
                        <p className="stat-value">{stats.totalCourses}</p>
                        <p className="stat-label">Всего доступно</p>
                    </div>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Быстрые действия</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/courses" className="dashboard-card">К каталогу курсов <FiArrowRight /></Link>
                    <Link to="/files" className="dashboard-card">Мои файлы <FiArrowRight /></Link>
                </div>
            </div>
        </div>
    )
}

export default StudentDashboard