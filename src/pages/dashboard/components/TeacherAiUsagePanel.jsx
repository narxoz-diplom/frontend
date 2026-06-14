import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Donut, Spinner } from '@/shared/ui/academis'
import { formatMicrosToCurrency, formatTokenCount } from '@/shared/lib/aiUsageFormat'

const TeacherAiUsagePanel = ({ report, loading, horizontal = false }) => {
  const { t, i18n } = useTranslation()

  const { quotaPct, runs, tokens, cost, monthlyUsed, monthlyLimit } = useMemo(() => {
    const summary = report?.summary || {}
    const quota = report?.quotaUtilization?.[0]
    const used = quota?.monthlyUsedTokens ?? 0
    const limit = quota?.monthlyLimitTokens ?? 0
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

    return {
      quotaPct: pct,
      runs: summary.generationCount ?? 0,
      tokens: formatTokenCount(summary.totalTokens) ?? '—',
      cost: formatMicrosToCurrency(summary.costMicros, summary.currency, i18n.language) ?? '—',
      monthlyUsed: formatTokenCount(used) ?? '0',
      monthlyLimit: formatTokenCount(limit) ?? '—',
    }
  }, [report, i18n.language])

  if (loading) {
    return (
      <div className="teacher-ai-panel teacher-ai-panel--loading">
        <Spinner size={24} />
      </div>
    )
  }

  const metrics = [
    { value: runs, label: t('dashboard.home.runs') },
    { value: tokens, label: t('dashboard.home.tokens') },
    { value: cost, label: t('dashboard.home.cost') },
    { value: `${monthlyUsed} / ${monthlyLimit}`, label: t('dashboard.home.quota') },
  ]

  if (horizontal) {
    return (
      <div className="teacher-ai-panel teacher-ai-panel--horizontal">
        <div className="teacher-ai-donut-wrap">
          <Donut
            value={quotaPct}
            size={96}
            color="var(--brand)"
            sub={t('dashboard.home.quota')}
            label={`${quotaPct}%`}
          />
        </div>
        <div className="teacher-ai-stats-row">
          {metrics.map(({ value, label }) => (
            <div key={label} className="teacher-ai-stat">
              <div className="teacher-ai-stat-value mono">{value}</div>
              <div className="teacher-ai-stat-label dim">{label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="col center gap12" style={{ padding: '6px 0' }}>
      <Donut
        value={quotaPct}
        size={128}
        color="var(--brand)"
        sub={t('dashboard.home.quota')}
        label={`${quotaPct}%`}
      />
      <div className="row gap16" style={{ width: '100%', justifyContent: 'space-around' }}>
        {metrics.slice(0, 3).map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
            <div className="dim" style={{ fontSize: 11.5 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeacherAiUsagePanel
