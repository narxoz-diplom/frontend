import React, { useState, useEffect, useCallback } from 'react'
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
import api from '../../services/api'
import HomeNewsFeed from './HomeNewsFeed'
import './Dashboard.css'

const emptyPlatformStats = {
    totalCourses: 0,
    uniqueInstructors: 0,
    publishedCourses: 0,
    draftCourses: 0,
    archivedCourses: 0,
    totalLessons: 0,
    totalTests: 0,
    totalEnrollmentSlots: 0,
}

const AdminDashboard = ({ view = 'home' }) => {
    const [platform, setPlatform] = useState(null)
    const [filesCount, setFilesCount] = useState(0)
    const [newsCount, setNewsCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const loadStats = useCallback(async () => {
        try {
            setLoading(true)
            const [statsRes, filesRes, newsRes] = await Promise.all([
                api.get('/courses/admin/platform-stats'),
                api.get('/files').catch(() => ({ data: [] })),
                api.get('/news').catch(() => ({ data: [] })),
            ])
            setPlatform(statsRes.data || emptyPlatformStats)
            setFilesCount(Array.isArray(filesRes.data) ? filesRes.data.length : 0)
            setNewsCount(Array.isArray(newsRes.data) ? newsRes.data.length : 0)
        } catch {
            setPlatform(emptyPlatformStats)
            setFilesCount(0)
            setNewsCount(0)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    const p = platform || emptyPlatformStats

    const statsBlock = (
        <>
            <div className="dashboard-stats dashboard-stats--admin" id="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <FiBook />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.totalCourses}</p>
                        <p className="stat-label">Курсов всего</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.publishedCourses}</p>
                        <p className="stat-label">Опубликовано</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <FiLayers />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.draftCourses}</p>
                        <p className="stat-label">Черновики</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-info">
                        <FiArchive />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.archivedCourses}</p>
                        <p className="stat-label">В архиве</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <FiFileText />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.totalLessons}</p>
                        <p className="stat-label">Уроков в системе</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success">
                        <FiBarChart2 />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.totalTests}</p>
                        <p className="stat-label">Тестов</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.totalEnrollmentSlots}</p>
                        <p className="stat-label">Записей студентов</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-info">
                        <FiUser />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{p.uniqueInstructors}</p>
                        <p className="stat-label">Преподавателей</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <FiFolder />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{filesCount}</p>
                        <p className="stat-label">Файлов на платформе</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success">
                        <FiEdit3 />
                    </div>
                    <div className="stat-content">
                        <p className="stat-value">{newsCount}</p>
                        <p className="stat-label">Новостей</p>
                    </div>
                </div>
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
                {loading ? <div className="dashboard-loading-inline">Загрузка…</div> : statsBlock}
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
