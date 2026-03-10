import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiUsers,
    FiEdit,
    FiBarChart2,
    FiArrowRight,
    FiBookOpen,
    FiPlus,
    FiMoreVertical,
    FiEye,
    FiFileText
} from 'react-icons/fi'
import api from '../../services/api'
import CreateCourseModal from '../CreateCourseModal'
import './Dashboard.css'

const statusConfig = {
    PUBLISHED: { label: 'Опубликован', color: '#16a34a', bg: '#dcfce7' },
    DRAFT:     { label: 'Черновик',    color: '#d97706', bg: '#fef3c7' },
    ARCHIVED:  { label: 'Архив',       color: '#64748b', bg: '#f1f5f9' },
}

const TeacherDashboard = () => {
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

    const getStatusCfg = (status) =>
        statusConfig[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }

    return (
        <div className="dashboard">

            {/* Hero */}
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

            {/* Stats */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><FiBook /></div>
                    <div className="stat-content">
                        <p className="stat-value">{courses.length}</p>
                        <p className="stat-label">Мои курсы</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><FiUsers /></div>
                    <div className="stat-content">
                        <p className="stat-value">—</p>
                        <p className="stat-label">Студентов</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><FiEdit /></div>
                    <div className="stat-content">
                        <p className="stat-value">—</p>
                        <p className="stat-label">На проверке</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-info"><FiBarChart2 /></div>
                    <div className="stat-content">
                        <p className="stat-value">—</p>
                        <p className="stat-label">Средний прогресс</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Управление</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/notifications" className="dashboard-card">
                        Объявления <FiArrowRight />
                    </Link>
                </div>
            </div>

            {/* ── Мои курсы ── */}
            <div className="dashboard-section">
                <div className="section-header courses-header">
                    <div>
                        <h2 className="section-title">Мои курсы</h2>
                        <p className="section-subtitle">{courses.length} {courses.length === 1 ? 'курс' : 'курсов'} создано</p>
                    </div>
                    <button
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
                        <div className="courses-empty-icon"><FiBook size={40} /></div>
                        <h3>Курсов пока нет</h3>
                        <p>Нажмите «Создать курс», чтобы добавить первый.</p>
                    </div>
                ) : (
                    <div className="courses-grid">
                        {courses.map((course) => {
                            const cfg = getStatusCfg(course.status)
                            return (
                                <div key={course.id} className="course-card">
                                    {/* Верхняя цветная полоска */}
                                    <div className="course-card-top" />

                                    <div className="course-card-body">
                                        {/* Статус */}
                                        <span
                                            className="course-status-badge"
                                            style={{ color: cfg.color, background: cfg.bg }}
                                        >
                                            {cfg.label}
                                        </span>

                                        {/* Название */}
                                        <h3 className="course-title">{course.title}</h3>

                                        {/* Описание */}
                                        <p className="course-desc">
                                            {course.description || 'Описание не добавлено'}
                                        </p>
                                    </div>

                                    {/* Футер карточки */}
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