import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getNewsItem } from '@/shared/api/newsApi'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import '../secondary-academis.css'

const formatTime = (iso, locale) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function NewsDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const locale = i18n.language === 'kz' ? 'kk-KZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const res = await getNewsItem(id)
        if (!cancelled) setItem(res.data || null)
      } catch (e) {
        if (!cancelled) {
          setItem(null)
          setError(
            e?.response?.status === 404
              ? t('adminNewsPage.loadOneError')
              : t('adminNewsPage.loadError'),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, t])

  if (loading) {
    return (
      <div className="page secondary-page-loading" style={{ maxWidth: 760 }}>
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="page" style={{ maxWidth: 760 }}>
        <div className="secondary-flash secondary-flash--error">{error || t('adminNewsPage.loadOneError')}</div>
        <Link to="/" className="bc-link row gap5" style={{ marginTop: 16 }}>
          <Icon name="chevLeft" size={16} />
          {t('adminNewsPage.backHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <PageHeader
        title={item.title}
        back="/"
        breadcrumb={[{ label: t('nav.adminNews'), to: '/admin/news' }]}
      />

      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          className="news-hero"
          style={{
            background: item.imageUrl
              ? `linear-gradient(135deg, rgba(0,0,0,.35), rgba(0,0,0,.55)), url(${item.imageUrl}) center/cover`
              : 'linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 50%, #000))',
          }}
        >
          <span className="badge">{t('nav.adminNews')}</span>
          <div style={{ position: 'absolute', right: -10, bottom: -20, opacity: 0.15, color: '#fff' }}>
            <Icon name="news" size={120} />
          </div>
        </div>

        <div className="news-article-body">
          <div className="news-article-meta">
            <span className="row gap5">
              <Icon name="clock" size={14} />
              {formatTime(item.publishedAt, locale)}
            </span>
            {item.authorName && (
              <span className="row gap5">
                <Icon name="user" size={14} />
                {item.authorName}
              </span>
            )}
          </div>

          {item.shortDescription && (
            <p className="news-article-lead" style={{ marginTop: 16 }}>
              {item.shortDescription}
            </p>
          )}
          {item.content && (
            <div className="news-article-content markdown">{item.content}</div>
          )}
        </div>
      </div>
    </div>
  )
}
