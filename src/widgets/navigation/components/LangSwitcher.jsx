import React from 'react'
import { FiGlobe } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { setLang } from '@/i18n'

const LANG_OPTIONS = [
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
    { code: 'kz', label: 'KZ' },
]

const LangSwitcher = () => {
    const { t, i18n } = useTranslation()
    const currentLang = (i18n.language || 'ru').split('-')[0]

    return (
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
    )
}

export default LangSwitcher
