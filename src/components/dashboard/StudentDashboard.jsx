import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiTrendingUp,
    FiCheckCircle,
    FiPlayCircle,
    FiArrowRight,
    FiClipboard,
} from 'react-icons/fi'
import api from '../../services/api'
import auth from '../../config/auth'
import HomeNewsFeed from './HomeNewsFeed'
import { useTranslation } from 'react-i18next'
import './Dashboard.css'

const StudentDashboard = ({ view = 'home' }) => {
    const { t } = useTranslation()
    const [stats, setStats] = useState({
        catalogCourses: 0,
        enrolledCourses: 0,
        completedLessons: 0,
        testAttempts: 0,
    })
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        loadDashboardData()
        const kc = window.keycloak || auth
        if (kc && kc.tokenParsed) {
            setUserName(
                kc.tokenParsed.preferred_username || kc.tokenParsed.given_name || 'Student'
            )
        }
    }, [])

    const countCompletedLessonsFromStorage = () => {
        if (typeof Storage === 'undefined') return 0
        try {
            const raw = localStorage.getItem('videoProgress')
            if (!raw) return 0
            const progress = JSON.parse(raw)
            return Object.values(progress).filter((p) => p && p.completed).length
        } catch {
            return 0
        }
    }

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            const [publishedRes, enrolledRes, attemptsRes] = await Promise.all([
                api.get('/courses/published'),
                api.get('/courses/enrolled'),
                api.get('/courses/my/test-attempts').catch(() => ({ data: [] })),
            ])
            const catalog = Array.isArray(publishedRes.data) ? publishedRes.data.length : 0
            const enrolled = Array.isArray(enrolledRes.data) ? enrolledRes.data.length : 0
            const attempts = Array.isArray(attemptsRes.data) ? attemptsRes.data.length : 0
            setStats({
                catalogCourses: catalog,
                enrolledCourses: enrolled,
                completedLessons: countCompletedLessonsFromStorage(),
                testAttempts: attempts,
            })
        } catch (err) {
            console.error(err)
            setStats((s) => ({
                ...s,
                completedLessons: countCompletedLessonsFromStorage(),
            }))
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
                    <p className="stat-label">{t('dashboard.myCourses')}</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon stat-icon-success">
                    <FiCheckCircle />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{stats.completedLessons}</p>
                    <p className="stat-label">{t('dashboard.completedLessons')}</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon stat-icon-info">
                    <FiClipboard />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{stats.testAttempts}</p>
                    <p className="stat-label">{t('dashboard.testAttempts')}</p>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon stat-icon-warning">
                    <FiTrendingUp />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{stats.catalogCourses}</p>
                    <p className="stat-label">{t('dashboard.catalogCourses')}</p>
                </div>
            </div>
        </div>
    )

    if (view === 'stats') {
        return (
            <div className="dashboard dashboard--stats-only">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">{t('dashboard.statsTitle')}</h1>
                    <p className="dashboard-page-desc">
                        {t('dashboard.studentStatsDesc')}
                    </p>
                </div>
                {loading ? (
                    <div className="dashboard-loading-inline">{t('common.loading')}</div>
                ) : (
                    statsBlock
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading">{t('common.loading')}</div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{t('dashboard.welcomeBack', { name: userName.split(' ')[0] })}</h1>
                    <p className="hero-subtitle">
                        {t('dashboard.studentSubtitle', { count: stats.enrolledCourses })}
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
                    <h2 className="section-title">{t('dashboard.quickActions')}</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/courses" className="dashboard-card">
                        {t('dashboard.toCatalog')} <FiArrowRight />
                    </Link>
                    <Link to="/files" className="dashboard-card">
                        {t('dashboard.myFiles')} <FiArrowRight />
                    </Link>
                    <Link to="/stats" className="dashboard-card">
                        {t('dashboard.summaryStats')} <FiArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default StudentDashboard
