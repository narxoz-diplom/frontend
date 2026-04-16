import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    FiHome, FiBook, FiBell, FiLogOut,
    FiMenu, FiX, FiBookOpen, FiChevronLeft, FiChevronRight,
    FiSearch, FiUser, FiSettings, FiSun, FiMoon, FiMonitor,
    FiBarChart2, FiFolder, FiCpu, FiEdit3
} from 'react-icons/fi'
import auth from '../config/auth'
import api from '../services/api'
import { isAdmin } from '../utils/roles'
import { useTranslation } from 'react-i18next'
import { setLang } from '../i18n'
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
    const { t, i18n } = useTranslation()
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
            console.error('Failed to load notifications', err)
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
                    <input type="text" placeholder={t('common.search')} />
                </div>

                <div className="top-right-actions">
                    <label className="top-lang-select" title={t('lang')}>
                        <span className="sr-only">{t('lang')}</span>
                        <select
                            value={i18n.language}
                            onChange={(e) => setLang(e.target.value)}
                            aria-label={t('lang')}
                        >
                            <option value="kz">{t('kz')}</option>
                            <option value="ru">{t('ru')}</option>
                            <option value="en">{t('en')}</option>
                        </select>
                    </label>
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
                            title={t('nav.notifications')}
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
                                <Link to="/profile"><FiUser /> {t('nav.profile')}</Link>
                                <Link to="/settings"><FiSettings /> {t('nav.settings')}</Link>
                                <hr />
                                <button onClick={handleLogout} className="logout-btn-dropdown">
                                    <FiLogOut /> {t('nav.logout')}
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
                    <NavItem to="/" icon={<FiHome />} label={t('nav.home')} isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/courses" icon={<FiBook />} label={t('nav.courses')} isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/stats" icon={<FiBarChart2 />} label={t('nav.stats')} isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/files" icon={<FiFolder />} label={t('nav.files')} isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/rag" icon={<FiCpu />} label={t('nav.rag')} isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/notifications" icon={<FiBell />} label={t('nav.notifications')} isActive={isActive} isCollapsed={isCollapsed} />
                    {isAdmin(window.keycloak || auth) && (
                        <NavItem
                            to="/admin/news"
                            icon={<FiEdit3 />}
                            label={t('nav.adminNews')}
                            isActive={isActive}
                            isCollapsed={isCollapsed}
                        />
                    )}
                </div>

                <div className="nav-footer">
                    <button
                        className="btn-logout-sidebar"
                        onClick={handleLogout}
                        title={t('nav.logout')}
                    >
                        <FiLogOut className="nav-icon" />
                        {!isCollapsed && <span className="nav-label">{t('nav.logout')}</span>}
                    </button>
                </div>
            </nav>
        </>
    )
}

export default Navigation