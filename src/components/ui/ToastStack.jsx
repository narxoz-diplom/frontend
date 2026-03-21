import React from 'react'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'
import './alert-ui.css'

const icons = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo
}

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts?.length) return null

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => {
        const Icon = icons[t.type] || FiInfo
        const iconClass =
          t.type === 'success'
            ? 'toast__icon toast__icon--success'
            : t.type === 'error'
              ? 'toast__icon toast__icon--error'
              : 'toast__icon toast__icon--info'
        return (
          <div
            key={t.id}
            className={`toast toast--${t.type || 'info'}`}
            role="status"
          >
            <Icon className={iconClass} aria-hidden />
            <span className="toast__text">{t.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => onDismiss(t.id)}
              aria-label="Закрыть"
            >
              <FiX size={18} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastStack
