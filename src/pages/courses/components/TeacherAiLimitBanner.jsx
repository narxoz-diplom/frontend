import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatTokenCount } from '@/shared/lib/aiUsageFormat'
import { Icon, Spinner } from '@/shared/ui/academis'

const TeacherAiLimitBanner = ({ limit, loading }) => {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="quota-banner" aria-busy="true">
        <span className="qb-ic">
          <Spinner size={18} color="#fff" />
        </span>
        <span>{t('courseEdit.userLimitLoading')}</span>
      </div>
    )
  }

  if (!limit) return null

  if (limit.unlimited) {
    return (
      <div className="quota-banner">
        <span className="qb-ic">
          <Icon name="bolt" size={18} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{t('courseEdit.userLimitUnlimitedTitle')}</div>
          <div className="dim" style={{ fontSize: 12 }}>{t('courseEdit.userLimitUnlimitedHint')}</div>
        </div>
      </div>
    )
  }

  const monthlyPct =
    limit.monthlyLimit > 0
      ? Math.min(100, Math.round((limit.monthlyUsed / limit.monthlyLimit) * 100))
      : 0
  const monthlyUsed = formatTokenCount(limit.monthlyUsed)
  const monthlyLimit = formatTokenCount(limit.monthlyLimit)

  return (
    <div
      className={`quota-banner${limit.blocked ? ' quota-banner--blocked' : ''}`}
      role={limit.blocked ? 'alert' : 'status'}
    >
      <span className="qb-ic">
        <Icon name="bolt" size={18} />
      </span>
      <div style={{ flex: 1 }}>
        <div className="row between" style={{ marginBottom: 5 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            {monthlyPct}% {t('studio.quota')}
          </span>
          <span className="dim mono" style={{ fontSize: 12 }}>
            {monthlyUsed} / {monthlyLimit} {t('studio.runs')}
          </span>
        </div>
        <div className="progress" style={{ background: 'rgba(228,22,22,.15)' }}>
          <i style={{ width: `${monthlyPct}%` }} />
        </div>
        {limit.blocked && limit.blockReason && (
          <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>{limit.blockReason}</div>
        )}
      </div>
    </div>
  )
}

export default TeacherAiLimitBanner
