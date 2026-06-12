import React from 'react'
import { FiAlertCircle, FiCheckCircle, FiLoader, FiZap } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { formatTokenCount } from '@/shared/lib/aiUsageFormat'

const TeacherAiLimitBanner = ({ limit, loading }) => {
  const { t } = useTranslation()

  if (loading) {
    return (
      <aside className="teacher-ai-limit-banner teacher-ai-limit-banner--loading" aria-busy="true">
        <FiLoader className="spin" aria-hidden />
        <span>{t('courseEdit.userLimitLoading')}</span>
      </aside>
    )
  }

  if (!limit) return null

  if (limit.unlimited) {
    return (
      <aside className="teacher-ai-limit-banner teacher-ai-limit-banner--unlimited">
        <FiZap aria-hidden />
        <div>
          <p className="teacher-ai-limit-banner__title">{t('courseEdit.userLimitUnlimitedTitle')}</p>
          <p className="teacher-ai-limit-banner__hint">{t('courseEdit.userLimitUnlimitedHint')}</p>
        </div>
      </aside>
    )
  }

  const monthlyUsed = formatTokenCount(limit.monthlyUsed)
  const monthlyRemaining = formatTokenCount(limit.monthlyRemaining)
  const monthlyLimit = formatTokenCount(limit.monthlyLimit)
  const dailyUsed = formatTokenCount(limit.dailyUsed)
  const dailyRemaining = formatTokenCount(limit.dailyRemaining)
  const dailyLimit = formatTokenCount(limit.dailyLimit)

  const monthlyPct =
    limit.monthlyLimit > 0
      ? Math.min(100, Math.round((limit.monthlyUsed / limit.monthlyLimit) * 100))
      : 0
  const dailyPct =
    limit.dailyLimit > 0
      ? Math.min(100, Math.round((limit.dailyUsed / limit.dailyLimit) * 100))
      : 0

  return (
    <aside
      className={`teacher-ai-limit-banner${limit.blocked ? ' teacher-ai-limit-banner--blocked' : ''}`}
      role={limit.blocked ? 'alert' : 'status'}
    >
      <div className="teacher-ai-limit-banner__head">
        {limit.blocked ? <FiAlertCircle aria-hidden /> : <FiCheckCircle aria-hidden />}
        <p className="teacher-ai-limit-banner__title">
          {limit.blocked
            ? t('courseEdit.userLimitBlockedTitle')
            : t('courseEdit.userLimitTitle')}
        </p>
      </div>

      {limit.blocked && limit.blockReason && (
        <p className="teacher-ai-limit-banner__reason">{limit.blockReason}</p>
      )}

      <dl className="teacher-ai-limit-banner__grid">
        <div>
          <dt>{t('courseEdit.userLimitMonthly')}</dt>
          <dd>
            {t('courseEdit.userLimitUsedOf', {
              used: monthlyUsed,
              limit: monthlyLimit,
              remaining: monthlyRemaining
            })}
          </dd>
          <div className="teacher-ai-limit-banner__bar" aria-hidden>
            <span style={{ width: `${monthlyPct}%` }} />
          </div>
        </div>
        <div>
          <dt>{t('courseEdit.userLimitDaily')}</dt>
          <dd>
            {t('courseEdit.userLimitUsedOf', {
              used: dailyUsed,
              limit: dailyLimit,
              remaining: dailyRemaining
            })}
          </dd>
          <div className="teacher-ai-limit-banner__bar" aria-hidden>
            <span style={{ width: `${dailyPct}%` }} />
          </div>
        </div>
      </dl>

      {limit.customOverride && (
        <p className="teacher-ai-limit-banner__hint">{t('courseEdit.userLimitCustomOverride')}</p>
      )}
    </aside>
  )
}

export default TeacherAiLimitBanner
