import React from 'react'
import { FiLoader, FiSave, FiRotateCcw, FiSearch } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { formatTokenCount } from '@/shared/lib/aiUsageFormat'
import { useAdminTeacherLimit } from '../hooks/useAdminTeacherLimit'
import '../AdminTeacherLimitPanel.css'

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
    <section className="admin-teacher-limit" aria-labelledby="admin-teacher-limit-title">
      <div className="admin-teacher-limit__head">
        <h3 id="admin-teacher-limit-title">{t('dashboard.aiUsage.teacherLimit.title')}</h3>
        <p>{t('dashboard.aiUsage.teacherLimit.desc')}</p>
      </div>

      <div className="admin-teacher-limit__lookup">
        <label className="admin-teacher-limit__field">
          <span>{t('dashboard.aiUsage.userId')}</span>
          <input
            type="text"
            value={limit.userId}
            onChange={(e) => limit.setUserId(e.target.value)}
            placeholder={t('dashboard.aiUsage.userIdPlaceholder')}
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="admin-teacher-limit__btn admin-teacher-limit__btn--secondary"
          onClick={limit.load}
          disabled={limit.loading || limit.saving}
        >
          {limit.loading ? <FiLoader className="spin" /> : <FiSearch />}
          {t('dashboard.aiUsage.teacherLimit.load')}
        </button>
      </div>

      {errorKey && (
        <p className="admin-teacher-limit__error" role="alert">
          {limit.error && limit.error !== 'user_id_required' && limit.error !== 'invalid_limits'
            ? limit.error
            : t(errorKey)}
        </p>
      )}

      {limit.message === 'saved' && (
        <p className="admin-teacher-limit__success" role="status">
          {t('dashboard.aiUsage.teacherLimit.saved')}
        </p>
      )}
      {limit.message === 'reset' && (
        <p className="admin-teacher-limit__success" role="status">
          {t('dashboard.aiUsage.teacherLimit.resetDone')}
        </p>
      )}

      {limit.status && (
        <div className="admin-teacher-limit__form">
          <label className="admin-teacher-limit__checkbox">
            <input
              type="checkbox"
              checked={limit.form.unlimitedAccess}
              onChange={(e) => limit.updateField('unlimitedAccess', e.target.checked)}
            />
            <span>{t('dashboard.aiUsage.teacherLimit.unlimited')}</span>
          </label>

          {!limit.form.unlimitedAccess && (
            <div className="admin-teacher-limit__limits">
              <label className="admin-teacher-limit__field">
                <span>{t('dashboard.aiUsage.teacherLimit.monthlyTokens')}</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={limit.form.monthlyTokenLimit}
                  onChange={(e) => limit.updateField('monthlyTokenLimit', e.target.value)}
                />
              </label>
              <label className="admin-teacher-limit__field">
                <span>{t('dashboard.aiUsage.teacherLimit.dailyTokens')}</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={limit.form.dailyTokenLimit}
                  onChange={(e) => limit.updateField('dailyTokenLimit', e.target.value)}
                />
              </label>
            </div>
          )}

          <label className="admin-teacher-limit__field admin-teacher-limit__field--full">
            <span>{t('dashboard.aiUsage.teacherLimit.note')}</span>
            <input
              type="text"
              value={limit.form.note}
              onChange={(e) => limit.updateField('note', e.target.value)}
              placeholder={t('dashboard.aiUsage.teacherLimit.notePlaceholder')}
            />
          </label>

          <div className="admin-teacher-limit__actions">
            <button
              type="button"
              className="admin-teacher-limit__btn admin-teacher-limit__btn--primary"
              onClick={limit.save}
              disabled={limit.saving}
            >
              {limit.saving ? <FiLoader className="spin" /> : <FiSave />}
              {t('dashboard.aiUsage.teacherLimit.save')}
            </button>
            <button
              type="button"
              className="admin-teacher-limit__btn admin-teacher-limit__btn--ghost"
              onClick={limit.resetToDefault}
              disabled={limit.saving}
            >
              <FiRotateCcw />
              {t('dashboard.aiUsage.teacherLimit.resetDefault')}
            </button>
          </div>

          <dl className="admin-teacher-limit__usage">
            <div>
              <dt>{t('dashboard.aiUsage.teacherLimit.currentUsage')}</dt>
              <dd>
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
                <dt>{t('dashboard.aiUsage.quotaBlocked')}</dt>
                <dd>{limit.status.blockReason}</dd>
              </div>
            )}
            {limit.status.customOverride && (
              <div>
                <dt>{t('dashboard.aiUsage.teacherLimit.override')}</dt>
                <dd>{t('dashboard.aiUsage.teacherLimit.overrideYes')}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  )
}

export default AdminTeacherLimitPanel
