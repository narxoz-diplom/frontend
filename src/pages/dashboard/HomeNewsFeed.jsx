import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiArrowLeft, FiArrowRight, FiClock } from 'react-icons/fi'
import { getNews } from '@/shared/api/newsApi'
import './Dashboard.css'

const formatTime = (iso) => {
    if (!iso) return ''
    try {
        const d = new Date(iso)
        return d.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return ''
    }
}

const HomeNewsFeed = () => {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const scrollerRef = useRef(null)

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
                            .slice(0, 8)
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

    const canScroll = useMemo(() => items.length > 0, [items.length])

    const scrollByCards = (dir) => {
        const el = scrollerRef.current
        if (!el) return
        const amount = Math.max(280, Math.floor(el.clientWidth * 0.85))
        el.scrollBy({ left: dir * amount, behavior: 'smooth' })
    }

    return (
        <div className="dashboard-section home-news-section">
            <div className="section-header">
                <h2 className="section-title">Новости и объявления</h2>
                <p className="section-subtitle">Публикации от администрации платформы</p>
            </div>

            {loading ? (
                <div className="home-news-loading">Загрузка ленты…</div>
            ) : items.length === 0 ? (
                <div className="home-news-empty">
                    <FiBell className="home-news-empty-icon" aria-hidden />
                    <p>Пока нет опубликованных новостей.</p>
                    <Link to="/notifications" className="home-news-all-link">
                        Личные уведомления <FiArrowRight />
                    </Link>
                </div>
            ) : (
                <div className="home-news-carousel">
                    <button
                        type="button"
                        className="home-news-nav-btn home-news-nav-btn--left"
                        onClick={() => scrollByCards(-1)}
                        disabled={!canScroll}
                        aria-label="Прокрутить новости влево"
                    >
                        <FiArrowLeft />
                    </button>

                    <ul className="home-news-list" ref={scrollerRef}>
                        {items.map((n) => (
                            <li key={n.id} className="home-news-card">
                                <Link to={`/news/${n.id}`} className="home-news-card-link" aria-label={`Открыть новость: ${n.title || ''}`}>
                                    {n.imageUrl ? (
                                        <img
                                            src={n.imageUrl}
                                            alt=""
                                            style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 14, marginBottom: 12 }}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : null}
                                    <div className="home-news-card-top">
                                        <span className="home-news-type">Новость</span>
                                        <span className="home-news-time">
                                            <FiClock />
                                            {formatTime(n.publishedAt)}
                                        </span>
                                    </div>
                                    <h3 className="home-news-title">{n.title}</h3>
                                    {n.authorName ? <p className="home-news-author">{n.authorName}</p> : null}
                                    <p className="home-news-message">{n.shortDescription}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        className="home-news-nav-btn home-news-nav-btn--right"
                        onClick={() => scrollByCards(1)}
                        disabled={!canScroll}
                        aria-label="Прокрутить новости вправо"
                    >
                        <FiArrowRight />
                    </button>
                </div>
            )}

            {!loading && items.length > 0 && (
                <div className="home-news-footer">
                    <Link to="/notifications" className="home-news-all-link">
                        Личные уведомления <FiArrowRight />
                    </Link>
                </div>
            )}
        </div>
    )
}

export default HomeNewsFeed
