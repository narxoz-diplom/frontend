import React from 'react'
import { FiCpu, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import { formatMicrosToCurrency, formatTokenCount } from '@/shared/lib/aiUsageFormat'
import StatCard from './StatCard'
import { HBarChart } from '../StatsCharts'
import '../AiUsageDashboard.css'

const dashValue = (value) => (value == null ? '—' : value)

const AiUsageDashboard = ({
  report,
  loading,
  error,
  showRecentRuns = true,
  showAdminExtras = false
}) => {
  const { t, i18n } = useTranslation()

  if (loading) {
    return (
      <div className="ai-usage-dashboard ai-usage-dashboard--loading">
        <FiLoader className="spin" aria-hidden />
        <span>{t('dashboard.aiUsage.loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ai-usage-dashboard ai-usage-dashboard--error" role="alert">
        <FiAlertCircle aria-hidden />
        <span>{t('dashboard.aiUsage.loadError')}</span>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="ai-usage-dashboard ai-usage-dashboard--empty">
        <p>{t('dashboard.aiUsage.empty')}</p>
      </div>
    )
  }

  const summary = report.summary || {}
  const currency = summary.currency || 'USD'
  const costLabel = formatMicrosToCurrency(summary.costMicros, currency, i18n.language)

  const chartData = (report.timeSeries || []).map((point) => ({
    date: point.date,
    tokens: point.totalTokens ?? 0,
    cost: point.costMicros != null ? point.costMicros / 1_000_000 : 0
  }))

  const modelBars = (report.byModel || []).map((item, index) => ({
    label: item.displayName || item.modelId,
    value: item.totalTokens ?? 0,
    color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9'][index % 5]
  }))

  return (
    <section className="ai-usage-dashboard" aria-labelledby="ai-usage-title">
      <div className="ai-usage-dashboard__head">
        <h3 id="ai-usage-title" className="ai-usage-dashboard__title">
          <FiCpu aria-hidden /> {t('dashboard.aiUsage.title')}
        </h3>
        {report.period && (
          <p className="ai-usage-dashboard__period">
            {report.period.from} — {report.period.to}
          </p>
        )}
      </div>

      <div className="dashboard-stats ai-usage-dashboard__stats">
        <StatCard
          icon={<FiCpu />}
          tone="primary"
          value={dashValue(formatTokenCount(summary.totalTokens))}
          label={t('dashboard.aiUsage.totalTokens')}
        />
        <StatCard
          icon={<FiCpu />}
          tone="success"
          value={dashValue(formatTokenCount(summary.inputTokens))}
          label={t('dashboard.aiUsage.inputTokens')}
        />
        <StatCard
          icon={<FiCpu />}
          tone="warning"
          value={dashValue(formatTokenCount(summary.outputTokens))}
          label={t('dashboard.aiUsage.outputTokens')}
        />
        <StatCard
          icon={<FiCpu />}
          tone="info"
          value={costLabel ?? '—'}
          label={t('dashboard.aiUsage.estimatedCost')}
        />
        <StatCard
          icon={<FiCpu />}
          tone="primary"
          value={summary.generationCount ?? 0}
          label={t('dashboard.aiUsage.generationCount')}
        />
        <StatCard
          icon={<FiCpu />}
          tone="warning"
          value={summary.failedCount ?? 0}
          label={t('dashboard.aiUsage.failedCount')}
        />
        {showAdminExtras && summary.uniqueTeachers != null && (
          <StatCard
            icon={<FiCpu />}
            tone="info"
            value={summary.uniqueTeachers}
            label={t('dashboard.aiUsage.uniqueTeachers')}
          />
        )}
      </div>

      {chartData.length > 0 && (
        <div className="stats-chart-card ai-usage-dashboard__chart">
          <p className="stats-chart-card__title">{t('dashboard.aiUsage.timeSeries')}</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tokens" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {modelBars.length > 0 && (
        <div className="stats-chart-card ai-usage-dashboard__chart">
          <p className="stats-chart-card__title">{t('dashboard.aiUsage.byModel')}</p>
          <HBarChart items={modelBars} />
        </div>
      )}

      {showAdminExtras && report.byProvider?.length > 0 && (
        <div className="stats-chart-card ai-usage-dashboard__chart">
          <p className="stats-chart-card__title">{t('dashboard.aiUsage.byProvider')}</p>
          <ul className="ai-usage-list">
            {report.byProvider.map((row) => (
              <li key={row.provider}>
                <span>{row.provider}</span>
                <span>
                  {formatTokenCount(row.totalTokens) ?? '—'} ·{' '}
                  {formatMicrosToCurrency(row.costMicros, currency, i18n.language) ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.quotaUtilization?.length > 0 && (
        <div className="stats-chart-card ai-usage-dashboard__chart">
          <p className="stats-chart-card__title">{t('dashboard.aiUsage.quotaUtilization')}</p>
          <div className="ai-usage-table-wrap">
            <table className="ai-usage-table">
              <thead>
                <tr>
                  <th>{t('dashboard.aiUsage.model')}</th>
                  <th>{t('dashboard.aiUsage.monthlyQuota')}</th>
                  <th>{t('dashboard.aiUsage.dailyQuota')}</th>
                  <th>{t('dashboard.aiUsage.status')}</th>
                </tr>
              </thead>
              <tbody>
                {report.quotaUtilization.map((row) => (
                  <tr key={`${row.userId || 'self'}-${row.modelId}`}>
                    <td>{row.displayName || row.modelId}</td>
                    <td>
                      {row.monthlyLimitTokens != null
                        ? `${formatTokenCount(row.monthlyUsedTokens) ?? 0} / ${formatTokenCount(row.monthlyLimitTokens)}`
                        : '—'}
                    </td>
                    <td>
                      {row.dailyLimitTokens != null
                        ? `${formatTokenCount(row.dailyUsedTokens) ?? 0} / ${formatTokenCount(row.dailyLimitTokens)}`
                        : '—'}
                    </td>
                    <td>{row.blocked ? t('dashboard.aiUsage.quotaBlocked') : t('dashboard.aiUsage.quotaOk')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdminExtras && report.topUsers?.length > 0 && (
        <div className="stats-chart-card ai-usage-dashboard__chart">
          <p className="stats-chart-card__title">{t('dashboard.aiUsage.topUsers')}</p>
          <ul className="ai-usage-list">
            {report.topUsers.map((row) => (
              <li key={row.userId}>
                <span className="ai-usage-list__mono">{row.userId}</span>
                <span>
                  {formatTokenCount(row.totalTokens) ?? '—'} · {row.generationCount ?? 0}{' '}
                  {t('dashboard.aiUsage.runs')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRecentRuns && report.recentRuns?.length > 0 && (
        <div className="stats-chart-card ai-usage-dashboard__chart">
          <p className="stats-chart-card__title">{t('dashboard.aiUsage.recentRuns')}</p>
          <div className="ai-usage-table-wrap">
            <table className="ai-usage-table">
              <thead>
                <tr>
                  <th>{t('dashboard.aiUsage.runId')}</th>
                  <th>{t('dashboard.aiUsage.course')}</th>
                  <th>{t('dashboard.aiUsage.type')}</th>
                  <th>{t('dashboard.aiUsage.model')}</th>
                  <th>{t('dashboard.aiUsage.status')}</th>
                  <th>{t('dashboard.aiUsage.tokens')}</th>
                  <th>{t('dashboard.aiUsage.cost')}</th>
                </tr>
              </thead>
              <tbody>
                {report.recentRuns.map((run) => (
                  <tr key={run.generationRunId}>
                    <td className="ai-usage-list__mono">{run.generationRunId}</td>
                    <td>{run.courseId ?? '—'}</td>
                    <td>{run.generationType}</td>
                    <td>{run.modelId}</td>
                    <td>{run.status}</td>
                    <td>{formatTokenCount(run.totalTokens) ?? '—'}</td>
                    <td>
                      {formatMicrosToCurrency(run.costMicros, currency, i18n.language) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default AiUsageDashboard
