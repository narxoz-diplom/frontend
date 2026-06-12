import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'

const UserMenu = ({ userRoles = [], onLogout }) => {
    const location = useLocation()
    const { t } = useTranslation()
    const profileRef = useRef(null)
    const [profileOpen, setProfileOpen] = useState(false)
    const [userName, setUserName] = useState('User')

    useEffect(() => {
        if (auth?.tokenParsed) {
            setUserName(auth.tokenParsed.preferred_username || auth.tokenParsed.name || 'User')
        }
    }, [])

    useEffect(() => {
        setProfileOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (!profileOpen) return
        const onKey = (e) => {
            if (e.key === 'Escape') setProfileOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [profileOpen])

    useEffect(() => {
        if (!profileOpen) return
        const close = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false)
            }
        }
        const id = window.setTimeout(() => {
            document.addEventListener('click', close, true)
        }, 0)
        return () => {
            window.clearTimeout(id)
            document.removeEventListener('click', close, true)
        }
    }, [profileOpen])

    const toggleProfileMenu = useCallback((e) => {
        e.stopPropagation()
        setProfileOpen((v) => !v)
    }, [])

    return (
        <div className="top-profile-section" ref={profileRef}>
            <div
                className={`top-avatar-container ${profileOpen ? 'dropdown-open' : ''}`}
            >
                <button
                    type="button"
                    className="top-profile-trigger"
                    onClick={toggleProfileMenu}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    aria-controls="top-profile-menu"
                >
                    <span className="top-user-info">
                        <span className="top-user-name">{userName}</span>
                        <span className="top-user-role">
                            {[...new Set(userRoles)].join(', ')}
                        </span>
                    </span>
                    <span className="top-avatar" aria-hidden>
                        {userName.charAt(0).toUpperCase()}
                    </span>
                </button>
                <div
                    id="top-profile-menu"
                    className="top-dropdown"
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                    >
                        <FiUser aria-hidden /> {t('nav.profile')}
                    </Link>
                    <Link
                        to="/settings"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                    >
                        <FiSettings aria-hidden /> {t('nav.settings')}
                    </Link>
                    <hr className="top-dropdown-divider" />
                    <button
                        type="button"
                        onClick={() => {
                            setProfileOpen(false)
                            onLogout()
                        }}
                        className="logout-btn-dropdown"
                        role="menuitem"
                    >
                        <FiLogOut aria-hidden /> {t('nav.logout')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UserMenu
