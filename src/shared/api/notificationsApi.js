import api from './client'

export const getNotifications = () => api.get('/notifications')
export const getUnreadCount = () => api.get('/notifications/unread/count')
export const markNotificationRead = (notificationId) =>
  api.put(`/notifications/${notificationId}/read`)
export const markAllNotificationsRead = () => api.put('/notifications/read-all')
