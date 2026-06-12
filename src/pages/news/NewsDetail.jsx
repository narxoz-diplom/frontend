import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiClock } from 'react-icons/fi'
import { getNewsItem } from '@/shared/api/newsApi'
import './NewsDetail.css'

const formatTime = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

export default function NewsDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          setError(e?.response?.status === 404 ? 'Новость не найдена' : 'Не удалось загрузить новость')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="news-detail">
      <Link to="/" className="news-detail__back">
        <FiArrowLeft />
        Назад
      </Link>

      {loading ? (
        <div className="news-detail__state">Загрузка…</div>
      ) : error ? (
        <div className="news-detail__state news-detail__state--error">{error}</div>
      ) : !item ? (
        <div className="news-detail__state news-detail__state--error">Новость не найдена</div>
      ) : (
        <article className="news-detail__card">
          {item.imageUrl ? (
            <img className="news-detail__image" src={item.imageUrl} alt="" loading="lazy" decoding="async" />
          ) : null}

          <div className="news-detail__header">
            <h1 className="news-detail__title">{item.title}</h1>
            <div className="news-detail__meta">
              <span className="news-detail__time">
                <FiClock />
                {formatTime(item.publishedAt)}
              </span>
              {item.authorName ? <span className="news-detail__author">{item.authorName}</span> : null}
            </div>
          </div>

          {item.shortDescription ? <p className="news-detail__lead">{item.shortDescription}</p> : null}
          {item.content ? <div className="news-detail__content">{item.content}</div> : null}
        </article>
      )}
    </div>
  )
}

