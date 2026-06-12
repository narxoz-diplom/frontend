import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiMaximize2 } from 'react-icons/fi';

const ObservedNotification = ({ n, onMarkRead, children }) => {
    const itemRef = useRef(null);

    useEffect(() => {
        if (n.read) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onMarkRead(n.id);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.5 }
        );

        if (itemRef.current) {
            observer.observe(itemRef.current);
        }

        return () => observer.disconnect();
    }, [n.id, n.read, onMarkRead]);

    return (
        <div ref={itemRef} className={`popover-item ${!n.read ? 'unread' : ''}`}>
            {children}
        </div>
    );
};

const NotificationPopover = ({ notifications, onMarkRead, onClose }) => {
    return (
        <div className="notification-popover">
            <div className="popover-header">
                <span>Уведомления</span>
                <Link to="/notifications" onClick={onClose} className="expand-link">
                    <FiMaximize2 />
                </Link>
            </div>

            <div className="popover-content">
                {notifications.length === 0 ? (
                    <div className="popover-empty">Нет новых уведомлений</div>
                ) : (
                    notifications.slice(0, 5).map(n => (
                        <ObservedNotification key={n.id} n={n} onMarkRead={onMarkRead}>
                            <div className="popover-item-text">{n.message}</div>
                            <div className="popover-item-footer">
                                <span className="popover-time">
                                    <FiClock /> {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </ObservedNotification>
                    ))
                )}
            </div>

            <Link to="/notifications" onClick={onClose} className="popover-footer">
                Показать все
            </Link>
        </div>
    );
};

export default NotificationPopover;
