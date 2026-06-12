import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './alert-ui.css'

const ConfirmModal = ({
  open,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'default',
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation()
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onCancel])

  if (!open) return null

  const confirmIsDanger = variant === 'danger'

  return (
    <div
      className="alert-modal-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="alert-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? 'confirm-modal-title' : 'confirm-modal-desc'}
        aria-describedby={title ? 'confirm-modal-desc' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            confirmIsDanger
              ? 'alert-modal__accent alert-modal__accent--danger'
              : 'alert-modal__accent'
          }
        />
        <div className="alert-modal__body">
          {title && (
            <h2 id="confirm-modal-title" className="alert-modal__title">
              {title}
            </h2>
          )}
          <p id="confirm-modal-desc" className="alert-modal__message">
            {message}
          </p>
        </div>
        <div className="alert-modal__actions">
          <button
            type="button"
            className="alert-modal__btn alert-modal__btn--ghost"
            onClick={onCancel}
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            type="button"
            className={
              confirmIsDanger
                ? 'alert-modal__btn alert-modal__btn--danger'
                : 'alert-modal__btn alert-modal__btn--primary'
            }
            onClick={onConfirm}
            autoFocus
          >
            {confirmText || t('confirmModal.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
