import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatTokenCount } from '@/shared/lib/aiUsageFormat'
import { Icon, Spinner } from '@/shared/ui/academis'
import { useAdminTeacherLimit } from '../hooks/useAdminTeacherLimit'

const AdminTeacherLimitPanel = () => {
  const { t } = useTranslation()
  const limit = useAdminTeacherLimit()

  const errorKey =
    limit.error === 'user_id_required'
      ? 'dashboard.aiUsage.teacherLimit.userIdRequired'
      : limit.error === 'invalid_limits'
        ? 'dashboard.aiUsage.teacherLimit.invalidLimits'
        : limit.error
          ? 'dashboard.aiUsage.teacherLimit.loadError'
          : null

  return (
    <section className="card card-pad admin-teacher-limit-card" aria-labelledby="admin-teacher-limit-title">
      <div className="sec-head" style={{ padding: '0 0 12px' }}>
        <h3 id="admin-teacher-limit-title" className="h3 row gap8">
          <Icon name="settings" size={17} />
          {t('dashboard.aiUsage.teacherLimit.title')}
        </h3>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
          {t('dashboard.aiUsage.teacherLimit.desc')}
        </p>
      </div>

      <div className="row gap12 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label className="label">{t('dashboard.aiUsage.userId')}</label>
          <input
            className="input"
            type="text"
            value={limit.userId}
            onChange={(e) => limit.setUserId(e.target.value)}
            placeholder={t('dashboard.aiUsage.userIdPlaceholder')}
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={limit.load}
          disabled={limit.loading || limit.saving}
        >
          {limit.loading ? <Spinner size={16} /> : <Icon name="search" size={16} />}
          {t('dashboard.aiUsage.teacherLimit.load')}
        </button>
      </div>

      {errorKey && (
        <p className="rag-out-academis error" style={{ marginTop: 12 }} role="alert">
          {limit.error && limit.error !== 'user_id_required' && limit.error !== 'invalid_limits'
            ? limit.error
            : t(errorKey)}
        </p>
      )}

      {limit.message === 'saved' && (
        <p className="muted" style={{ marginTop: 12, color: 'var(--green-500)', fontWeight: 600 }} role="status">
          {t('dashboard.aiUsage.teacherLimit.saved')}
        </p>
      )}
      {limit.message === 'reset' && (
        <p className="muted" style={{ marginTop: 12, color: 'var(--green-500)', fontWeight: 600 }} role="status">
          {t('dashboard.aiUsage.teacherLimit.resetDone')}
        </p>
      )}

      {limit.status && (
        <div className="col gap14" style={{ marginTop: 16 }}>
          <label className="row gap10" style={{ fontWeight: 650, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={limit.form.unlimitedAccess}
              onChange={(e) => limit.updateField('unlimitedAccess', e.target.checked)}
            />
            <span>{t('dashboard.aiUsage.teacherLimit.unlimited')}</span>
          </label>

          {!limit.form.unlimitedAccess && (
            <div className="row gap12 wrap">
              <div className="field" style={{ flex: 1, minWidth: 180 }}>
                <label className="label">{t('dashboard.aiUsage.teacherLimit.monthlyTokens')}</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1000"
                  value={limit.form.monthlyTokenLimit}
                  onChange={(e) => limit.updateField('monthlyTokenLimit', e.target.value)}
                />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 180 }}>
                <label className="label">{t('dashboard.aiUsage.teacherLimit.dailyTokens')}</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1000"
                  value={limit.form.dailyTokenLimit}
                  onChange={(e) => limit.updateField('dailyTokenLimit', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="field">
            <label className="label">{t('dashboard.aiUsage.teacherLimit.note')}</label>
            <input
              className="input"
              type="text"
              value={limit.form.note}
              onChange={(e) => limit.updateField('note', e.target.value)}
              placeholder={t('dashboard.aiUsage.teacherLimit.notePlaceholder')}
            />
          </div>

          <div className="row gap10 wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={limit.save}
              disabled={limit.saving}
            >
              {limit.saving ? <Spinner size={16} /> : <Icon name="check" size={16} />}
              {t('dashboard.aiUsage.teacherLimit.save')}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={limit.resetToDefault}
              disabled={limit.saving}
            >
              <Icon name="refresh" size={16} />
              {t('dashboard.aiUsage.teacherLimit.resetDefault')}
            </button>
          </div>

          <dl className="col gap8" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <div>
              <dt className="eyebrow">{t('dashboard.aiUsage.teacherLimit.currentUsage')}</dt>
              <dd style={{ margin: '4px 0 0', fontWeight: 650, fontSize: 14 }}>
                {limit.status.unlimited
                  ? t('dashboard.aiUsage.teacherLimit.unlimitedActive')
                  : t('dashboard.aiUsage.teacherLimit.usageSummary', {
                      monthlyUsed: formatTokenCount(limit.status.monthlyUsed),
                      monthlyLimit: formatTokenCount(limit.status.monthlyLimit),
                      dailyUsed: formatTokenCount(limit.status.dailyUsed),
                      dailyLimit: formatTokenCount(limit.status.dailyLimit)
                    })}
              </dd>
            </div>
            {limit.status.blocked && (
              <div>
                <dt className="eyebrow">{t('dashboard.aiUsage.quotaBlocked')}</dt>
                <dd style={{ margin: '4px 0 0', fontWeight: 650, fontSize: 14 }}>{limit.status.blockReason}</dd>
              </div>
            )}
            {limit.status.customOverride && (
              <div>
                <dt className="eyebrow">{t('dashboard.aiUsage.teacherLimit.override')}</dt>
                <dd style={{ margin: '4px 0 0', fontWeight: 650, fontSize: 14 }}>
                  {t('dashboard.aiUsage.teacherLimit.overrideYes')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  )
}

export default AdminTeacherLimitPanel
