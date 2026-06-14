import React, { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getUserProfile } from '@/shared/lib/userProfile'
import { pickLocalized } from '@/i18n/localize'
import { Icon, Donut, SectionCard, Spinner, CourseCover } from '@/shared/ui/academis'
import PageHeader from '@/shared/ui/PageHeader'
import useStudentDashboardData from './hooks/useStudentDashboardData'
import StatCard from './components/StatCard'
import DeadlineCard from './components/DeadlineCard'
import HomeNewsFeed from './HomeNewsFeed'
import { StudentStatsCharts } from './StatsCharts'
import './Dashboard.css'

const StudentDashboard = ({ view = 'home' }) => {
  const { t, i18n } = useTranslation()
  const profile = useMemo(() => getUserProfile(), [])
  const { stats, enrolledCourses, upcomingDeadlines, loading } = useStudentDashboardData()

  const totalLessons = enrolledCourses.reduce((sum, course) => sum + (Number(course.lessonsCount) || 0), 0)
  const progressPct = totalLessons > 0
    ? Math.min(100, Math.round((stats.completedLessons / totalLessons) * 100))
    : 0
  const continueCourse = enrolledCourses[0]
  const dateLabel = new Date().toLocaleDateString(i18n.language || 'ru', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const statsBlock = (
    <div className="stat-grid s4" style={{ marginTop: 18 }}>
      <StatCard
        icon="book"
        color="linear-gradient(135deg,#e41616,#a00d0d)"
        value={stats.enrolledCourses}
        label={t('dashboard.home.activeCourses')}
      />
      <StatCard
        icon="checkCircle"
        color="linear-gradient(135deg,#11a957,#0e8f49)"
        value={totalLessons > 0 ? `${stats.completedLessons}/${totalLessons}` : stats.completedLessons}
        label={t('dashboard.home.lessonsProgress')}
      />
      <StatCard
        icon="award"
        color="linear-gradient(135deg,#2563eb,#1e3a8a)"
        value="—"
        label={t('dashboard.home.averageScore')}
      />
      <StatCard
        icon="fire"
        color="linear-gradient(135deg,#e8920c,#b45309)"
        value="—"
        label={t('dashboard.home.streakDays')}
      />
    </div>
  )

  if (view === 'stats') {
    return (
      <div className="page page-wide">
        <PageHeader
          title={t('dashboard.statsTitle')}
          subtitle={t('dashboard.studentStatsDesc')}
        />
        {loading ? (
          <div className="dashboard-loading">{t('common.loading')}</div>
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
      <div className="page page-wide">
        <div className="dashboard-loading">
          <Spinner />
          <div style={{ marginTop: 10 }}>{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      <div className="hero-student fade-up">
        <div className="hero-bg" aria-hidden />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}>{dateLabel}</div>
          <h1 className="h1" style={{ color: '#fff', fontSize: 28, marginTop: 6 }}>
            {t('dashboard.home.hiStudent')}
            ,
            {' '}
            {profile.firstName}
            {' '}
            👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,.82)', marginTop: 6, fontSize: 15 }}>
            {t('dashboard.home.welcomeBackShort')}
          </p>
          <div className="row gap10" style={{ marginTop: 18 }}>
            <Link
              to={continueCourse ? `/courses/${continueCourse.id}` : '/courses'}
              className="btn btn-lg"
              style={{ background: '#fff', color: 'var(--brand)' }}
            >
              <Icon name="play" size={16} />
              {t('dashboard.home.continueLearning')}
            </Link>
            <Link
              to="/courses"
              className="btn btn-lg"
              style={{
                background: 'rgba(255,255,255,.16)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.28)',
              }}
            >
              {t('nav.courses')}
            </Link>
          </div>
        </div>
        <div className="hero-ring">
          <Donut
            value={progressPct}
            size={116}
            color="#fff"
            label={`${progressPct}%`}
            sub={t('dashboard.home.progress')}
          />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <HomeNewsFeed />
      </div>

      <div className="grid-2-1" style={{ marginTop: 18 }}>
        <div className="col gap16">
          <SectionCard
            title={t('dashboard.home.continueLearning')}
            icon="book"
            action={<Link to="/courses" className="link-more">{t('common.viewAll')}</Link>}
          >
            {enrolledCourses.length === 0 ? (
              <div className="dashboard-empty-hint">{t('studentGrades.noCourses')}</div>
            ) : (
              <div className="col gap10">
                {enrolledCourses.slice(0, 3).map((course) => {
                  const title = pickLocalized(course, 'title')
                  const progress = Math.min(100, Number(course.progress) || 0)
                  return (
                    <Link key={course.id} to={`/courses/${course.id}`} className="mini-course">
                      <CourseCover course={course} height={56} width={56} radius={12} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
                        <div className="dim" style={{ fontSize: 12, margin: '3px 0 7px' }}>
                          {(course.lessonsCount ?? 0)}
                          {' '}
                          {t('common.lessons')}
                          {course.level ? ` · ${course.level}` : ''}
                        </div>
                        <div className="progress" style={{ maxWidth: 280 }}>
                          <i style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="mono" style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 16 }}>
                        {progress}
                        %
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="col gap16">
          <SectionCard title={t('dashboard.upcomingDeadlinesTitle')} icon="clock">
            {(upcomingDeadlines?.length ?? 0) === 0 ? (
              <div className="muted" style={{ padding: 12 }}>{t('dashboard.upcomingDeadlinesEmpty')}</div>
            ) : (
              <div className="col gap8">
                {upcomingDeadlines.slice(0, 5).map((deadline) => (
                  <DeadlineCard
                    key={`${deadline.courseId}-${deadline.testId}-${deadline.dueAt}`}
                    deadline={deadline}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={t('dashboard.quickActions')} icon="bolt">
            <div className="qa-grid">
              <Link to="/courses" className="qa-btn">
                <Icon name="books" size={20} />
                <span>{t('nav.courses')}</span>
              </Link>
              <Link to="/my/grades" className="qa-btn">
                <Icon name="grade" size={20} />
                <span>{t('nav.myGrades')}</span>
              </Link>
              <Link to="/files" className="qa-btn">
                <Icon name="files" size={20} />
                <span>{t('nav.files')}</span>
              </Link>
              <Link to="/stats" className="qa-btn">
                <Icon name="chart" size={20} />
                <span>{t('nav.stats')}</span>
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
