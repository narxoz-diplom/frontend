import React from 'react'
import { useTranslation } from 'react-i18next'
import { setLang } from '@/i18n'
import { Icon } from '@/shared/ui/academis'
import Dropdown from '@/shared/ui/Dropdown'

const LANG_OPTIONS = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'kz', label: 'Қазақша' },
]

const LangSwitcher = () => {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'ru').split('-')[0]

  return (
    <Dropdown
      align="right"
      trigger={(
        <button
          type="button"
          className="btn btn-icon btn-ghost btn-sm topbar-icon-btn"
          title={t('lang')}
          aria-label={t('lang')}
        >
          <Icon name="globe" size={19} />
        </button>
      )}
    >
      <div className="menu-label">{t('lang')}</div>
      {LANG_OPTIONS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className="menu-item"
          onClick={() => setLang(code)}
        >
          <span style={{
            fontWeight: 800,
            fontSize: 11,
            width: 22,
            color: currentLang === code ? 'var(--brand)' : 'var(--text-3)',
          }}
          >
            {code.toUpperCase()}
          </span>
          {label}
          {currentLang === code && (
            <span style={{ marginLeft: 'auto', color: 'var(--brand)' }}>
              <Icon name="check" size={16} />
            </span>
          )}
        </button>
      ))}
    </Dropdown>
  )
}

export default LangSwitcher
