import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    const interval = setInterval(() => {
      loadNotifications()
      loadUnreadCount()
    }, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications')
      setNotifications(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
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

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      loadNotifications()
      loadUnreadCount()
    } catch (err) {
      setError('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      loadNotifications()
      loadUnreadCount()
    } catch (err) {
      setError('Failed to mark all as read')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return <div className="loading">Loading notifications...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Notifications {unreadCount > 0 && <span style={{ color: '#e74c3c' }}>({unreadCount} unread)</span>}</h2>
        {unreadCount > 0 && (
          <button className="btn btn-success" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
            No notifications yet
          </p>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-message">{notification.message}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="notification-time">
                    {formatDate(notification.createdAt)} • {notification.type}
                  </div>
                  {!notification.read && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications



