import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'

const ObservedNotification = ({ n, onMarkRead, children }) => {
  const itemRef = useRef(null)

  useEffect(() => {
    if (n.read) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onMarkRead(n.id)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.5 },
    )

    if (itemRef.current) {
      observer.observe(itemRef.current)
    }

    return () => observer.disconnect()
  }, [n.id, n.read, onMarkRead])

  return (
    <div ref={itemRef} className={`popover-item ${!n.read ? 'unread' : ''}`}>
      {children}
    </div>
  )
}

const NotificationPopover = ({ notifications, onMarkRead, onClose }) => {
  const { t, i18n } = useTranslation()

  return (
    <div className="notification-popover">
      <div className="popover-header">
        <span>{t('common.notifications')}</span>
        <Link to="/notifications" onClick={onClose} className="expand-link" aria-label={t('common.viewAll')}>
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>

      <div className="popover-content">
        {notifications.length === 0 ? (
          <div className="popover-empty">{t('notifications.emptyAll')}</div>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <ObservedNotification key={n.id} n={n} onMarkRead={onMarkRead}>
              <div className="popover-item-text">{n.message}</div>
              <div className="popover-item-footer">
                <span className="popover-time">
                  <Icon name="clock" size={13} />
                  {new Date(n.createdAt).toLocaleTimeString(i18n.language || 'ru', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </ObservedNotification>
          ))
        )}
      </div>

      <Link to="/notifications" onClick={onClose} className="popover-footer">
        {t('common.viewAll')}
      </Link>
    </div>
  )
}

export default NotificationPopover
