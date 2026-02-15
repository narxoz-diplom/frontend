import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    FiHome, FiBook, FiFolder, FiBell, FiLogOut,
    FiMenu, FiX, FiBookOpen, FiLayers, FiChevronLeft, FiChevronRight,
    FiSearch, FiUser, FiSettings
} from 'react-icons/fi'
import auth from '../config/auth'
import api from '../services/api' // Добавь импорт своего API
import NotificationPopover from './NotificationPopover' // Путь к твоему компоненту
import "./Navigation.css"

const ADMIN_ROLES = ['admin', 'teacher', 'ROLE_ADMIN', 'ROLE_TEACHER']

const NavItem = ({ to, icon, label, isActive, isCollapsed, className = '' }) => {
    return (
        <Link
            to={to}
            className={`nav-link ${isActive(to) ? 'active' : ''} ${className}`}
            title={isCollapsed ? label : ''}
        >
            {icon && <span className="nav-icon">{icon}</span>}
            {!isCollapsed && <span className="nav-label">{label}</span>}
        </Link>
    )
}

const Navigation = ({ userRoles = [] }) => {
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [userName, setUserName] = useState('User')

    // Состояния для уведомлений
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    const canAccessRag = useMemo(
        () => userRoles.some((role) => ADMIN_ROLES.includes(role)),
        [userRoles]
    )

    // Загрузка уведомлений
    const loadNotifications = useCallback(async () => {
        try {
            const response = await api.get('/notifications')
            setNotifications(response.data)
            const count = response.data.filter(n => !n.read).length
            setUnreadCount(count)
        } catch (err) {
            console.error('Ошибка загрузки уведомлений', err)
        }
    }, [])

    useEffect(() => {
        loadNotifications()
        const interval = setInterval(loadNotifications, 30000) // Обновлять каждые 30 сек
        return () => clearInterval(interval)
    }, [loadNotifications])

    useEffect(() => {
        const kc = window.keycloak || auth
        if (kc?.tokenParsed) {
            setUserName(kc.tokenParsed.preferred_username || kc.tokenParsed.name || 'User')
        }
    }, [])

    useEffect(() => {
        setMobileOpen(false)
        setShowNotifications(false) // Закрывать уведомления при смене страницы
    }, [location.pathname])

    const handleLogout = useCallback(() => {
        const kc = window.keycloak || auth
        kc?.logout ? kc.logout() : auth.logout()
    }, [])

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error(err)
        }
    }

    const isActive = useCallback(
        (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path),
        [location.pathname]
    )

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        document.documentElement.style.setProperty('--nav-width', newState ? '80px' : '250px');
    };

    return (
        <>
            <header className={`top-navbar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="top-search">
                    <FiSearch className="search-icon" />
                    <input type="text" placeholder="Поиск материалов..." />
                </div>

                <div className="top-right-actions">
                    {/* Контейнер уведомлений */}
                    <div className="notif-wrapper" style={{ position: 'relative' }}>
                        <button
                            className={`top-action-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                            title="Уведомления"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FiBell />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </button>

                        {showNotifications && (
                            <>
                                {/* Прозрачная подложка для закрытия при клике вне окна */}
                                <div
                                    // style={{ position: 'fixed', inset: 0, z-index: 998 }}
                                    onClick={() => setShowNotifications(false)}
                                />
                                <NotificationPopover
                                    notifications={notifications}
                                    onMarkRead={handleMarkRead}
                                    onClose={() => setShowNotifications(false)}
                                />
                            </>
                        )}
                    </div>

                    <div className="top-profile-section">
                        <div className="top-user-info">
                            <span className="top-user-name">{userName}</span>
                            <span className="top-user-role">{[...new Set(userRoles)].join(', ')}</span>
                        </div>
                        <div className="top-avatar-container">
                            <div className="top-avatar">{userName.charAt(0).toUpperCase()}</div>
                            <div className="top-dropdown">
                                <Link to="/profile"><FiUser /> Профиль</Link>
                                <Link to="/settings"><FiSettings /> Настройки</Link>
                                <hr />
                                <button onClick={handleLogout} className="logout-btn-dropdown">
                                    <FiLogOut /> Выйти
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Остальной код Navigation (button.mobile-menu-toggle, nav и т.д.) без изменений */}
            <button className="mobile-menu-toggle" onClick={() => setMobileOpen((prev) => !prev)}>
                {mobileOpen ? <FiX /> : <FiMenu />}
            </button>

            <div className={`mobile-menu-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />

            <nav className={`main-nav ${mobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="nav-brand">
                    <Link to="/" className="brand-link">
                        <span className="brand-icon"><FiBookOpen /></span>
                        {!isCollapsed && <span className="brand-text">Academis</span>}
                    </Link>
                </div>

                <button className="collapse-btn" onClick={toggleCollapse}>
                    {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                </button>

                <div className="nav-links">
                    <NavItem to="/" icon={<FiHome />} label="Dashboard" isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/courses" icon={<FiBook />} label="Courses" isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/files" icon={<FiFolder />} label="Files" isActive={isActive} isCollapsed={isCollapsed} />
                    {canAccessRag && (
                        <NavItem to="/rag" icon={<FiLayers />} label="RAG / Модули" isActive={isActive} isCollapsed={isCollapsed} />
                    )}
                </div>

                <div className="nav-footer">
                    <button
                        className="btn-logout-sidebar"
                        onClick={handleLogout}
                        title="Выйти из системы"
                    >
                        <FiLogOut className="nav-icon" />
                        {!isCollapsed && <span className="nav-label">Выход</span>}
                    </button>
                </div>
            </nav>
        </>
    )
}

export default Navigation