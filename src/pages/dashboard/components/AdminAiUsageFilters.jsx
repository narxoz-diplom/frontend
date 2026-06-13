import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'

const AdminAiUsageFilters = ({ filters, onChange, onApply }) => {
  const { t } = useTranslation()

  return (
    <form
      className="card card-pad"
      onSubmit={(e) => {
        e.preventDefault()
        onApply()
      }}
    >
      <div className="sec-head" style={{ padding: '0 0 12px', marginBottom: 4 }}>
        <h3 className="h3 row gap8">
          <Icon name="filter" size={16} />
          {t('dashboard.aiUsage.applyFilters')}
        </h3>
      </div>
      <div className="row gap12 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="field" style={{ minWidth: 140 }}>
          <label className="label">{t('dashboard.aiUsage.from')}</label>
          <input
            className="input"
            type="date"
            value={filters.from}
            onChange={(e) => onChange('from', e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <label className="label">{t('dashboard.aiUsage.to')}</label>
          <input
            className="input"
            type="date"
            value={filters.to}
            onChange={(e) => onChange('to', e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <label className="label">{t('dashboard.aiUsage.userId')}</label>
          <input
            className="input"
            type="text"
            value={filters.userId}
            onChange={(e) => onChange('userId', e.target.value)}
            placeholder={t('dashboard.aiUsage.userIdPlaceholder')}
          />
        </div>
        <div className="field" style={{ minWidth: 120 }}>
          <label className="label">{t('dashboard.aiUsage.courseId')}</label>
          <input
            className="input"
            type="number"
            min={1}
            value={filters.courseId}
            onChange={(e) => onChange('courseId', e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <label className="label">{t('dashboard.aiUsage.modelId')}</label>
          <input
            className="input"
            type="text"
            value={filters.modelId}
            onChange={(e) => onChange('modelId', e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 130 }}>
          <label className="label">{t('dashboard.aiUsage.provider')}</label>
          <select className="select" value={filters.provider} onChange={(e) => onChange('provider', e.target.value)}>
            <option value="">{t('dashboard.aiUsage.any')}</option>
            <option value="google">google</option>
          </select>
        </div>
        <div className="field" style={{ minWidth: 170 }}>
          <label className="label">{t('dashboard.aiUsage.generationType')}</label>
          <select
            className="select"
            value={filters.generationType}
            onChange={(e) => onChange('generationType', e.target.value)}
          >
            <option value="">{t('dashboard.aiUsage.any')}</option>
            <option value="LESSON_OUTLINE">LESSON_OUTLINE</option>
            <option value="LESSON_FROM_OUTLINE">LESSON_FROM_OUTLINE</option>
            <option value="LESSON_FROM_FILES">LESSON_FROM_FILES</option>
            <option value="QUIZ_GENERATION">QUIZ_GENERATION</option>
          </select>
        </div>
        <div className="field" style={{ minWidth: 130 }}>
          <label className="label">{t('dashboard.aiUsage.status')}</label>
          <select className="select" value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
            <option value="">{t('dashboard.aiUsage.any')}</option>
            <option value="SUCCEEDED">SUCCEEDED</option>
            <option value="FAILED">FAILED</option>
            <option value="RUNNING">RUNNING</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
          <Icon name="check" size={16} />
          {t('dashboard.aiUsage.applyFilters')}
        </button>
      </div>
    </form>
  )
}

export default AdminAiUsageFilters
