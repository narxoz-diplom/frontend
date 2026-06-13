import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyTheme, getStoredTheme } from '@/shared/lib/theme'
import { Icon } from '@/shared/ui/academis'
import Dropdown from '@/shared/ui/Dropdown'

const THEME_OPTIONS = [
  { id: 'light', icon: 'sun' },
  { id: 'dark', icon: 'moon' },
  { id: 'system', icon: 'monitor' },
]

const ThemeToggle = () => {
  const { t } = useTranslation()
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('theme', theme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      if (theme === 'system') applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [theme])

  const currentOption = useMemo(
    () => THEME_OPTIONS.find((option) => option.id === theme) || THEME_OPTIONS[2],
    [theme],
  )

  return (
    <Dropdown
      align="right"
      trigger={(
        <button
          type="button"
          className="btn btn-icon btn-ghost btn-sm topbar-icon-btn"
          title={t('theme')}
          aria-label={t('theme')}
        >
          <Icon name={currentOption.icon} size={19} />
        </button>
      )}
    >
      <div className="menu-label">{t('theme')}</div>
      {THEME_OPTIONS.map(({ id, icon }) => (
        <button
          key={id}
          type="button"
          className="menu-item"
          onClick={() => setTheme(id)}
        >
          <Icon name={icon} size={17} style={{ color: theme === id ? 'var(--brand)' : 'var(--text-3)' }} />
          {t(`theme${id.charAt(0).toUpperCase()}${id.slice(1)}`)}
          {theme === id && (
            <span style={{ marginLeft: 'auto', color: 'var(--brand)' }}>
              <Icon name="check" size={16} />
            </span>
          )}
        </button>
      ))}
    </Dropdown>
  )
}

export default ThemeToggle
