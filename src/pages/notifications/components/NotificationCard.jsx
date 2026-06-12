import React from 'react'
import {
  FiCheck,
  FiTrash2,
  FiAlertCircle,
  FiInfo,
  FiFileText,
  FiBook,
  FiVideo,
  FiClock
} from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

export const getNotificationColor = (type) => {
  switch (type) {
    case 'COURSE':
      return 'var(--primary-color)'
    case 'LESSON':
      return '#9b59b6'
    case 'FILE_OPERATION':
      return 'var(--success-color)'
    case 'VIDEO':
      return '#e74c3c'
    case 'ALERT':
      return 'var(--warning-color)'
    default:
      return 'var(--text-secondary)'
  }
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'COURSE':
      return <FiBook className="notification-icon" />
    case 'LESSON':
      return <FiBook className="notification-icon" />
    case 'FILE_OPERATION':
      return <FiFileText className="notification-icon" />
    case 'VIDEO':
      return <FiVideo className="notification-icon" />
    case 'ALERT':
      return <FiAlertCircle className="notification-icon" />
    default:
      return <FiInfo className="notification-icon" />
  }
}

const NotificationCard = ({ notification, locale, onMarkRead, onDelete }) => {
  const { t } = useTranslation()

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

    if (diffInSeconds < 60) {
      return t('notificationsPage.justNow')
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return rtf.format(-minutes, 'minute')
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return rtf.format(-hours, 'hour')
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return rtf.format(-days, 'day')
    } else {
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      className={`notification-card ${!notification.read ? 'unread' : ''}`}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div
        className="notification-indicator"
        style={{ backgroundColor: getNotificationColor(notification.type) }}
      />
      <div className="notification-icon-wrapper">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="notification-content">
        <div className="notification-message">
          {notification.message}
        </div>
        <div className="notification-meta">
          <span className="notification-type">{notification.type}</span>
          <span className="notification-time" title={formatDate(notification.createdAt)}>
            <FiClock /> {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>
      <div className="notification-actions">
        {!notification.read && (
          <button
            className="btn-icon btn-mark-read"
            onClick={(e) => onMarkRead(notification.id, e)}
            title={t('notificationsPage.markRead')}
          >
            <FiCheck />
          </button>
        )}
        <button
          className="btn-icon btn-delete"
          onClick={(e) => onDelete(notification.id, e)}
          title={t('common.delete')}
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  )
}

export default NotificationCard
