import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon, SectionCard, LineChart } from '@/shared/ui/academis'
import PageHeader from '@/shared/ui/PageHeader'
import { AdminStatsCharts } from './StatsCharts'
import useAdminDashboardData from './hooks/useAdminDashboardData'
import { useAiUsageReport } from './hooks/useAiUsageReport'
import StatCard from './components/StatCard'
import AiUsageDashboard from './components/AiUsageDashboard'
import AdminAiUsageFilters from './components/AdminAiUsageFilters'
import AdminTeacherLimitPanel from './components/AdminTeacherLimitPanel'
import { formatMicrosToCurrency } from '@/shared/lib/aiUsageFormat'
import './Dashboard.css'

const buildGrowthData = (timeSeries, locale) => {
  const points = (timeSeries || []).slice(-6)
  if (points.length < 2) return []
  return points.map((point) => ({
    l: new Date(point.date).toLocaleDateString(locale, { month: 'short' }).replace('.', ''),
    v: point.totalTokens ?? point.generationCount ?? 0,
  }))
}

const AdminDashboard = ({ view = 'home' }) => {
  const { t, i18n } = useTranslation()
  const { platform: p, filesCount, newsCount, loading } = useAdminDashboardData()
  const aiUsage = useAiUsageReport({ mode: 'admin' })

  const aiSummary = aiUsage.report?.summary || {}
  const aiGenerations = aiSummary.generationCount ?? 0
  const aiCost = formatMicrosToCurrency(aiSummary.costMicros, aiSummary.currency, i18n.language) ?? '—'
  const publishedPct = p.totalCourses > 0
    ? Math.round((p.publishedCourses / p.totalCourses) * 100)
    : 0

  const statItems = useMemo(() => [
    { key: 'instructors', icon: 'users', color: '#e41616', value: p.uniqueInstructors, label: t('dashboard.admin.instructors') },
    { key: 'courses', icon: 'books', color: '#2563eb', value: p.totalCourses, label: t('dashboard.admin.totalCourses') },
    { key: 'lessons', icon: 'doc', color: '#7c3aed', value: p.totalLessons, label: t('dashboard.charts.lessons') },
    { key: 'tests', icon: 'target', color: '#0891b2', value: p.totalTests, label: t('dashboard.charts.tests') },
    { key: 'aiGen', icon: 'sparkles', color: '#e8920c', value: aiGenerations, label: t('dashboard.home.aiGenerations') },
    { key: 'aiCost', icon: 'coins', color: '#11a957', value: aiCost, label: t('dashboard.home.aiSpend') },
    { key: 'performance', icon: 'award', color: '#db2777', value: `${publishedPct}%`, label: t('dashboard.home.avgPerformance') },
    { key: 'enrollments', icon: 'enroll', color: '#0d9488', value: p.totalEnrollmentSlots, label: t('dashboard.charts.enrollments') },
    { key: 'files', icon: 'files', color: '#6366f1', value: filesCount, label: t('dashboard.admin.files') },
    { key: 'news', icon: 'news', color: '#ef4444', value: newsCount, label: t('dashboard.admin.news') },
  ], [p, filesCount, newsCount, aiGenerations, aiCost, publishedPct, t])

  const growthData = useMemo(
    () => buildGrowthData(aiUsage.report?.timeSeries, i18n.language),
    [aiUsage.report, i18n.language],
  )

  const statsBlock = (
    <>
      <div className="stat-grid s5" style={{ marginTop: 18 }}>
        {statItems.map((item) => (
          <StatCard
            key={item.key}
            icon={item.icon}
            color={item.color}
            value={item.value}
            label={item.label}
          />
        ))}
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
        {t('dashboard.admin.enrollmentNote')}
      </p>
    </>
  )

  if (view === 'stats') {
    return (
      <div className="page page-wide">
        <PageHeader
          title={t('dashboard.admin.statsTitle')}
          subtitle={t('dashboard.admin.statsSubtitle')}
        />
        {loading ? (
          <div className="dashboard-loading">{t('common.loading')}</div>
        ) : (
          <>
            {statsBlock}
            <AdminStatsCharts platform={p} filesCount={filesCount} newsCount={newsCount} />
            <div className="col gap16" style={{ marginTop: 18 }}>
              <AdminAiUsageFilters
                filters={aiUsage.filters}
                onChange={aiUsage.updateFilter}
                onApply={aiUsage.applyFilters}
              />
              <AiUsageDashboard
                report={aiUsage.report}
                loading={aiUsage.loading}
                error={aiUsage.error}
                showRecentRuns={false}
                showAdminExtras
              />
              <AdminTeacherLimitPanel />
            </div>
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page page-wide">
        <div className="dashboard-loading">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      <div className="hero-teacher fade-up">
        <div>
          <span className="badge badge-solid">
            <Icon name="settings" size={13} />
            {t('dashboard.admin.panelBadge')}
          </span>
          <h1 className="h1" style={{ fontSize: 27, marginTop: 12 }}>
            {t('dashboard.admin.panelTitle')}
          </h1>
          <p className="muted" style={{ marginTop: 5, fontSize: 14.5 }}>
            {t('dashboard.admin.platformOverview')}
          </p>
        </div>
        <div className="row gap10">
          <Link to="/admin/news" className="btn btn-outline btn-lg">
            <Icon name="news" size={17} />
            {t('nav.adminNews')}
          </Link>
          <Link to="/stats" className="btn btn-primary btn-lg">
            <Icon name="chart" size={17} />
            {t('nav.stats')}
          </Link>
        </div>
      </div>

      {statsBlock}

      <div className="grid-2-1" style={{ marginTop: 18 }}>
        <SectionCard title={t('dashboard.admin.platformGrowth')} icon="trend">
          <LineChart data={growthData} height={210} />
        </SectionCard>

        <SectionCard title={t('dashboard.admin.quickLinks')} icon="bolt">
          <div className="col gap8">
            <Link to="/admin/news" className="ql-btn">
              <span className="ql-ic"><Icon name="news" size={18} /></span>
              <span style={{ fontWeight: 650, fontSize: 14 }}>{t('nav.adminNews')}</span>
              <Icon name="arrowRight" size={16} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
            </Link>
            <Link to="/stats" className="ql-btn">
              <span className="ql-ic"><Icon name="chart" size={18} /></span>
              <span style={{ fontWeight: 650, fontSize: 14 }}>{t('nav.stats')}</span>
              <Icon name="arrowRight" size={16} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
            </Link>
            <Link to="/courses" className="ql-btn">
              <span className="ql-ic"><Icon name="users" size={18} /></span>
              <span style={{ fontWeight: 650, fontSize: 14 }}>{t('nav.courses')}</span>
              <Icon name="arrowRight" size={16} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
            </Link>
            <Link to="/files" className="ql-btn">
              <span className="ql-ic"><Icon name="files" size={18} /></span>
              <span style={{ fontWeight: 650, fontSize: 14 }}>{t('nav.files')}</span>
              <Icon name="arrowRight" size={16} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

export default AdminDashboard
