import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getNews } from '@/shared/api/newsApi'
import { Icon, SectionCard } from '@/shared/ui/academis'

const NEWS_COLORS = ['red', 'blue', 'violet', 'amber', 'green']

const tagColor = (color) => ({
  red: 'var(--brand)',
  blue: 'var(--blue-500)',
  violet: 'var(--violet-500)',
  amber: 'var(--amber-500)',
  green: 'var(--green-500)',
}[color] || 'var(--brand)')

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

const HomeNewsFeed = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getNews()
        const list = Array.isArray(res.data) ? res.data : []
        if (!cancelled) {
          setItems(
            [...list]
              .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
              .slice(0, 6),
          )
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <SectionCard title={t('dashboard.home.newsFeed')} icon="news">
        <div className="muted" style={{ padding: '12px 0' }}>{t('common.loading')}</div>
      </SectionCard>
    )
  }

  if (items.length === 0) {
    return (
      <SectionCard title={t('dashboard.home.newsFeed')} icon="news">
        <div className="muted" style={{ padding: '12px 0' }}>
          {t('dashboard.home.noNews')}
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title={t('dashboard.home.newsFeed')}
      icon="news"
      action={(
        <Link to={`/news/${items[0].id}`} className="link-more">
          {t('common.viewAll')}
        </Link>
      )}
    >
      <div className="col" style={{ gap: 2 }}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className="news-row"
            onClick={() => navigate(`/news/${item.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/${item.id}`)}
            role="link"
            tabIndex={0}
          >
            <span
              className="news-dot"
              style={{ background: tagColor(NEWS_COLORS[index % NEWS_COLORS.length]) }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 650,
                  fontSize: 13.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.title}
              </div>
              <div className="dim" style={{ fontSize: 12 }}>
                {formatDate(item.publishedAt)}
              </div>
            </div>
            <Icon name="chevRight" size={16} style={{ color: 'var(--text-3)' }} />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export default HomeNewsFeed
