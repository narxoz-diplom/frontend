import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
import NotificationPopover from '../NotificationPopover'
import useNotificationsPolling from '../hooks/useNotificationsPolling'

const NotificationBell = () => {
  const location = useLocation()
  const { t } = useTranslation()
  const notifRef = useRef(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const { notifications, unreadCount, markRead } = useNotificationsPolling()

  useEffect(() => {
    setShowNotifications(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount
  const title = unreadCount > 0
    ? `${t('nav.notifications')} (${badgeLabel})`
    : t('nav.notifications')
  const ariaLabel = unreadCount > 0
    ? `${t('nav.notifications')}: ${badgeLabel}`
    : t('nav.notifications')

  return (
    <div className="notif-wrapper" ref={notifRef}>
      <button
        type="button"
        className="btn btn-icon btn-ghost btn-sm topbar-icon-btn tb-btn"
        title={title}
        aria-label={ariaLabel}
        onClick={() => setShowNotifications((value) => !value)}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 && <span className="tb-dot" aria-hidden />}
      </button>

      {showNotifications && (
        <>
          <div className="notif-overlay-mobile" onClick={() => setShowNotifications(false)} />
          <NotificationPopover
            notifications={notifications}
            onMarkRead={markRead}
            onClose={() => setShowNotifications(false)}
          />
        </>
      )}
    </div>
  )
}

export default NotificationBell
