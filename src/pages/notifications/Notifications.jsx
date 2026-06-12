import React, { useState, useEffect } from 'react'
import {
  FiBell,
  FiCheckCircle,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} from '@/shared/api/notificationsApi'
import { useAlert } from '@/app/providers/AlertProvider'
import { useTranslation } from 'react-i18next'
import NotificationCard, { getNotificationColor } from './components/NotificationCard'
import './Notifications.css'

const REFRESH_INTERVAL_MS = 10000

const Notifications = () => {
  const { t, i18n } = useTranslation()
  const { confirm } = useAlert()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const locale = i18n.language === 'kz' ? 'kk-KZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    const interval = setInterval(() => {
      loadNotifications(true)
      loadUnreadCount()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const response = await getNotifications()
      setNotifications(response.data)
      setError(null)
    } catch (err) {
      setError(t('notificationsPage.loadError'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCount()
      setUnreadCount(response.data.count)
    } catch {}
  }

  const handleMarkAsRead = async (id, e) => {
    if (e) {
      e.stopPropagation()
    }
    try {
      await markNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      loadUnreadCount()
    } catch (err) {
      setError(t('notificationsPage.markReadError'))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(t('notificationsPage.markAllError'))
    }
  }

  const handleDelete = async (id, e) => {
    if (e) {
      e.stopPropagation()
    }
    const ok = await confirm({
      title: t('notificationsPage.deleteTitle'),
      message: t('notificationsPage.deleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const groupNotificationsByDate = (items) => {
    const groups = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    items.forEach(notification => {
      const date = new Date(notification.createdAt)
      date.setHours(0, 0, 0, 0)

      let groupKey
      if (date.getTime() === today.getTime()) {
        groupKey = t('notificationsPage.today')
      } else if (date.getTime() === today.getTime() - 86400000) {
        groupKey = t('notificationsPage.yesterday')
      } else {
        groupKey = date.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        })
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })

    return groups
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false
    if (filter === 'read' && !notification.read) return false
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    return true
  })

  const uniqueTypes = [...new Set(notifications.map(n => n.type))]

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading">{t('common.loading')}</div>
      </div>
    )
  }

  const groupedNotifications = groupNotificationsByDate(filteredNotifications)

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="notifications-header-left">
          <div className="notifications-title-section">
            <FiBell className="notifications-title-icon" />
            <h1>{t('notificationsPage.title')}</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
        </div>
        <div className="notifications-header-actions">
          <button
            className="btn-icon"
            onClick={() => loadNotifications()}
            title={t('common.refresh')}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
          </button>
          {unreadCount > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleMarkAllAsRead}
            >
              <FiCheckCircle /> {t('notificationsPage.markAllRead')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="notifications-filters">
        <div className="filter-group">
          <span className="filter-label">
            <FiFilter /> {t('notificationsPage.status')}:
          </span>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('notificationsPage.all')}
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              {t('notificationsPage.unread')} {notifications.filter(n => !n.read).length > 0 &&
                `(${notifications.filter(n => !n.read).length})`}
            </button>
            <button
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              {t('notificationsPage.read')}
            </button>
          </div>
        </div>

        {uniqueTypes.length > 0 && (
          <div className="filter-group">
            <span className="filter-label">{t('notificationsPage.type')}:</span>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                {t('notificationsPage.allTypes')}
              </button>
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    borderLeft: `3px solid ${getNotificationColor(type)}`
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="notifications-content">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FiBell className="empty-icon" />
            <h3>{t('notificationsPage.emptyTitle')}</h3>
            <p>
              {filter === 'unread'
                ? t('notificationsPage.emptyUnread')
                : t('notificationsPage.emptyAll')}
            </p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
            <div key={dateGroup} className="notification-group">
              <div className="notification-group-header">
                <span className="group-date">{dateGroup}</span>
                <span className="group-count">{groupNotifications.length}</span>
              </div>
              <div className="notifications-list">
                {groupNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    locale={locale}
                    onMarkRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Notifications
