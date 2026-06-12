import React from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiUsers,
    FiUser,
    FiBarChart2,
    FiArrowRight,
    FiLayers,
    FiFileText,
    FiArchive,
    FiCheckCircle,
    FiEdit3,
    FiFolder,
    FiCpu,
} from 'react-icons/fi'
import HomeNewsFeed from './HomeNewsFeed'
import { AdminStatsCharts } from './StatsCharts'
import useAdminDashboardData from './hooks/useAdminDashboardData'
import StatCard from './components/StatCard'
import './Dashboard.css'

const AdminDashboard = ({ view = 'home' }) => {
    const { platform: p, filesCount, newsCount, loading } = useAdminDashboardData()

    const statItems = [
        { icon: <FiBook />, tone: 'primary', value: p.totalCourses, label: 'Курсов всего' },
        { icon: <FiCheckCircle />, tone: 'success', value: p.publishedCourses, label: 'Опубликовано' },
        { icon: <FiLayers />, tone: 'warning', value: p.draftCourses, label: 'Черновики' },
        { icon: <FiArchive />, tone: 'info', value: p.archivedCourses, label: 'В архиве' },
        { icon: <FiFileText />, tone: 'primary', value: p.totalLessons, label: 'Уроков в системе' },
        { icon: <FiBarChart2 />, tone: 'success', value: p.totalTests, label: 'Тестов' },
        { icon: <FiUsers />, tone: 'warning', value: p.totalEnrollmentSlots, label: 'Записей студентов' },
        { icon: <FiUser />, tone: 'info', value: p.uniqueInstructors, label: 'Преподавателей' },
        { icon: <FiFolder />, tone: 'primary', value: filesCount, label: 'Файлов на платформе' },
        { icon: <FiEdit3 />, tone: 'success', value: newsCount, label: 'Новостей' },
    ]

    const statsBlock = (
        <>
            <div className="dashboard-stats dashboard-stats--admin" id="dashboard-stats">
                {statItems.map((item) => (
                    <StatCard
                        key={item.label}
                        icon={item.icon}
                        tone={item.tone}
                        value={item.value}
                        label={item.label}
                    />
                ))}
            </div>
            <p className="dashboard-admin-stats-note">
                «Записей студентов» — сумма подписок по всем курсам (один человек на двух курсах считается дважды).
            </p>
        </>
    )

    if (view === 'stats') {
        return (
            <div className="dashboard dashboard--stats-only">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Статистика платформы</h1>
                    <p className="dashboard-page-desc">
                        Сводка по курсам, контенту, записям и материалам — только для администратора
                    </p>
                </div>
                {loading ? (
                    <div className="dashboard-loading-inline">Загрузка…</div>
                ) : (
                    <>
                        {statsBlock}
                        <AdminStatsCharts platform={p} filesCount={filesCount} newsCount={newsCount} />
                    </>
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
                    <h1 className="hero-title">Панель администратора</h1>
                    <p className="hero-subtitle">
                        На платформе {p.totalCourses} курсов, {p.totalEnrollmentSlots} записей студентов. Полная
                        сводка — в разделе «Статистика».
                    </p>
                </div>
                <div className="hero-illustration">
                    <div className="illustration-circle">
                        <FiCpu size={34} strokeWidth={1.75} aria-hidden />
                    </div>
                </div>
            </div>

            <HomeNewsFeed />

            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Управление</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/admin/news" className="dashboard-card">
                        Новости (админ) <FiArrowRight />
                    </Link>
                    <Link to="/courses" className="dashboard-card">
                        Курсы <FiArrowRight />
                    </Link>
                    <Link to="/files" className="dashboard-card">
                        Файлы <FiArrowRight />
                    </Link>
                    <Link to="/stats" className="dashboard-card">
                        Сводная статистика <FiArrowRight />
                    </Link>
                    <Link to="/rag" className="dashboard-card">
                        Поиск (RAG) <FiArrowRight />
                    </Link>
                    <Link to="/notifications" className="dashboard-card">
                        Уведомления <FiArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
