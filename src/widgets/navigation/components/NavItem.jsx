import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/shared/ui/academis'

const NavItem = ({ to, iconName, label, active, onNavigate, className = '' }) => {
  return (
    <Link
      to={to}
      className={`nav-item${active ? ' active' : ''} ${className}`.trim()}
      title={label}
      onClick={onNavigate}
    >
      {iconName && <Icon name={iconName} size={20} className="ic" />}
      <span className="nav-txt">{label}</span>
    </Link>
  )
}

export default NavItem
