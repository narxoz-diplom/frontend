import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    FiHome, FiBook, FiBell, FiLogOut,
    FiMenu, FiX, FiBookOpen, FiChevronLeft, FiChevronRight,
    FiSearch, FiUser, FiSettings, FiSun, FiMoon, FiMonitor,
    FiBarChart2, FiFolder, FiCpu, FiEdit3, FiGlobe, FiClipboard
} from 'react-icons/fi'
import auth from '../config/auth'
import api from '../services/api'
import { searchMaterials, SEARCH_MIN_QUERY_LENGTH } from '../services/search'
import { pickLocalized } from '../i18n/localize'
import { isAdmin, isTeacher } from '../utils/roles'
import { useTranslation } from 'react-i18next'
import { setLang } from '../i18n'
import NotificationPopover from './NotificationPopover'
import "./Navigation.css"

const LANG_OPTIONS = [
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
    { code: 'kz', label: 'KZ' },
]

const SEARCH_GROUP_ORDER = ['course', 'lesson', 'test']

const getSearchGroupLabel = (type, t) => {
    if (type === 'course') return t('common.courses')
    if (type === 'lesson') return t('common.lessons')
    return t('common.tests')
}

const getSearchResultTarget = (item) => {
    if (!item?.courseId) {
        return '/courses'
    }
    if (item.type === 'lesson' && item.lessonId) {
        return `/courses/${item.courseId}?lessonId=${item.lessonId}`
    }
    if (item.type === 'test' && item.testId) {
        return `/courses/${item.courseId}?testId=${item.testId}`
    }
    return `/courses/${item.courseId}`
}

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
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [userName, setUserName] = useState('User')
    const notifRef = useRef(null)
    const searchRef = useRef(null)
    const searchRequestIdRef = useRef(0)

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system'
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    useEffect(() => {
        const applyTheme = () => {
            const root = document.body
            root.classList.remove('dark-mode')

            if (theme === 'dark') {
                root.classList.add('dark-mode')
            } else if (theme === 'system') {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark-mode')
                }
            }
        }

        applyTheme()
        localStorage.setItem('theme', theme)

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleSystemChange = () => {
            if (theme === 'system') applyTheme()
        }

        mediaQuery.addEventListener('change', handleSystemChange)
        return () => mediaQuery.removeEventListener('change', handleSystemChange)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark'
            if (prev === 'dark') return 'system'
            return 'light'
        })
    }

    const getThemeIcon = () => {
        if (theme === 'light') return <FiSun />
        if (theme === 'dark') return <FiMoon />
        return <FiMonitor />
    }

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
                setShowNotifications(false)
            }
        }
        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showNotifications])

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
        setSearchOpen(false)
    }, [location.pathname])

    useEffect(() => {
        const query = searchQuery.trim()
        if (!query) {
            searchRequestIdRef.current += 1
            setSearchResults([])
            setSearchError('')
            setSearchLoading(false)
            setHighlightedIndex(-1)
            return
        }

        if (query.length < SEARCH_MIN_QUERY_LENGTH) {
            searchRequestIdRef.current += 1
            setSearchResults([])
            setSearchError('')
            setSearchLoading(false)
            setHighlightedIndex(-1)
            return
        }

        const requestId = ++searchRequestIdRef.current
        const timeoutId = window.setTimeout(async () => {
            setSearchLoading(true)
            setSearchError('')
            setSearchOpen(true)

            try {
                const results = await searchMaterials(query)
                if (searchRequestIdRef.current !== requestId) {
                    return
                }
                setSearchResults(results)
                setHighlightedIndex(results.length > 0 ? 0 : -1)
            } catch (error) {
                if (searchRequestIdRef.current !== requestId) {
                    return
                }
                console.error('Failed to search materials', error)
                setSearchResults([])
                setHighlightedIndex(-1)
                setSearchError(t('searchUi.error'))
            } finally {
                if (searchRequestIdRef.current === requestId) {
                    setSearchLoading(false)
                }
            }
        }, 250)

        return () => window.clearTimeout(timeoutId)
    }, [searchQuery, t])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchOpen(false)
                setHighlightedIndex(-1)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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

    const resetSearch = useCallback(() => {
        searchRequestIdRef.current += 1
        setSearchQuery('')
        setSearchResults([])
        setSearchError('')
        setSearchLoading(false)
        setSearchOpen(false)
        setHighlightedIndex(-1)
    }, [])

    const handleSelectSearchResult = useCallback((item) => {
        resetSearch()
        navigate(getSearchResultTarget(item))
    }, [navigate, resetSearch])

    const handleMarkRead = async (id) => {
        try {
            const notif = notifications.find(n => n.id === id)
            if (notif && notif.read) return

            await api.put(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error(err)
        }
    }

    const currentLang = (i18n.language || 'ru').split('-')[0]

    const groupedSearchResults = useMemo(() => {
        let optionIndex = 0

        return SEARCH_GROUP_ORDER
            .map((type) => {
                const items = searchResults
                    .filter(item => item.type === type)
                    .map(item => ({
                        ...item,
                        optionIndex: optionIndex++
                    }))

                return { type, items }
            })
            .filter(group => group.items.length > 0)
    }, [searchResults])

    const flattenedSearchResults = useMemo(
        () => groupedSearchResults.flatMap(group => group.items),
        [groupedSearchResults]
    )

    const showSearchDropdown = searchOpen && (
        Boolean(searchQuery.trim()) ||
        searchLoading ||
        Boolean(searchError) ||
        searchResults.length > 0
    )

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

    const handleSearchKeyDown = (event) => {
        if (!showSearchDropdown && event.key !== 'Escape') {
            setSearchOpen(true)
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!flattenedSearchResults.length) return
            setHighlightedIndex((prev) => (prev + 1) % flattenedSearchResults.length)
            return
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!flattenedSearchResults.length) return
            setHighlightedIndex((prev) => (prev <= 0 ? flattenedSearchResults.length - 1 : prev - 1))
            return
        }

        if (event.key === 'Enter') {
            const selectedItem = highlightedIndex >= 0
                ? flattenedSearchResults[highlightedIndex]
                : flattenedSearchResults[0]
            if (!selectedItem) {
                return
            }
            event.preventDefault()
            handleSelectSearchResult(selectedItem)
            return
        }

        if (event.key === 'Escape') {
            setSearchOpen(false)
            setHighlightedIndex(-1)
        }
    }

    return (
        <>
            <header className={`top-navbar ${isCollapsed ? 'collapsed' : ''}`}>
                <div
                    className={`top-search ${showSearchDropdown ? 'is-open' : ''}`}
                    ref={searchRef}
                >
                    <FiSearch className="search-icon" />
                    <input
                        type="search"
                        placeholder={t('common.search')}
                        value={searchQuery}
                        onChange={(event) => {
                            setSearchQuery(event.target.value)
                            setSearchOpen(true)
                        }}
                        onFocus={() => setSearchOpen(true)}
                        onKeyDown={handleSearchKeyDown}
                        aria-label={t('common.search')}
                        aria-expanded={showSearchDropdown}
                        aria-controls="global-search-results"
                        aria-autocomplete="list"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="top-search__clear"
                            onClick={resetSearch}
                            aria-label={t('searchUi.clear')}
                        >
                            <FiX />
                        </button>
                    )}

                    {showSearchDropdown && (
                        <div className="top-search__dropdown" id="global-search-results" role="listbox">
                            {searchQuery.trim().length > 0 && searchQuery.trim().length < SEARCH_MIN_QUERY_LENGTH && (
                                <div className="top-search__state">{t('searchUi.minChars', { count: SEARCH_MIN_QUERY_LENGTH })}</div>
                            )}

                            {searchLoading && (
                                <div className="top-search__state">{t('searchUi.loading')}</div>
                            )}

                            {!searchLoading && searchError && (
                                <div className="top-search__state top-search__state--error">{searchError}</div>
                            )}

                            {!searchLoading && !searchError && searchQuery.trim().length >= SEARCH_MIN_QUERY_LENGTH && groupedSearchResults.length === 0 && (
                                <div className="top-search__state">{t('searchUi.empty')}</div>
                            )}

                            {!searchLoading && !searchError && groupedSearchResults.length > 0 && groupedSearchResults.map((group) => (
                                <div key={group.type} className="top-search__group">
                                    <div className="top-search__group-title">{getSearchGroupLabel(group.type, t)}</div>
                                    <div className="top-search__group-items">
                                        {group.items.map((item) => {
                                            const title = pickLocalized(item, 'title') || t(`common.${item.type}`)
                                            const description = pickLocalized(item, 'description')
                                            const courseTitle = pickLocalized(item, 'courseTitle')
                                            const isActiveOption = item.optionIndex === highlightedIndex

                                            return (
                                                <button
                                                    key={`${item.type}-${item.courseId}-${item.lessonId || item.testId || item.courseId}`}
                                                    type="button"
                                                    className={`top-search__result ${isActiveOption ? 'is-active' : ''}`}
                                                    onClick={() => handleSelectSearchResult(item)}
                                                    onMouseEnter={() => setHighlightedIndex(item.optionIndex)}
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    role="option"
                                                    aria-selected={isActiveOption}
                                                >
                                                    <span className="top-search__badge">{t(`common.${item.type}`)}</span>
                                                    <div className="top-search__result-body">
                                                        <span className="top-search__result-title">{title}</span>
                                                        {courseTitle && item.type !== 'course' && (
                                                            <span className="top-search__result-meta">
                                                                {t('searchUi.inCourse', { title: courseTitle })}
                                                            </span>
                                                        )}
                                                        {description && (
                                                            <span className="top-search__result-desc">{description}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                    {isTeacher(window.keycloak || auth) && (
                        <NavItem
                            to="/teacher/grades"
                            icon={<FiClipboard />}
                            label={t('nav.gradeJournal')}
                            isActive={isActive}
                            isCollapsed={isCollapsed}
                        />
                    )}
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