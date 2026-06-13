import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CreateCourseModal from '@/pages/courses/CreateCourseModal'
import { getUserProfile } from '@/shared/lib/userProfile'
import { Icon, SectionCard, BarChart } from '@/shared/ui/academis'
import PageHeader from '@/shared/ui/PageHeader'
import HomeNewsFeed from './HomeNewsFeed'
import { TeacherStatsCharts } from './StatsCharts'
import useTeacherDashboardData from './hooks/useTeacherDashboardData'
import { useAiUsageReport } from './hooks/useAiUsageReport'
import StatCard from './components/StatCard'
import AiUsageDashboard from './components/AiUsageDashboard'
import TeacherCourseCard from './components/TeacherCourseCard'
import TeacherAiUsagePanel from './components/TeacherAiUsagePanel'
import './Dashboard.css'

const buildWeeklyActivity = (timeSeries, locale) => {
  const last7 = (timeSeries || []).slice(-7)
  if (last7.length === 0) return []
  return last7.map((point) => ({
    l: new Date(point.date).toLocaleDateString(locale, { weekday: 'short' }).replace('.', ''),
    v: point.generationCount ?? Math.round((point.totalTokens ?? 0) / 1000) ?? 0,
  }))
}

const TeacherDashboard = ({ view = 'home' }) => {
  const { t, i18n } = useTranslation()
  const profile = useMemo(() => getUserProfile(), [])
  const {
    courses,
    loading,
    totalLessons,
    totalStudentEnrollments,
    publishedCount,
  } = useTeacherDashboardData()
  const aiUsage = useAiUsageReport({ mode: 'teacher' })
  const [showCreateModal, setShowCreateModal] = useState(false)

  const aiGenerations = aiUsage.report?.summary?.generationCount ?? 0
  const quotaPct = useMemo(() => {
    const quota = aiUsage.report?.quotaUtilization?.[0]
    const monthlyUsed = quota?.monthlyUsedTokens ?? 0
    const monthlyLimit = quota?.monthlyLimitTokens ?? 0
    return monthlyLimit > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)) : 0
  }, [aiUsage.report])

  const performancePct = courses.length > 0
    ? Math.round((publishedCount / courses.length) * 100)
    : 0

  const weeklyActivity = useMemo(
    () => buildWeeklyActivity(aiUsage.report?.timeSeries, i18n.language),
    [aiUsage.report, i18n.language],
  )

  const statsBlock = (
    <div className="stat-grid s5" style={{ marginTop: 18 }}>
      <StatCard
        icon="books"
        color="linear-gradient(135deg,#e41616,#a00d0d)"
        value={courses.length}
        label={t('dashboard.home.myCoursesShort')}
      />
      <StatCard
        icon="users"
        color="linear-gradient(135deg,#2563eb,#1e3a8a)"
        value={totalStudentEnrollments}
        label={t('dashboard.home.students')}
      />
      <StatCard
        icon="doc"
        color="linear-gradient(135deg,#7c3aed,#5b21b6)"
        value={totalLessons || 0}
        label={t('dashboard.totalLessons')}
      />
      <StatCard
        icon="sparkles"
        color="linear-gradient(135deg,#0891b2,#155e63)"
        value={aiGenerations}
        label={t('dashboard.home.aiGenerations')}
      />
      <StatCard
        icon="award"
        color="linear-gradient(135deg,#11a957,#0e8f49)"
        value={`${performancePct}%`}
        label={t('dashboard.home.avgPerformance')}
      />
    </div>
  )

  if (view === 'stats') {
    return (
      <div className="page">
        <PageHeader
          title={t('dashboard.statsTitle')}
          subtitle={t('dashboard.teacherStatsDesc')}
        />
        {loading ? (
          <div className="dashboard-loading">{t('common.loading')}</div>
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
    <div className="page">
      <div className="hero-teacher fade-up">
        <div>
          <span className="badge badge-solid">
            <Icon name="sparkles" size={13} />
            {t('dashboard.teacherPanel')}
          </span>
          <h1 className="h1" style={{ fontSize: 27, marginTop: 12 }}>
            {t('dashboard.home.teacherWelcome', { name: profile.firstName })}
          </h1>
          <p className="muted" style={{ marginTop: 5, fontSize: 14.5 }}>
            {t('dashboard.home.teacherHeroSummary', {
              courses: courses.length,
              students: totalStudentEnrollments,
              quota: quotaPct,
            })}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setShowCreateModal(true)}
        >
          <Icon name="plus" size={18} />
          {t('dashboard.createCourse')}
        </button>
      </div>

      {statsBlock}

      <div className="grid-2-1" style={{ marginTop: 18 }}>
        <div className="col gap16">
          <SectionCard
            title={t('dashboard.myCourses')}
            icon="books"
            action={(
              <Link to="/courses" className="link-more">
                {t('common.viewAll')}
              </Link>
            )}
          >
            {loading ? (
              <div className="course-mini-grid">
                <div className="courses-skeleton" />
                <div className="courses-skeleton" />
              </div>
            ) : courses.length === 0 ? (
              <div className="courses-empty">
                <Icon name="books" size={40} style={{ color: 'var(--text-3)' }} />
                <h3>{t('dashboard.noCourses')}</h3>
                <p>{t('dashboard.addFirstCourse')}</p>
              </div>
            ) : (
              <div className="course-mini-grid">
                {courses.slice(0, 3).map((course) => (
                  <TeacherCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </SectionCard>
          <HomeNewsFeed />
        </div>

        <div className="col gap16">
          <SectionCard title={t('dashboard.aiUsage.title')} icon="sparkles">
            <TeacherAiUsagePanel report={aiUsage.report} loading={aiUsage.loading} />
          </SectionCard>

          <SectionCard title={t('dashboard.home.weeklyActivity')} icon="chart">
            {weeklyActivity.length > 0 ? (
              <BarChart data={weeklyActivity} height={150} />
            ) : (
              <div className="muted" style={{ padding: '20px 0', textAlign: 'center', fontSize: 13 }}>
                {t('dashboard.aiUsage.empty')}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}

export default TeacherDashboard
