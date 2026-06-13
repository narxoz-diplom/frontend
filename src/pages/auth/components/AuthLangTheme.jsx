import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLang } from '@/i18n'
import { applyTheme, getStoredTheme } from '@/shared/lib/theme'
import { Icon } from '@/shared/ui/academis'

const LANG_OPTIONS = ['ru', 'en', 'kz']

const AuthLangTheme = () => {
  const { i18n } = useTranslation()
  const [theme, setTheme] = useState(getStoredTheme)
  const currentLang = (i18n.language || 'ru').split('-')[0]

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

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  const themeIcon = theme === 'dark' ? 'sun' : 'moon'

  return (
    <div className="auth-lang-theme row gap8">
      <div className="lang-pills" role="group" aria-label="Language">
        {LANG_OPTIONS.map((code) => (
          <button
            key={code}
            type="button"
            className={`lang-pill${currentLang === code ? ' active' : ''}`}
            onClick={() => setLang(code)}
            aria-pressed={currentLang === code}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-icon btn-ghost btn-sm"
        onClick={toggleTheme}
        aria-label="Theme"
      >
        <Icon name={themeIcon} size={17} />
      </button>
    </div>
  )
}

export default AuthLangTheme
