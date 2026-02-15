import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiMaximize2, FiCheck } from 'react-icons/fi';

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
                        <div key={n.id} className={`popover-item ${!n.read ? 'unread' : ''}`}>
                            <div className="popover-item-text">{n.message}</div>
                            <div className="popover-item-footer">
                                <span className="popover-time"><FiClock /> {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {!n.read && (
                                    <button onClick={() => onMarkRead(n.id)} className="popover-read-btn">
                                        <FiCheck />
                                    </button>
                                )}
                            </div>
                        </div>
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