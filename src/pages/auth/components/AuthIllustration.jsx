import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'

function GradCap() {
  return (
    <svg width="150" height="150" viewBox="0 0 120 120" fill="none" aria-hidden>
      <path d="M60 26 L108 46 L60 66 L12 46 Z" fill="rgba(255,255,255,.95)" />
      <path d="M32 54 v22 c0 9 13 16 28 16 s28-7 28-16 V54 L60 66 Z" fill="rgba(255,255,255,.62)" />
      <path d="M108 46 v26" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="108" cy="78" r="5" fill="#fff" />
    </svg>
  )
}

const AuthIllustration = () => {
  const { t } = useTranslation()

  return (
    <div className="auth-art">
      <div className="auth-art-bg" aria-hidden />

      <div className="aa-orbit">
        <div className="aa-card aa-c1">
          <span className="aa-ic" style={{ background: '#fff', color: 'var(--brand)' }}>
            <Icon name="sparkles" size={22} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{t('nav.courses')}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{t('auth.brandSubtitle')}</div>
          </div>
        </div>

        <div className="aa-card aa-c2">
          <span className="aa-ic" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            <Icon name="award" size={22} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{t('nav.myGrades')}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{t('studentGrades.avgGrade')}</div>
          </div>
        </div>

        <div className="aa-card aa-c3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <span
              className="aa-ic"
              style={{
                background: 'rgba(255,255,255,.18)',
                color: '#fff',
                width: 30,
                height: 30,
              }}
            >
              <Icon name="book" size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t('common.course')}</div>
              <div className="aa-prog">
                <i style={{ width: '62%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="aa-grad">
          <GradCap />
        </div>
      </div>

      <div className="auth-art-foot">
        <div className="aa-stats">
          <div className="aa-stat">{t('common.courses')}</div>
          <div className="aa-stat">{t('common.lessons')}</div>
          <div className="aa-stat">{t('nav.stats')}</div>
        </div>
      </div>
    </div>
  )
}

export default AuthIllustration
