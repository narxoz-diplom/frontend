import React from 'react'
import { useTranslation } from 'react-i18next'

const STATUS_CLASS = {
  published: 'badge-published',
  draft: 'badge-draft',
  archived: 'badge-archived',
  PUBLISHED: 'badge-published',
  DRAFT: 'badge-draft',
  ARCHIVED: 'badge-archived',
}

export default function StatusBadge({ status, t: tProp }) {
  const { t: tHook } = useTranslation()
  const t = tProp || tHook
  const normalized = String(status || '').toLowerCase()
  const labelKey = `status.${normalized}`
  const label = t(labelKey, { defaultValue: status })

  return (
    <span className={`badge ${STATUS_CLASS[status] || STATUS_CLASS[normalized] || ''}`}>
      <span className="dot" />
      {label}
    </span>
  )
}
