import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiArrowRight, FiClock } from 'react-icons/fi'
import api from '../../services/api'
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

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const res = await api.get('/news')
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
                <ul className="home-news-list">
                    {items.map((n) => (
                        <li key={n.id} className="home-news-card">
                            <div className="home-news-card-top">
                                <span className="home-news-type">Новость</span>
                                <span className="home-news-time">
                                    <FiClock />
                                    {formatTime(n.publishedAt)}
                                </span>
                            </div>
                            <h3 className="home-news-title">{n.title}</h3>
                            {n.authorName ? (
                                <p className="home-news-author">{n.authorName}</p>
                            ) : null}
                            <p className="home-news-message">{n.shortDescription}</p>
                        </li>
                    ))}
                </ul>
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
