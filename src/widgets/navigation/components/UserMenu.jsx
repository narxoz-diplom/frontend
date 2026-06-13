import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
import Dropdown from '@/shared/ui/Dropdown'
import { getPrimaryRoleLabel, getUserProfile } from '@/shared/lib/userProfile'

const UserMenu = ({ userRoles = [], onLogout }) => {
  const { t } = useTranslation()
  const profile = useMemo(() => getUserProfile(), [])
  const roleLabel = getPrimaryRoleLabel(t)

  return (
    <Dropdown
      align="right"
      width={240}
      trigger={(
        <div className="tb-user" role="button" tabIndex={0} aria-haspopup="menu">
          <span className="avatar">{profile.initials}</span>
          <span className="desktop-only" style={{ color: 'var(--text-3)' }}>
            <Icon name="chevDown" size={15} />
          </span>
        </div>
      )}
    >
      <div style={{ padding: '8px 12px 6px' }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{profile.fullName}</div>
        <div className="dim" style={{ fontSize: 12 }}>{profile.email}</div>
      </div>
      <span className="badge badge-red" style={{ margin: '2px 12px 6px' }}>
        {roleLabel || [...new Set(userRoles)].join(', ')}
      </span>
      <div className="menu-sep" />
      <Link to="/profile" className="menu-item" role="menuitem">
        <Icon name="user" size={17} />
        {t('nav.profile')}
      </Link>
      <Link to="/settings" className="menu-item" role="menuitem">
        <Icon name="settings" size={17} />
        {t('nav.settings')}
      </Link>
      <Link to="/notifications" className="menu-item" role="menuitem">
        <Icon name="bell" size={17} />
        {t('nav.notifications')}
      </Link>
      <div className="menu-sep" />
      <button
        type="button"
        className="menu-item danger"
        onClick={onLogout}
        role="menuitem"
      >
        <Icon name="logout" size={17} />
        {t('nav.logout')}
      </button>
    </Dropdown>
  )
}

export default UserMenu
