import React, { useState, useEffect } from 'react'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/shared/api/notificationsApi'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner, EmptyState } from '@/shared/ui/academis'
import NotificationCard from './components/NotificationCard'
import '../secondary-academis.css'

const REFRESH_INTERVAL_MS = 10000

const Notifications = () => {
  const { t, i18n } = useTranslation()
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
    } catch {
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
    } catch {
      /* ignore */
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      loadUnreadCount()
    } catch {
      setError(t('notificationsPage.markReadError'))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      setError(t('notificationsPage.markAllError'))
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread' && notification.read) return false
    if (filter === 'read' && !notification.read) return false
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    return true
  })

  const uniqueTypes = [...new Set(notifications.map((n) => n.type).filter(Boolean))]

  const statusTabs = [
    ['all', t('notificationsPage.all')],
    ['unread', t('notificationsPage.unread')],
    ['read', t('notificationsPage.read')],
  ]

  if (loading) {
    return (
      <div className="page notif-page secondary-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <div className="page notif-page">
      <PageHeader
        title={t('notificationsPage.title')}
        subtitle={
          unreadCount > 0
            ? `${unreadCount} ${t('notificationsPage.unread').toLowerCase()}`
            : t('notificationsPage.emptyAll')
        }
        actions={(
          <div className="row gap8">
            <button
              type="button"
              className="btn btn-icon btn-outline btn-sm"
              onClick={() => loadNotifications()}
              disabled={refreshing}
              title={t('common.refresh')}
            >
              <span className={refreshing ? 'spin' : ''} style={{ display: 'inline-flex' }}>
                <Icon name="refresh" size={16} />
              </span>
            </button>
            {unreadCount > 0 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={handleMarkAllAsRead}>
                <Icon name="check" size={15} />
                {t('notificationsPage.markAllRead')}
              </button>
            )}
          </div>
        )}
      />

      {error && (
        <div className="secondary-flash secondary-flash--error" role="alert">
          {error}
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {statusTabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tab${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            {key === 'unread' && notifications.filter((n) => !n.read).length > 0
              ? ` (${notifications.filter((n) => !n.read).length})`
              : ''}
          </button>
        ))}
      </div>

      {uniqueTypes.length > 0 && (
        <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`tab${typeFilter === 'all' ? ' active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            {t('notificationsPage.allTypes')}
          </button>
          {uniqueTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`tab${typeFilter === type ? ' active' : ''}`}
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="bell"
            title={t('notificationsPage.emptyTitle')}
            desc={
              filter === 'unread'
                ? t('notificationsPage.emptyUnread')
                : t('notificationsPage.emptyAll')
            }
          />
        </div>
      ) : (
        <div className="col gap10">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              locale={locale}
              onMarkRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
