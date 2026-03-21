import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    FiHome, FiBook, FiBell, FiLogOut,
    FiMenu, FiX, FiBookOpen, FiChevronLeft, FiChevronRight,
    FiSearch, FiUser, FiSettings, FiSun, FiMoon, FiMonitor,
    FiBarChart2, FiFolder, FiCpu
} from 'react-icons/fi'
import auth from '../config/auth'
import api from '../services/api'
import NotificationPopover from './NotificationPopover'
import "./Navigation.css"

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

    // --- Логика Темы (Light -> Dark -> System) ---
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });

    useEffect(() => {
        const applyTheme = () => {
            const root = document.body;
            root.classList.remove('dark-mode');

            if (theme === 'dark') {
                root.classList.add('dark-mode');
            } else if (theme === 'system') {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark-mode');
                }
            }
        };

        applyTheme();
        localStorage.setItem('theme', theme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
            if (theme === 'system') applyTheme();
        };

        mediaQuery.addEventListener('change', handleSystemChange);
        return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light';
        });
    };

    const getThemeIcon = () => {
        if (theme === 'light') return <FiSun />;
        if (theme === 'dark') return <FiMoon />;
        return <FiMonitor />;
    };

    // --- Уведомления ---
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

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
        const interval = setInterval(loadNotifications, 30000)
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
        setShowNotifications(false)
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
        (path) => {
            if (path === '/') {
                return location.pathname === '/'
            }
            return location.pathname === path || location.pathname.startsWith(`${path}/`)
        },
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
                    <button
                        className="top-action-btn theme-toggle-btn"
                        onClick={toggleTheme}
                        title={`Режим: ${theme}`}
                    >
                        {getThemeIcon()}
                    </button>

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
                                <div className="notif-overlay-mobile" onClick={() => setShowNotifications(false)} />
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
                    <NavItem to="/" icon={<FiHome />} label="Главная" isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/courses" icon={<FiBook />} label="Курсы" isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/stats" icon={<FiBarChart2 />} label="Статистика" isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/files" icon={<FiFolder />} label="Файлы" isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/rag" icon={<FiCpu />} label="Поиск (RAG)" isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/notifications" icon={<FiBell />} label="Уведомления" isActive={isActive} isCollapsed={isCollapsed} />
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