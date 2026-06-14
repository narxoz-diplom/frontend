import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getNews } from '@/shared/api/newsApi'
import { Icon, SectionCard } from '@/shared/ui/academis'

const CARD_W = 360
const CARD_GAP = 18

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#e41616,#a00d0d)',
  'linear-gradient(135deg,#2563eb,#1e3a8a)',
  'linear-gradient(135deg,#7c3aed,#5b21b6)',
  'linear-gradient(135deg,#0891b2,#0e4f5c)',
  'linear-gradient(135deg,#11a957,#0a5e32)',
  'linear-gradient(135deg,#e8920c,#92580a)',
]

const formatDate = (iso, locale) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

const NewsCarouselCard = ({ item, index, locale, onOpen }) => (
  <button type="button" className="news-carousel-card" onClick={() => onOpen(item.id)}>
    <div className="news-carousel-cover">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="news-carousel-img" />
      ) : (
        <div
          className="news-carousel-fallback"
          style={{ background: COVER_GRADIENTS[index % COVER_GRADIENTS.length] }}
        >
          <Icon name="news" size={32} style={{ color: 'rgba(255,255,255,0.55)' }} />
        </div>
      )}
    </div>
    <div className="news-carousel-body">
      <span className="news-carousel-date dim">{formatDate(item.publishedAt, locale)}</span>
      <h3 className="news-carousel-title">{item.title}</h3>
      {item.shortDescription && (
        <p className="news-carousel-desc dim">{item.shortDescription}</p>
      )}
    </div>
  </button>
)

const HomeNewsFeed = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const trackRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const locale = i18n.language === 'kz' ? 'kk-KZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'

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
              .slice(0, 10),
          )
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const updateArrows = () => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el || items.length === 0) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [items])

  const scroll = (dir) => {
    trackRef.current?.scrollBy({ left: dir * (CARD_W + CARD_GAP) * 2, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <SectionCard title={t('dashboard.home.newsFeed')} icon="news">
        <div className="news-carousel-track">
          {[1, 2, 3].map((i) => (
            <div key={i} className="news-carousel-skeleton" aria-hidden />
          ))}
        </div>
      </SectionCard>
    )
  }

  if (items.length === 0) {
    return (
      <SectionCard title={t('dashboard.home.newsFeed')} icon="news">
        <div className="dashboard-empty-hint">{t('dashboard.home.noNews')}</div>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title={t('dashboard.home.newsFeed')}
      icon="news"
      action={(
        <div className="row gap6">
          <button
            type="button"
            className="news-carousel-arrow"
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            aria-label="Previous"
          >
            <Icon name="chevLeft" size={16} />
          </button>
          <button
            type="button"
            className="news-carousel-arrow"
            onClick={() => scroll(1)}
            disabled={!canRight}
            aria-label="Next"
          >
            <Icon name="chevRight" size={16} />
          </button>
        </div>
      )}
    >
      <div className="news-carousel-track" ref={trackRef}>
        {items.map((item, index) => (
          <NewsCarouselCard
            key={item.id}
            item={item}
            index={index}
            locale={locale}
            onOpen={(id) => navigate(`/news/${id}`)}
          />
        ))}
      </div>
    </SectionCard>
  )
}

export default HomeNewsFeed
