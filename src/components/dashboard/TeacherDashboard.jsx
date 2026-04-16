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
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '../../i18n/localize'
import './Dashboard.css'

const TeacherDashboard = ({ view = 'home' }) => {
    const { t } = useTranslation()
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

    const getStatusCfg = (status) => {
        const map = {
            PUBLISHED: { label: t('dashboard.published'), color: '#16a34a', bg: '#dcfce7' },
            DRAFT: { label: 'Draft', color: '#d97706', bg: '#fef3c7' },
            ARCHIVED: { label: 'Archived', color: '#64748b', bg: '#f1f5f9' },
        }
        return map[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }
    }

    const statsBlock = (
        <div className="dashboard-stats" id="dashboard-stats">
            <div className="stat-card">
                <div className="stat-icon stat-icon-primary">
                    <FiBook />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{courses.length}</p>
                    <p className="stat-label">{t('dashboard.myCourses')}</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-success">
                    <FiFileText />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{totalLessons || 0}</p>
                    <p className="stat-label">{t('dashboard.totalLessons')}</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-warning">
                    <FiUsers />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{totalStudentEnrollments}</p>
                    <p className="stat-label">{t('dashboard.studentEnrollments')}</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-info">
                    <FiCheckCircle />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{publishedCount}</p>
                    <p className="stat-label">{t('dashboard.published')}</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon stat-icon-primary">
                    <FiLayers />
                </div>
                <div className="stat-content">
                    <p className="stat-value">{draftCount}</p>
                    <p className="stat-label">{t('dashboard.drafts')}</p>
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
                        {t('dashboard.teacherStatsDesc')}
                    </p>
                </div>
                {loading ? <div className="dashboard-loading-inline">{t('common.loading')}</div> : statsBlock}
            </div>
        )
    }

    return (
        <div className="dashboard">
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{t('dashboard.teacherPanel')}</h1>
                    <p className="hero-subtitle">
                        {t('dashboard.teacherSubtitle')}
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
                    <h2 className="section-title">{t('dashboard.management')}</h2>
                </div>
                <div className="dashboard-grid">
                    <Link to="/notifications" className="dashboard-card">
                        {t('dashboard.announcements')} <FiArrowRight />
                    </Link>
                    <Link to="/stats" className="dashboard-card">
                        {t('dashboard.summaryStats')} <FiArrowRight />
                    </Link>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="section-header courses-header">
                    <div>
                        <h2 className="section-title">{t('dashboard.myCourses')}</h2>
                        <p className="section-subtitle">
                            {courses.length} {t('dashboard.createdCourses')}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-create-course"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FiPlus size={16} />
                        {t('dashboard.createCourse')}
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
                        <h3>{t('dashboard.noCourses')}</h3>
                        <p>{t('dashboard.addFirstCourse')}</p>
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

                                        <h3 className="course-title">{pickLocalized(course, 'title')}</h3>

                                        <p className="course-desc">
                                            {pickLocalized(course, 'description') || t('dashboard.noDescription')}
                                        </p>
                                    </div>

                                    <div className="course-card-footer">
                                        <div className="course-meta">
                                            <span className="course-meta-item">
                                                <FiFileText size={13} />
                                                {course.lessonsCount ?? '—'} {t('dashboard.lessonsCountSuffix')}
                                            </span>
                                        </div>
                                        <div className="course-card-actions">
                                            <Link
                                                to={`/courses/${course.id}`}
                                                className="course-action-btn"
                                                title={t('common.view')}
                                            >
                                                <FiEye size={15} />
                                            </Link>
                                            <Link
                                                to={`/courses/${course.id}/edit`}
                                                className="course-action-btn primary"
                                                title={t('common.edit')}
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
