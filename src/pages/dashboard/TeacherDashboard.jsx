import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    FiBook,
    FiUsers,
    FiArrowRight,
    FiBookOpen,
    FiPlus,
    FiFileText,
    FiCheckCircle,
    FiLayers,
} from 'react-icons/fi'
import CreateCourseModal from '@/pages/courses/CreateCourseModal'
import HomeNewsFeed from './HomeNewsFeed'
import { TeacherStatsCharts } from './StatsCharts'
import { useTranslation } from 'react-i18next'
import useTeacherDashboardData from './hooks/useTeacherDashboardData'
import { useAiUsageReport } from './hooks/useAiUsageReport'
import StatCard from './components/StatCard'
import AiUsageDashboard from './components/AiUsageDashboard'
import TeacherCourseCard from './components/TeacherCourseCard'
import './Dashboard.css'

const TeacherDashboard = ({ view = 'home' }) => {
    const { t } = useTranslation()
    const {
        courses,
        loading,
        totalLessons,
        totalStudentEnrollments,
        publishedCount,
        draftCount,
    } = useTeacherDashboardData()
    const aiUsage = useAiUsageReport({ mode: 'teacher' })
    const [showCreateModal, setShowCreateModal] = useState(false)

    const statsBlock = (
        <div className="dashboard-stats" id="dashboard-stats">
            <StatCard
                icon={<FiBook />}
                tone="primary"
                value={courses.length}
                label={t('dashboard.myCourses')}
            />
            <StatCard
                icon={<FiFileText />}
                tone="success"
                value={totalLessons || 0}
                label={t('dashboard.totalLessons')}
            />
            <StatCard
                icon={<FiUsers />}
                tone="warning"
                value={totalStudentEnrollments}
                label={t('dashboard.studentEnrollments')}
            />
            <StatCard
                icon={<FiCheckCircle />}
                tone="info"
                value={publishedCount}
                label={t('dashboard.published')}
            />
            <StatCard
                icon={<FiLayers />}
                tone="primary"
                value={draftCount}
                label={t('dashboard.drafts')}
            />
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
                {loading ? (
                    <div className="dashboard-loading-inline">{t('common.loading')}</div>
                ) : (
                    <>
                        {statsBlock}
                        <TeacherStatsCharts courses={courses} />
                        <AiUsageDashboard
                            report={aiUsage.report}
                            loading={aiUsage.loading}
                            error={aiUsage.error}
                            showRecentRuns
                        />
                    </>
                )}
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
                        <FiBookOpen size={34} strokeWidth={1.75} aria-hidden />
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
                    <div className="courses-grid courses-grid--lms">
                        {courses.map((course) => (
                            <TeacherCourseCard key={course.id} course={course} />
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
