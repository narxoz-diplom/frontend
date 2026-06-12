import React from 'react'
import { useTranslation } from 'react-i18next'

const AdminAiUsageFilters = ({ filters, onChange, onApply }) => {
  const { t } = useTranslation()

  return (
    <form
      className="ai-usage-filters"
      onSubmit={(e) => {
        e.preventDefault()
        onApply()
      }}
    >
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.from')}</span>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onChange('from', e.target.value)}
        />
      </label>
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.to')}</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onChange('to', e.target.value)}
        />
      </label>
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.userId')}</span>
        <input
          type="text"
          value={filters.userId}
          onChange={(e) => onChange('userId', e.target.value)}
          placeholder={t('dashboard.aiUsage.userIdPlaceholder')}
        />
      </label>
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.courseId')}</span>
        <input
          type="number"
          min={1}
          value={filters.courseId}
          onChange={(e) => onChange('courseId', e.target.value)}
        />
      </label>
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.modelId')}</span>
        <input
          type="text"
          value={filters.modelId}
          onChange={(e) => onChange('modelId', e.target.value)}
        />
      </label>
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.provider')}</span>
        <select value={filters.provider} onChange={(e) => onChange('provider', e.target.value)}>
          <option value="">{t('dashboard.aiUsage.any')}</option>
          <option value="google">google</option>
        </select>
      </label>
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.generationType')}</span>
        <select
          value={filters.generationType}
          onChange={(e) => onChange('generationType', e.target.value)}
        >
          <option value="">{t('dashboard.aiUsage.any')}</option>
          <option value="LESSON_OUTLINE">LESSON_OUTLINE</option>
          <option value="LESSON_FROM_OUTLINE">LESSON_FROM_OUTLINE</option>
          <option value="LESSON_FROM_FILES">LESSON_FROM_FILES</option>
          <option value="QUIZ_GENERATION">QUIZ_GENERATION</option>
        </select>
      </label>
      <label className="ai-usage-filters__field">
        <span>{t('dashboard.aiUsage.status')}</span>
        <select value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">{t('dashboard.aiUsage.any')}</option>
          <option value="SUCCEEDED">SUCCEEDED</option>
          <option value="FAILED">FAILED</option>
          <option value="RUNNING">RUNNING</option>
          <option value="PENDING">PENDING</option>
        </select>
      </label>
      <button type="submit" className="btn btn-primary ai-usage-filters__apply">
        {t('dashboard.aiUsage.applyFilters')}
      </button>
    </form>
  )
}

export default AdminAiUsageFilters
