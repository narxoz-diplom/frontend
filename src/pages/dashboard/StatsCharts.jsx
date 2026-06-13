import React from 'react'
import { useTranslation } from 'react-i18next'
import './StatsCharts.css'

function DonutChart({ segments, size = 160, label, sublabel }) {
    const total = segments.reduce((s, seg) => s + Math.max(0, seg.value || 0), 0)

    if (total === 0) {
        return (
            <div className="donut-empty" style={{ width: size, height: size }}>
                <span className="donut-empty-text">—</span>
            </div>
        )
    }

    let accumulated = 0
    const stops = segments
        .filter((seg) => seg.value > 0)
        .map((seg) => {
            const pct = (seg.value / total) * 100
            const from = accumulated
            accumulated += pct
            return `${seg.color} ${from.toFixed(2)}% ${accumulated.toFixed(2)}%`
        })
        .join(', ')

    const holeSize = Math.round(size * 0.28)

    return (
        <div className="donut-wrap" style={{ width: size, height: size }}>
            <div
                className="donut-disc"
                style={{
                    width: size,
                    height: size,
                    background: `conic-gradient(${stops})`,
                    WebkitMask: `radial-gradient(transparent ${holeSize}px, black ${holeSize}px)`,
                    mask: `radial-gradient(transparent ${holeSize}px, black ${holeSize}px)`,
                }}
            />
            <div className="donut-center">
                {label != null && <span className="donut-center__value">{label}</span>}
                {sublabel && <span className="donut-center__label">{sublabel}</span>}
            </div>
        </div>
    )
}

export function HBarChart({ items }) {
    const max = Math.max(...items.map((i) => i.value || 0), 1)
    return (
        <div className="hbar-chart">
            {items.map((item, i) => (
                <div key={i} className="hbar-row">
                    <span className="hbar-label" title={item.label}>{item.label}</span>
                    <div className="hbar-track" aria-label={`${item.label}: ${item.value}`}>
                        <div
                            className="hbar-fill"
                            style={{
                                width: `${Math.max(2, (item.value / max) * 100)}%`,
                                background: item.color,
                            }}
                        />
                    </div>
                    <span className="hbar-value">{item.value}</span>
                </div>
            ))}
        </div>
    )
}

function Legend({ segments }) {
    return (
        <div className="donut-legend">
            {segments.filter((s) => s.value > 0).map((seg, i) => (
                <div key={i} className="donut-legend__item">
                    <span className="donut-legend__dot" style={{ background: seg.color }} />
                    <span className="donut-legend__label">{seg.label}</span>
                    <span className="donut-legend__val">{seg.value}</span>
                </div>
            ))}
        </div>
    )
}

function ChartCard({ title, children }) {
    return (
        <div className="card card-pad">
            <h3 className="h3" style={{ marginBottom: 14 }}>{title}</h3>
            {children}
        </div>
    )
}

export function StudentStatsCharts({ stats }) {
    const { t } = useTranslation()
    const { enrolledCourses = 0, catalogCourses = 0, completedLessons = 0, testAttempts = 0 } = stats

    const notEnrolled = Math.max(0, catalogCourses - enrolledCourses)
    const donutSegments = [
        { label: t('dashboard.charts.enrolled'), value: enrolledCourses, color: 'var(--primary-color)' },
        { label: t('dashboard.charts.notEnrolled'), value: notEnrolled, color: 'var(--bg-tertiary)' },
    ]

    const barItems = [
        { label: t('dashboard.myCourses'), value: enrolledCourses, color: 'var(--primary-color)' },
        { label: t('dashboard.completedLessons'), value: completedLessons, color: '#22c55e' },
        { label: t('dashboard.testAttempts'), value: testAttempts, color: '#f59e0b' },
        { label: t('dashboard.catalogCourses'), value: catalogCourses, color: '#6366f1' },
    ]

    const pct = catalogCourses > 0 ? Math.round((enrolledCourses / catalogCourses) * 100) : 0

    return (
        <div className="stats-charts-grid">
            <ChartCard title={t('dashboard.charts.catalogCoverage')}>
                <div className="stats-chart-donut-row">
                    <DonutChart
                        segments={donutSegments}
                        size={152}
                        label={`${pct}%`}
                        sublabel={t('dashboard.charts.enrollmentsSublabel')}
                    />
                    <Legend segments={donutSegments} />
                </div>
            </ChartCard>

            <ChartCard title={t('dashboard.charts.metricsComparison')}>
                <HBarChart items={barItems} />
            </ChartCard>
        </div>
    )
}

export function TeacherStatsCharts({ courses }) {
    const { t } = useTranslation()
    const total = courses.length
    const published = courses.filter((c) => c.status === 'PUBLISHED').length
    const draft = courses.filter((c) => c.status === 'DRAFT').length
    const archived = courses.filter((c) => c.status === 'ARCHIVED').length
    const totalLessons = courses.reduce((s, c) => s + (Number(c.lessonsCount) || 0), 0)
    const totalStudents = courses.reduce((s, c) => s + (Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : 0), 0)

    const donutSegments = [
        { label: t('dashboard.published'), value: published, color: '#22c55e' },
        { label: t('dashboard.charts.draft'), value: draft, color: '#f59e0b' },
        { label: t('dashboard.charts.archive'), value: archived, color: '#94a3b8' },
    ]

    const barItems = [
        { label: t('dashboard.charts.totalCourses'), value: total, color: 'var(--primary-color)' },
        { label: t('dashboard.published'), value: published, color: '#22c55e' },
        { label: t('dashboard.drafts'), value: draft, color: '#f59e0b' },
        { label: t('dashboard.charts.lessons'), value: totalLessons, color: '#6366f1' },
        { label: t('dashboard.charts.students'), value: totalStudents, color: '#06b6d4' },
    ]

    return (
        <div className="stats-charts-grid">
            <ChartCard title={t('dashboard.charts.courseStatuses')}>
                <div className="stats-chart-donut-row">
                    <DonutChart
                        segments={donutSegments}
                        size={152}
                        label={total}
                        sublabel={t('dashboard.charts.coursesSublabel')}
                    />
                    <Legend segments={donutSegments} />
                </div>
            </ChartCard>

            <ChartCard title={t('dashboard.charts.metricsComparison')}>
                <HBarChart items={barItems} />
            </ChartCard>
        </div>
    )
}

export function AdminStatsCharts({ platform, filesCount, newsCount }) {
    const { t } = useTranslation()
    const p = platform || {}
    const published = p.publishedCourses || 0
    const draft = p.draftCourses || 0
    const archived = p.archivedCourses || 0

    const donutSegments = [
        { label: t('dashboard.published'), value: published, color: '#22c55e' },
        { label: t('dashboard.drafts'), value: draft, color: '#f59e0b' },
        { label: t('dashboard.charts.archive'), value: archived, color: '#94a3b8' },
    ]

    const barItems = [
        { label: t('dashboard.charts.totalCourses'), value: p.totalCourses || 0, color: 'var(--primary-color)' },
        { label: t('dashboard.charts.lessons'), value: p.totalLessons || 0, color: '#6366f1' },
        { label: t('dashboard.charts.tests'), value: p.totalTests || 0, color: '#f59e0b' },
        { label: t('dashboard.charts.enrollments'), value: p.totalEnrollmentSlots || 0, color: '#22c55e' },
        { label: t('dashboard.charts.instructors'), value: p.uniqueInstructors || 0, color: '#06b6d4' },
        { label: t('dashboard.charts.files'), value: filesCount || 0, color: '#a78bfa' },
        { label: t('dashboard.charts.news'), value: newsCount || 0, color: '#fb923c' },
    ]

    return (
        <div className="stats-charts-grid">
            <ChartCard title={t('dashboard.charts.courseDistribution')}>
                <div className="stats-chart-donut-row">
                    <DonutChart
                        segments={donutSegments}
                        size={152}
                        label={p.totalCourses || 0}
                        sublabel={t('dashboard.charts.coursesSublabel')}
                    />
                    <Legend segments={donutSegments} />
                </div>
            </ChartCard>

            <ChartCard title={t('dashboard.charts.platformContent')}>
                <HBarChart items={barItems} />
            </ChartCard>
        </div>
    )
}
