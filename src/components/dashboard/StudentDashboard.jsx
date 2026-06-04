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
import { StudentStatsCharts } from './StatsCharts'
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
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([])

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
            const [publishedRes, enrolledRes, attemptsRes, deadlinesRes] = await Promise.all([
                api.get('/courses/published'),
                api.get('/courses/enrolled'),
                api.get('/courses/my/test-attempts').catch(() => ({ data: [] })),
                api.get('/courses/my/upcoming-test-deadlines').catch(() => ({ data: [] })),
            ])
            const catalog = Array.isArray(publishedRes.data) ? publishedRes.data.length : 0
            const enrolled = Array.isArray(enrolledRes.data) ? enrolledRes.data.length : 0
            const attempts = Array.isArray(attemptsRes.data) ? attemptsRes.data.length : 0
            const deadlines = Array.isArray(deadlinesRes.data) ? deadlinesRes.data : []
            setStats({
                catalogCourses: catalog,
                enrolledCourses: enrolled,
                completedLessons: countCompletedLessonsFromStorage(),
                testAttempts: attempts,
            })
            setUpcomingDeadlines(deadlines)
        } catch (err) {
            console.error(err)
            setStats((s) => ({
                ...s,
                completedLessons: countCompletedLessonsFromStorage(),
            }))
            setUpcomingDeadlines([])
        } finally {
            setLoading(false)
        }
    }

    const formatDueAt = (iso) => {
        if (!iso) return '—'
        try {
            const d = new Date(iso)
            if (Number.isNaN(d.getTime())) return iso
            return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        } catch {
            return iso
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
                    <>
                        {statsBlock}
                        <StudentStatsCharts stats={stats} />
                    </>
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
                        <FiPlayCircle size={34} strokeWidth={1.75} aria-hidden />
                    </div>
                </div>
            </div>

            <HomeNewsFeed />

            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">{t('dashboard.upcomingDeadlinesTitle')}</h2>
                </div>
                {(upcomingDeadlines?.length ?? 0) === 0 ? (
                    <div className="dashboard-empty-hint">{t('dashboard.upcomingDeadlinesEmpty')}</div>
                ) : (
                    <div className="deadlines-list">
                        {upcomingDeadlines.slice(0, 5).map((d) => (
                            <Link
                                key={`${d.courseId}-${d.testId}-${d.dueAt}`}
                                to={`/courses/${d.courseId}/tests/${d.testId}`}
                                className="deadline-card"
                            >
                                <div className="deadline-card__meta">
                                    <div className="deadline-card__course">
                                        <span className="deadline-card__label">{t('dashboard.upcomingDeadlinesCourse')}</span>
                                        <span className="deadline-card__value">{d.courseTitle || `#${d.courseId}`}</span>
                                    </div>
                                    <div className="deadline-card__test">
                                        <span className="deadline-card__label">{t('dashboard.upcomingDeadlinesTest')}</span>
                                        <span className="deadline-card__value">{d.testTitle || `#${d.testId}`}</span>
                                    </div>
                                </div>
                                <div className="deadline-card__due">
                                    <span className="deadline-card__label">{t('dashboard.upcomingDeadlinesDue')}</span>
                                    <span className="deadline-card__dueValue">{formatDueAt(d.dueAt)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

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
