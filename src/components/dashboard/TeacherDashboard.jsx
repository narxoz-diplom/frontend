import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiUsers,
    FiEdit,
    FiBarChart2,
    FiArrowRight,
    FiBookOpen,
    FiPlus
} from 'react-icons/fi'
import api from '../../services/api'
import CreateCourseModal from '../CreateCourseModal'
import './Dashboard.css'

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

            {/* Actions Grid */}
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

            {/* Создать курс и список курсов */}
            <div className="dashboard-section teacher-courses-section">
                <div className="section-header">
                    <h2 className="section-title">Мои курсы</h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FiPlus /> Создать курс
                    </button>
                </div>
                {loading ? (
                    <p className="courses-loading">Загрузка курсов...</p>
                ) : courses.length === 0 ? (
                    <div className="teacher-courses-empty">
                        <p>У вас пока нет курсов. Нажмите «Создать курс», чтобы создать первый.</p>
                    </div>
                ) : (
                    <div className="teacher-courses-list">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                to={`/courses/${course.id}/edit`}
                                className="teacher-course-card"
                            >
                                <div className="teacher-course-info">
                                    <h3>{course.title}</h3>
                                    <p className="teacher-course-desc">
                                        {course.description || 'Без описания'}
                                    </p>
                                    <span className="teacher-course-status">{course.status}</span>
                                </div>
                                <FiArrowRight className="teacher-course-arrow" />
                            </Link>
                        ))}
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
