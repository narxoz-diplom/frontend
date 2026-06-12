import { useCallback, useEffect, useState } from 'react'
import { getNotifications, markNotificationRead } from '@/shared/api/notificationsApi'

const POLL_INTERVAL_MS = 30000

const useNotificationsPolling = () => {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    const loadNotifications = useCallback(async () => {
        try {
            const response = await getNotifications()
            setNotifications(response.data)
            const count = response.data.filter(n => !n.read).length
            setUnreadCount(count)
        } catch {}
    }, [])

    useEffect(() => {
        loadNotifications()
        const interval = setInterval(loadNotifications, POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [loadNotifications])

    const markRead = useCallback(async (id) => {
        try {
            const notif = notifications.find(n => n.id === id)
            if (notif && notif.read) return

            await markNotificationRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch {}
    }, [notifications])

    return { notifications, unreadCount, markRead }
}

export default useNotificationsPolling
