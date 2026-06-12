import React from 'react'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import './auth-alert.css'

const AuthAlert = ({ variant = 'error', title, message }) => {
  if (!message) return null

  const Icon = variant === 'success' ? FiCheckCircle : FiAlertCircle

  return (
    <div
      className={`auth-alert auth-alert--${variant}`}
      role={variant === 'success' ? 'status' : 'alert'}
      aria-live="polite"
    >
      <span className="auth-alert__icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="auth-alert__content">
        {title && <strong className="auth-alert__title">{title}</strong>}
        <p className="auth-alert__message">{message}</p>
      </div>
    </div>
  )
}

export default AuthAlert
