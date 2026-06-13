import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { isAdmin, isTeacher, isStudent } from '@/shared/lib/roles'
import { getPrimaryRoleLabel, getUserProfile } from '@/shared/lib/userProfile'
import { Icon, Logo, LogoMark } from '@/shared/ui/academis'
import NavItem from './components/NavItem'
import SearchBox from './components/SearchBox'
import LangSwitcher from './components/LangSwitcher'
import ThemeToggle from './components/ThemeToggle'
import NotificationBell from './components/NotificationBell'
import UserMenu from './components/UserMenu'
import './Navigation.css'

const Navigation = ({ userRoles = [], children }) => {
  const location = useLocation()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const profile = useMemo(() => getUserProfile(), [])
  const roleLabel = getPrimaryRoleLabel(t)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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
    [location.pathname],
  )

  const closeMobile = () => setMobileOpen(false)

  const mainItems = [
    { to: '/', icon: 'home', label: t('nav.home') },
    { to: '/courses', icon: 'books', label: t('nav.courses') },
    ...(isTeacher(auth)
      ? [{ to: '/teacher/grades', icon: 'grade', label: t('nav.gradeJournal') }]
      : []),
    ...(isStudent(auth)
      ? [{ to: '/my/grades', icon: 'grade', label: t('nav.myGrades') }]
      : []),
    { to: '/stats', icon: 'chart', label: t('nav.stats') },
    { to: '/files', icon: 'files', label: t('nav.files') },
  ]

  const adminItems = isAdmin(auth)
    ? [{ to: '/admin/news', icon: 'news', label: t('nav.adminNews') }]
    : []

  return (
    <div className={`shell${isCollapsed ? ' collapsed' : ''}`}>
      <div
        className={`drawer-backdrop${mobileOpen ? ' show' : ''}`}
        onClick={closeMobile}
        aria-hidden
      />

      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="sb-head">
          <Link to="/" onClick={closeMobile} aria-label="Academis">
            {isCollapsed ? <LogoMark size={30} /> : <Logo size={28} compact />}
          </Link>
        </div>

        <nav className="sb-nav" aria-label={t('nav.home')}>
          {mainItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              iconName={item.icon}
              label={item.label}
              active={isActive(item.to)}
              onNavigate={closeMobile}
            />
          ))}

          {adminItems.length > 0 && (
            <div className="sb-section">Admin</div>
          )}
          {adminItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              iconName={item.icon}
              label={item.label}
              active={isActive(item.to)}
              onNavigate={closeMobile}
            />
          ))}
        </nav>

        <div className="sb-foot">
          <Link to="/profile" className="nav-item" onClick={closeMobile} title={t('nav.profile')}>
            <span className="avatar avatar-sm">{profile.initials}</span>
            <span className="nav-txt sb-foot-txt" style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: 12.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              >
                {profile.fullName}
              </div>
              <div className="dim" style={{ fontSize: 11 }}>{roleLabel}</div>
            </span>
          </Link>
          <button
            type="button"
            className="nav-item nav-item--logout"
            onClick={handleLogout}
            title={t('nav.logout')}
          >
            <Icon name="logout" size={20} className="ic" />
            <span className="nav-txt">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="btn btn-icon btn-ghost btn-sm mobile-only"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Icon name="menu" size={20} />
          </button>

          <button
            type="button"
            className="btn btn-icon btn-ghost btn-sm collapse-toggle"
            onClick={() => setIsCollapsed((value) => !value)}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Icon name={isCollapsed ? 'chevRight' : 'list'} size={19} />
          </button>

          <SearchBox />

          <div className="row gap8" style={{ marginLeft: 'auto' }}>
            <LangSwitcher />
            <ThemeToggle />
            <NotificationBell />
            <UserMenu userRoles={userRoles} onLogout={handleLogout} />
          </div>
        </header>

        <div className="main-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Navigation
