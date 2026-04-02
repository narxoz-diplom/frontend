import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiUsers,
    FiEdit,
    FiArrowRight,
    FiBookOpen,
    FiPlus,
    FiEye,
    FiFileText,
    FiCheckCircle,
    FiLayers,
} from 'react-icons/fi'
import api from '../../services/api'
import CreateCourseModal from '../CreateCourseModal'
import HomeNewsFeed from './HomeNewsFeed'
import './Dashboard.css'

const statusConfig = {
    PUBLISHED: { label: 'Опубликован', color: '#16a34a', bg: '#dcfce7' },
    DRAFT: { label: 'Черновик', color: '#d97706', bg: '#fef3c7' },
    ARCHIVED: { label: 'Архив', color: '#64748b', bg: '#f1f5f9' },
}

const TeacherDashboard = ({ view = 'home' }) => {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        loadTeacherCourses()
    }, [])

    const loadTeacherCourses = async () => {
        try {
            setLoading(true)
            const response = await api.get('/courses')
            setCourses(response.data || [])
        } catch (err) {
            console.error('Error loading courses:', err)
        } finally {
            setLoading(false)
        }
    }

    const totalLessons = useMemo(
        () => courses.reduce((sum, c) => sum + (Number(c.lessonsCount) || 0), 0),
        [courses]
    )

    const totalStudentEnrollments = useMemo(
        () =>
            courses.reduce((sum, c) => {
                const ids = c.enrolledStudents
                return sum + (Array.isArray(ids) ? ids.length : 0)
            }, 0),
        [courses]
    )

    const publishedCount = useMemo(
        () => courses.filter((c) => c.status === 'PUBLISHED').length,
        [courses]
    )

    const draftCount = useMemo(() => courses.filter((c) => c.status === 'DRAFT').length, [courses])

    const getStatusCfg = (status) =>
        statusConfig[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }

    const statsBlock = (
        <div className="dashboard-stats" id="dashboard-stats">
            <div className="stat-card">
                <div className="stat-icon stat-icon-primary">
                    <FiBook />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{courses.length}</p>
                    <p className="stat-label">Мои курсы</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-success">
                    <FiFileText />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{totalLessons || 0}</p>
                    <p className="stat-label">Уроков всего</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-warning">
                    <FiUsers />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{totalStudentEnrollments}</p>
                    <p className="stat-label">Записей студентов</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-info">
                    <FiCheckCircle />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{publishedCount}</p>
                    <p className="stat-label">Опубликовано</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-primary">
                    <FiLayers />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{draftCount}</p>
                    <p className="stat-label">Черновиков</p>
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
                        Ваши курсы, уроки, записи студентов и статусы публикации
                    </p>
                </div>
                {loading ? <div className="dashboard-loading-inline">Загрузка…</div> : statsBlock}
            </div>
        )
    }

    return (
        <div className="dashboard">
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Панель преподавателя</h1>
                    <p className="hero-subtitle">
                        Новости, быстрый доступ и управление курсами. Подробная статистика — в разделе «Статистика».
                    </p>
                </div>
                <div className="hero-illustration">
                    <div className="illustration-circle">
                        <FiBookOpen size={60} color="white" />
                    </div>
                </div>
            </div>

            <HomeNewsFeed />

            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Управление</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/notifications" className="dashboard-card">
                        Объявления <FiArrowRight />
                    </Link>
                    <Link to="/stats" className="dashboard-card">
                        Сводная статистика <FiArrowRight />
                    </Link>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="section-header courses-header">
                    <div>
                        <h2 className="section-title">Мои курсы</h2>
                        <p className="section-subtitle">
                            {courses.length}{' '}
                            {courses.length === 1 ? 'курс' : 'курсов'} создано
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-create-course"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FiPlus size={16} />
                        Создать курс
                    </button>
                </div>

                {loading ? (
                    <div className="courses-loading">
                        <div className="courses-skeleton" />
                        <div className="courses-skeleton" />
                        <div className="courses-skeleton" />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="courses-empty">
                        <div className="courses-empty-icon">
                            <FiBook size={40} />
                        </div>
                        <h3>Курсов пока нет</h3>
                        <p>Нажмите «Создать курс», чтобы добавить первый.</p>
                    </div>
                ) : (
                    <div className="courses-grid">
                        {courses.map((course) => {
                            const cfg = getStatusCfg(course.status)
                            return (
                                <div key={course.id} className="course-card">
                                    <div className="course-card-top" />

                                    <div className="course-card-body">
                                        <span
                                            className="course-status-badge"
                                            style={{ color: cfg.color, background: cfg.bg }}
                                        >
                                            {cfg.label}
                                        </span>

                                        <h3 className="course-title">{course.title}</h3>

                                        <p className="course-desc">
                                            {course.description || 'Описание не добавлено'}
                                        </p>
                                    </div>

                                    <div className="course-card-footer">
                                        <div className="course-meta">
                                            <span className="course-meta-item">
                                                <FiFileText size={13} />
                                                {course.lessonsCount ?? '—'} уроков
                                            </span>
                                        </div>
                                        <div className="course-card-actions">
                                            <Link
                                                to={`/courses/${course.id}`}
                                                className="course-action-btn"
                                                title="Просмотр"
                                            >
                                                <FiEye size={15} />
                                            </Link>
                                            <Link
                                                to={`/courses/${course.id}/edit`}
                                                className="course-action-btn primary"
                                                title="Редактировать"
                                            >
                                                <FiEdit size={15} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <CreateCourseModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    )
}

export default TeacherDashboard
