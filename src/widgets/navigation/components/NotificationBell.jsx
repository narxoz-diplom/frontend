import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
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

    return (
        <div className="notif-wrapper" ref={notifRef}>
            <button
                className={`top-action-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                title={t('nav.notifications')}
                onClick={() => setShowNotifications(!showNotifications)}
            >
                <FiBell />
                {unreadCount > 0 && <span className="notification-badge" />}
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
