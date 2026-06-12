import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    FiHome, FiBook, FiLogOut,
    FiMenu, FiX, FiBookOpen, FiChevronLeft, FiChevronRight,
    FiBarChart2, FiFolder, FiEdit3, FiClipboard, FiAward
} from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { isAdmin, isTeacher, isStudent } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import NavItem from './components/NavItem'
import SearchBox from './components/SearchBox'
import LangSwitcher from './components/LangSwitcher'
import ThemeToggle from './components/ThemeToggle'
import NotificationBell from './components/NotificationBell'
import UserMenu from './components/UserMenu'
import "./Navigation.css"

const Navigation = ({ userRoles = [] }) => {
    const location = useLocation()
    const { t } = useTranslation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

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

    const handleLogout = useCallback(() => {
        auth.logout()
    }, [])

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

    return (
        <>
            <header className={`top-navbar ${isCollapsed ? 'collapsed' : ''}`}>
                <SearchBox />

                <div className="top-right-actions">
                    <LangSwitcher />
                    <ThemeToggle />
                    <NotificationBell />
                    <UserMenu userRoles={userRoles} onLogout={handleLogout} />
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
                    {isTeacher(auth) && (
                        <NavItem
                            to="/teacher/grades"
                            icon={<FiClipboard />}
                            label={t('nav.gradeJournal')}
                            isActive={isActive}
                            isCollapsed={isCollapsed}
                        />
                    )}
                    {isStudent(auth) && (
                        <NavItem
                            to="/my/grades"
                            icon={<FiAward />}
                            label={t('nav.myGrades')}
                            isActive={isActive}
                            isCollapsed={isCollapsed}
                        />
                    )}
                    <NavItem to="/stats" icon={<FiBarChart2 />} label={t('nav.stats')} isActive={isActive} isCollapsed={isCollapsed} />
                    <NavItem to="/files" icon={<FiFolder />} label={t('nav.files')} isActive={isActive} isCollapsed={isCollapsed} />
                    {isAdmin(auth) && (
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
