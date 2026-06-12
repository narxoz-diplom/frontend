import React from 'react'
import { FiX } from 'react-icons/fi'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'
import { useTranslation } from 'react-i18next'

const CHART_COLORS = ['#e41616', '#b31212', '#ed5a5a', '#d10505', '#e41616', '#b31212']

function AnalyticsGenerativeUI({ result, theme = {}, onClose }) {
  const { t } = useTranslation()
  const summary = result?.summary || ''
  const pie = result?.pie_chart || null
  const bar = result?.bar_chart || null
  const statCards = Array.isArray(result?.stat_cards) ? result.stat_cards : []
  const topList = result?.top_list || null
  const trend = result?.trend_line || null
  const insights = Array.isArray(result?.insights) ? result.insights.filter(Boolean) : []
  const primary = theme.primary || '#e41616'
  const accent = theme.acent || theme.accent || '#ed5a5a'
  if (!summary && !pie && !bar && !insights.length && !statCards.length && !topList && !trend) return null

  const pieData = pie && Array.isArray(pie.items)
    ? pie.items.map(item => ({ name: item.label, value: Number(item.value) || 0 }))
    : []

  const barData = bar && Array.isArray(bar.items)
    ? bar.items.map(item => ({ name: item.label, value: Number(item.value) || 0 }))
    : []

  const trendData = trend && Array.isArray(trend.points)
    ? trend.points.map(p => ({ name: p.label, value: Number(p.value) || 0 }))
    : []

  return (
    <div className="ag-ui-analytics-card" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="ag-ui-analytics-header">
        <span className="ag-ui-analytics-icon">📊</span>
        <div>
          <h3>{t('lessonChat.lessonAnalytics')}</h3>
          {result?.lesson_title && <span className="ag-ui-subtitle">{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="ag-ui-card-close" onClick={onClose} aria-label={t('lessonChat.close')}>
            <FiX />
          </button>
        )}
      </div>
      <div className="ag-ui-analytics-body">
        {summary && (
          <div className="ag-ui-analytics-section">
            <h4>{t('lessonChat.analyticsSummary')}</h4>
            {summary.split(/\n\n+/).map((p, i) => (
              <p key={i}>{p.trim()}</p>
            ))}
          </div>
        )}

        {statCards.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{t('lessonChat.keyMetrics')}</h4>
            <div className="ag-ui-analytics-stat-cards">
              {statCards.map((card, i) => (
                <div key={i} className="ag-ui-analytics-stat-card">
                  <div className="stat-card-label">{card.label}</div>
                  <div className="stat-card-value">
                    {card.value}
                    {card.unit ? <span className="stat-card-unit">{card.unit}</span> : null}
                  </div>
                  {card.description && <div className="stat-card-desc">{card.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {pie && Array.isArray(pie.items) && pie.items.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{pie.title || t('lessonChat.distribution')}</h4>
            <div className="ag-ui-analytics-chart ag-ui-analytics-pie">
              <div className="ag-ui-analytics-pie-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ag-ui-analytics-pie-legend">
                {pie.items.map((item, i) => (
                  <div key={i} className="ag-ui-analytics-item">
                    <div className="ag-ui-analytics-item-header">
                      <span className="ag-ui-analytics-label">{item.label}</span>
                      <span className="ag-ui-analytics-value">
                        {typeof item.value === 'number' ? `${item.value}%` : String(item.value)}
                      </span>
                    </div>
                    <div className="ag-ui-analytics-bar-wrapper">
                      <div
                        className="ag-ui-analytics-bar-fill"
                        style={{ width: `${Math.max(0, Math.min(100, Number(item.value) || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {bar && Array.isArray(bar.items) && bar.items.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{bar.title || 'Сравнение показателей (столбчатый график)'}</h4>
            <div className="ag-ui-analytics-meta">
              {(bar.x_axis || bar.y_axis) && (
                <span>
                  {bar.x_axis && <strong>Ось X:</strong>} {bar.x_axis || ''}
                  {bar.x_axis && bar.y_axis && ' · '}
                  {bar.y_axis && <><strong>Ось Y:</strong> {bar.y_axis}</>}
                </span>
              )}
            </div>
            <div className="ag-ui-analytics-chart ag-ui-analytics-bars">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {topList && Array.isArray(topList.items) && topList.items.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{topList.title || t('lessonChat.topItems')}</h4>
            <div className="ag-ui-analytics-top-list">
              {topList.items.map((item, i) => (
                <div key={i} className="ag-ui-analytics-top-item">
                  <span className="top-rank">{i + 1}</span>
                  <span className="top-label">{item.label}</span>
                  {item.value != null && (
                    <span className="top-value">
                      {item.value}
                      {item.unit ? item.unit : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {trend && trendData.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{trend.title || t('lessonChat.trend')}</h4>
            <div className="ag-ui-analytics-chart ag-ui-analytics-trend">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={primary} strokeWidth={2.3} dot={{ r: 3.2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {insights.length > 0 && (
          <div className="ag-ui-analytics-section">
            <h4>{t('lessonChat.insights')}</h4>
            <ul className="ag-ui-analytics-insights">
              {insights.map((line, i) => (
                <li key={i}>{String(line).replace(/^[\s•\-*]+\s*/, '').trim()}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyticsGenerativeUI
