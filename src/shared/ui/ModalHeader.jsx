import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/Icon'

export default function ModalHeader({ title, subtitle, onClose, icon, iconBg, closeLabel }) {
  const { t } = useTranslation()

  return (
    <div className="modal-head">
      <div className="row gap12" style={{ alignItems: 'center' }}>
        {icon && (
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              display: 'grid',
              placeItems: 'center',
              background: iconBg || 'var(--brand-tint)',
              color: iconBg ? '#fff' : 'var(--brand)',
            }}
          >
            <Icon name={icon} size={20} />
          </span>
        )}
        <div>
          <div className="h3" style={{ fontSize: 17 }}>{title}</div>
          {subtitle && (
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn btn-icon btn-ghost btn-sm"
          onClick={onClose}
          aria-label={closeLabel || t('courseEdit.closeLabel')}
        >
          <Icon name="x" size={18} />
        </button>
      )}
    </div>
  )
}
