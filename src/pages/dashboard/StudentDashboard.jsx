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
import auth from '@/shared/config/auth'
import HomeNewsFeed from './HomeNewsFeed'
import { StudentStatsCharts } from './StatsCharts'
import { useTranslation } from 'react-i18next'
import useStudentDashboardData from './hooks/useStudentDashboardData'
import StatCard from './components/StatCard'
import DeadlineCard from './components/DeadlineCard'
import './Dashboard.css'

const StudentDashboard = ({ view = 'home' }) => {
    const { t } = useTranslation()
    const { stats, upcomingDeadlines, loading } = useStudentDashboardData()
    const [userName, setUserName] = useState('')

    useEffect(() => {
        if (auth && auth.tokenParsed) {
            setUserName(
                auth.tokenParsed.preferred_username || auth.tokenParsed.given_name || 'Student'
            )
        }
    }, [])

    const statsBlock = (
        <div className="dashboard-stats" id="dashboard-stats">
            <StatCard
                icon={<FiBook />}
                tone="primary"
                value={stats.enrolledCourses}
                label={t('dashboard.myCourses')}
            />
            <StatCard
                icon={<FiCheckCircle />}
                tone="success"
                value={stats.completedLessons}
                label={t('dashboard.completedLessons')}
            />
            <StatCard
                icon={<FiClipboard />}
                tone="info"
                value={stats.testAttempts}
                label={t('dashboard.testAttempts')}
            />
            <StatCard
                icon={<FiTrendingUp />}
                tone="warning"
                value={stats.catalogCourses}
                label={t('dashboard.catalogCourses')}
            />
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
                            <DeadlineCard
                                key={`${d.courseId}-${d.testId}-${d.dueAt}`}
                                deadline={d}
                            />
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
