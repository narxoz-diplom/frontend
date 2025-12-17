import React, { useState, useEffect } from 'react'
import { 
  FiBell, 
  FiCheck, 
  FiCheckCircle, 
  FiX, 
  FiFilter,
  FiTrash2,
  FiAlertCircle,
  FiInfo,
  FiFileText,
  FiBook,
  FiVideo,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi'
import api from '../services/api'
import './Notifications.css'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all') // 'all', 'COURSE', 'LESSON', 'FILE_OPERATION', etc.
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    const interval = setInterval(() => {
      loadNotifications(true)
      loadUnreadCount()
    }, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      
      const response = await api.get('/notifications')
      setNotifications(response.data)
      setError(null)
    } catch (err) {
      setError('Не удалось загрузить уведомления')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count')
      setUnreadCount(response.data.count)
    } catch (err) {
      console.error('Failed to load unread count', err)
    }
  }

  const handleMarkAsRead = async (id, e) => {
    if (e) {
      e.stopPropagation()
    }
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      loadUnreadCount()
    } catch (err) {
      setError('Не удалось отметить уведомление как прочитанное')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError('Не удалось отметить все как прочитанные')
    }
  }

  const handleDelete = async (id, e) => {
    if (e) {
      e.stopPropagation()
    }
    if (!window.confirm('Удалить это уведомление?')) {
      return
    }
    try {
      // Если нет эндпоинта для удаления, просто скрываем из списка
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      setError('Не удалось удалить уведомление')
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

  const getNotificationColor = (type) => {
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

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return 'только что'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} назад`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const groupNotificationsByDate = (notifications) => {
    const groups = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt)
      date.setHours(0, 0, 0, 0)
      
      let groupKey
      if (date.getTime() === today.getTime()) {
        groupKey = 'Сегодня'
      } else if (date.getTime() === today.getTime() - 86400000) {
        groupKey = 'Вчера'
      } else {
        groupKey = date.toLocaleDateString('ru-RU', { 
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
        <div className="loading">Загрузка уведомлений...</div>
      </div>
    )
  }

  const groupedNotifications = groupNotificationsByDate(filteredNotifications)

  return (
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-left">
          <div className="notifications-title-section">
            <FiBell className="notifications-title-icon" />
            <h1>Уведомления</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
        </div>
        <div className="notifications-header-actions">
          <button
            className="btn-icon"
            onClick={() => loadNotifications()}
            title="Обновить"
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
          </button>
          {unreadCount > 0 && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleMarkAllAsRead}
            >
              <FiCheckCircle /> Отметить все как прочитанные
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Filters */}
      <div className="notifications-filters">
        <div className="filter-group">
          <span className="filter-label">
            <FiFilter /> Статус:
          </span>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Непрочитанные {notifications.filter(n => !n.read).length > 0 && 
                `(${notifications.filter(n => !n.read).length})`}
            </button>
            <button
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Прочитанные
            </button>
          </div>
        </div>
        
        {uniqueTypes.length > 0 && (
          <div className="filter-group">
            <span className="filter-label">Тип:</span>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                Все типы
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

      {/* Notifications List */}
      <div className="notifications-content">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FiBell className="empty-icon" />
            <h3>Нет уведомлений</h3>
            <p>
              {filter === 'unread' 
                ? 'У вас нет непрочитанных уведомлений' 
                : 'У вас пока нет уведомлений'}
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
                  <div
                    key={notification.id}
                    className={`notification-card ${!notification.read ? 'unread' : ''}`}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
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
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Отметить как прочитанное"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Удалить"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
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
