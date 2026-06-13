import React from 'react'
import { Icon } from '@/shared/ui/Icon'
import { useTranslation } from 'react-i18next'

export const getNotificationColor = (type) => {
  switch (type) {
    case 'COURSE':
      return 'var(--brand)'
    case 'LESSON':
      return 'var(--violet-500, #7c3aed)'
    case 'FILE_OPERATION':
      return 'var(--green-500)'
    case 'VIDEO':
      return 'var(--blue-500, #2563eb)'
    case 'ALERT':
      return 'var(--amber-500, #f59e0b)'
    default:
      return 'var(--text-3)'
  }
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'COURSE':
      return 'book'
    case 'LESSON':
      return 'book'
    case 'FILE_OPERATION':
      return 'file'
    case 'VIDEO':
      return 'video'
    case 'ALERT':
      return 'bell'
    default:
      return 'bell'
  }
}

const NotificationCard = ({ notification, locale, onMarkRead }) => {
  const { t } = useTranslation()
  const color = getNotificationColor(notification.type)
  const iconName = getNotificationIcon(notification.type)

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

    if (diffInSeconds < 60) {
      return t('notificationsPage.justNow')
    }
    if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
    }
    if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
    }
    if (diffInSeconds < 604800) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
    }
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const title = notification.title || notification.message?.split('\n')[0] || notification.type
  const text = notification.message || notification.body || ''

  return (
    <div
      className={`card notif-card${!notification.read ? ' unread' : ''}`}
      onClick={() => !notification.read && onMarkRead(notification.id)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !notification.read) {
          e.preventDefault()
          onMarkRead(notification.id)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <span
        className="notif-ic"
        style={{
          color,
          background: `color-mix(in srgb, ${color} 13%, transparent)`,
        }}
      >
        <Icon name={iconName} size={19} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row between gap10">
          <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
          <span className="dim" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          {text}
        </div>
        {notification.type && (
          <span className="badge" style={{ marginTop: 8, fontSize: 11 }}>
            {notification.type}
          </span>
        )}
      </div>
      {!notification.read && <span className="unread-dot" aria-hidden />}
    </div>
  )
}

export default NotificationCard
