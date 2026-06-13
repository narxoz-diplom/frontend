import React from 'react'
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
import { Icon, Spinner } from '@/shared/ui/academis'
import StatCard from './StatCard'
import { HBarChart } from '../StatsCharts'

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
      <div className="ai-usage-dashboard ai-usage-dashboard__loading" aria-busy="true">
        <Spinner size={20} />
        <span>{t('dashboard.aiUsage.loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ai-usage-dashboard ai-usage-dashboard__error" role="alert">
        <Icon name="warn" size={18} />
        <span>{t('dashboard.aiUsage.loadError')}</span>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="ai-usage-dashboard ai-usage-dashboard__empty">
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
    color: ['#e41616', '#11a957', '#e8920c', '#2563eb', '#7c3aed'][index % 5]
  }))

  return (
    <section className="ai-usage-dashboard" aria-labelledby="ai-usage-title">
      <div className="sec-head" style={{ padding: '0 0 14px' }}>
        <h3 id="ai-usage-title" className="h3 row gap8">
          <Icon name="sparkles" size={17} />
          {t('dashboard.aiUsage.title')}
        </h3>
        {report.period && (
          <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
            {report.period.from} — {report.period.to}
          </p>
        )}
      </div>

      <div className="stat-grid s5" style={{ marginBottom: 14 }}>
        <StatCard
          icon="sparkles"
          color="linear-gradient(135deg,#e41616,#a00d0d)"
          value={dashValue(formatTokenCount(summary.totalTokens))}
          label={t('dashboard.aiUsage.totalTokens')}
        />
        <StatCard
          icon="doc"
          color="linear-gradient(135deg,#2563eb,#1e3a8a)"
          value={dashValue(formatTokenCount(summary.inputTokens))}
          label={t('dashboard.aiUsage.inputTokens')}
        />
        <StatCard
          icon="message"
          color="linear-gradient(135deg,#e8920c,#b45309)"
          value={dashValue(formatTokenCount(summary.outputTokens))}
          label={t('dashboard.aiUsage.outputTokens')}
        />
        <StatCard
          icon="chart"
          color="linear-gradient(135deg,#7c3aed,#5b21b6)"
          value={costLabel ?? '—'}
          label={t('dashboard.aiUsage.estimatedCost')}
        />
        <StatCard
          icon="bolt"
          color="linear-gradient(135deg,#0891b2,#155e63)"
          value={summary.generationCount ?? 0}
          label={t('dashboard.aiUsage.generationCount')}
        />
        <StatCard
          icon="warn"
          color="linear-gradient(135deg,#db2777,#9d174d)"
          value={summary.failedCount ?? 0}
          label={t('dashboard.aiUsage.failedCount')}
        />
        {showAdminExtras && summary.uniqueTeachers != null && (
          <StatCard
            icon="users"
            color="linear-gradient(135deg,#11a957,#0e8f49)"
            value={summary.uniqueTeachers}
            label={t('dashboard.aiUsage.uniqueTeachers')}
          />
        )}
      </div>

      {chartData.length > 0 && (
        <div className="card card-pad ai-usage-chart-card">
          <p className="ai-usage-chart-title">{t('dashboard.aiUsage.timeSeries')}</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tokens" stroke="var(--brand, #e41616)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {modelBars.length > 0 && (
        <div className="card card-pad ai-usage-chart-card">
          <p className="ai-usage-chart-title">{t('dashboard.aiUsage.byModel')}</p>
          <HBarChart items={modelBars} />
        </div>
      )}

      {showAdminExtras && report.byProvider?.length > 0 && (
        <div className="card card-pad ai-usage-chart-card">
          <p className="ai-usage-chart-title">{t('dashboard.aiUsage.byProvider')}</p>
          <div>
            {report.byProvider.map((row) => (
              <div key={row.provider} className="ai-usage-list-row">
                <span>{row.provider}</span>
                <span>
                  {formatTokenCount(row.totalTokens) ?? '—'} ·{' '}
                  {formatMicrosToCurrency(row.costMicros, currency, i18n.language) ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.quotaUtilization?.length > 0 && (
        <div className="card card-pad ai-usage-chart-card">
          <p className="ai-usage-chart-title">{t('dashboard.aiUsage.quotaUtilization')}</p>
          <div className="overflow-x-auto">
            <table className="tbl">
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
        <div className="card card-pad ai-usage-chart-card">
          <p className="ai-usage-chart-title">{t('dashboard.aiUsage.topUsers')}</p>
          <div>
            {report.topUsers.map((row) => (
              <div key={row.userId} className="ai-usage-list-row">
                <span className="ai-usage-mono">{row.userId}</span>
                <span>
                  {formatTokenCount(row.totalTokens) ?? '—'} · {row.generationCount ?? 0}{' '}
                  {t('dashboard.aiUsage.runs')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRecentRuns && report.recentRuns?.length > 0 && (
        <div className="card card-pad ai-usage-chart-card">
          <p className="ai-usage-chart-title">{t('dashboard.aiUsage.recentRuns')}</p>
          <div className="overflow-x-auto">
            <table className="tbl">
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
                    <td className="ai-usage-mono">{run.generationRunId}</td>
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
