import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiTrendingUp,
    FiClock,
    FiCheckCircle,
    FiPlayCircle,
    FiArrowRight,
} from 'react-icons/fi'
import api from '../../services/api'
import HomeNewsFeed from './HomeNewsFeed'
import './Dashboard.css'

const StudentDashboard = ({ view = 'home' }) => {
    const [stats, setStats] = useState({
        totalCourses: 0,
        enrolledCourses: 0,
        completedLessons: 0,
        activeCourses: 0,
    })
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        loadDashboardData()
        const kc = window.keycloak
        if (kc && kc.tokenParsed) {
            setUserName(
                kc.tokenParsed.preferred_username || kc.tokenParsed.given_name || 'Student'
            )
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
            } catch (err) {
                console.error('Enrollment check failed', err)
            }

            setStats({
                totalCourses: allCourses.length,
                enrolledCourses: enrolledCount,
                completedLessons: 0,
                activeCourses: enrolledCount,
            })
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const statsBlock = (
        <div className="dashboard-stats" id="dashboard-stats">
            <div className="stat-card">
                <div className="stat-icon stat-icon-primary">
                    <FiBook />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{stats.enrolledCourses}</p>
                    <p className="stat-label">Мои курсы</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon stat-icon-success">
                    <FiCheckCircle />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{stats.completedLessons}</p>
                    <p className="stat-label">Завершено уроков</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon stat-icon-info">
                    <FiClock />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{stats.activeCourses}</p>
                    <p className="stat-label">В процессе</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon stat-icon-warning">
                    <FiTrendingUp />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{stats.totalCourses}</p>
                    <p className="stat-label">Всего в каталоге</p>
                </div>
            </div>
        </div>
    )

    if (view === 'stats') {
        return (
            <div className="dashboard dashboard--stats-only">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Статистика</h1>
                    <p className="dashboard-page-desc">
                        Ваши обучающие показатели и доступные курсы
                    </p>
                </div>
                {loading ? (
                    <div className="dashboard-loading-inline">Загрузка…</div>
                ) : (
                    statsBlock
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading">Загрузка…</div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome back, {userName.split(' ')[0]}</h1>
                    <p className="hero-subtitle">
                        У вас {stats.activeCourses} активных курсов. Ниже — новости платформы и быстрые
                        действия. Детальная статистика — в разделе «Статистика».
                    </p>
                </div>
                <div className="hero-illustration">
                    <div className="illustration-circle">
                        <FiPlayCircle size={60} color="white" />
                    </div>
                </div>
            </div>

            <HomeNewsFeed />

            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Быстрые действия</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/courses" className="dashboard-card">
                        К каталогу курсов <FiArrowRight />
                    </Link>
                    <Link to="/files" className="dashboard-card">
                        Мои файлы <FiArrowRight />
                    </Link>
                    <Link to="/stats" className="dashboard-card">
                        Сводная статистика <FiArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default StudentDashboard
