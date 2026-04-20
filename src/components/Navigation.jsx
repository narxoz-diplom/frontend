import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    FiHome, FiBook, FiBell, FiLogOut,
    FiMenu, FiX, FiBookOpen, FiChevronLeft, FiChevronRight,
    FiSearch, FiUser, FiSettings, FiSun, FiMoon, FiMonitor,
    FiBarChart2, FiFolder, FiCpu, FiEdit3, FiGlobe
} from 'react-icons/fi'
import auth from '../config/auth'
import api from '../services/api'
import { isAdmin } from '../utils/roles'
import { useTranslation } from 'react-i18next'
import { setLang } from '../i18n'
import NotificationPopover from './NotificationPopover'
import "./Navigation.css"

const LANG_OPTIONS = [
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
    { code: 'kz', label: 'KZ' },
]

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
    const notifRef = useRef(null); // Реф для закрытия кликом вне

    // --- Логика Темы ---
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
    const [profileOpen, setProfileOpen] = useState(false)
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

    // Закрытие уведомлений при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    useEffect(() => {
        const kc = window.keycloak || auth
        if (kc?.tokenParsed) {
            setUserName(kc.tokenParsed.preferred_username || kc.tokenParsed.name || 'User')
        }
    }, [])

    useEffect(() => {
        setMobileOpen(false)
        setShowNotifications(false)
        setProfileOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (!profileOpen) return
        const close = (e) => {
            if (!e.target.closest('.top-profile-section')) setProfileOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setProfileOpen(false)
        }
        document.addEventListener('mousedown', close)
        document.addEventListener('touchstart', close, { passive: true })
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('touchstart', close)
            document.removeEventListener('keydown', onKey)
        }
    }, [profileOpen])

    const handleLogout = useCallback(() => {
        const kc = window.keycloak || auth
        kc?.logout ? kc.logout() : auth.logout()
    }, [])

    const handleMarkRead = async (id) => {
        try {
            // Чтобы не спамить запросами, если уже прочитано
            const notif = notifications.find(n => n.id === id);
            if (notif && notif.read) return;

            await api.put(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error(err)
        }
    }

    const currentLang = (i18n.language || 'ru').split('-')[0]

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
    }

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)')
        const syncNavForMobile = () => {
            if (!mq.matches) return
            setIsCollapsed(false)
            document.documentElement.style.setProperty('--nav-width', '250px')
        }
        syncNavForMobile()
        mq.addEventListener('change', syncNavForMobile)
        return () => mq.removeEventListener('change', syncNavForMobile)
    }, [])

    return (
        <>
            <header className={`top-navbar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="top-search">
                    <FiSearch className="search-icon" />
                    <input type="text" placeholder={t('common.search')} />
                </div>

                <div className="top-right-actions">
                    <div
                        className="lang-switcher"
                        role="group"
                        aria-label={t('lang')}
                        title={t('lang')}
                    >
                        <span className="lang-switcher__globe" aria-hidden>
                            <FiGlobe />
                        </span>
                        <div className="lang-switcher__track">
                            {LANG_OPTIONS.map(({ code, label }) => (
                                <button
                                    key={code}
                                    type="button"
                                    className={`lang-switcher__btn ${currentLang === code ? 'is-active' : ''}`}
                                    onClick={() => setLang(code)}
                                    aria-pressed={currentLang === code}
                                    aria-label={t(code)}
                                    title={t(code)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        className="top-action-btn theme-toggle-btn"
                        onClick={toggleTheme}
                        title={`Режим: ${theme}`}
                    >
                        {getThemeIcon()}
                    </button>

                    <div className="notif-wrapper" ref={notifRef}>
                        <button
                            className={`top-action-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                            title={t('nav.notifications')}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FiBell />
                            {unreadCount > 0 && <span className="notification-badge" />}
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
                        <div className={`top-avatar-container ${profileOpen ? 'dropdown-open' : ''}`}>
                            <button
                                type="button"
                                className="top-avatar"
                                onClick={() => setProfileOpen((v) => !v)}
                                aria-expanded={profileOpen}
                                aria-haspopup="true"
                                aria-label={t('nav.profile')}
                            >
                                {userName.charAt(0).toUpperCase()}
                            </button>
                            <div className="top-dropdown" role="menu">
                                <Link to="/profile" role="menuitem" onClick={() => setProfileOpen(false)}><FiUser /> {t('nav.profile')}</Link>
                                <Link to="/settings" role="menuitem" onClick={() => setProfileOpen(false)}><FiSettings /> {t('nav.settings')}</Link>
                                <hr />
                                <button type="button" onClick={() => { setProfileOpen(false); handleLogout() }} className="logout-btn-dropdown">
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