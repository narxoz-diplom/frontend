import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiX,
  FiLoader,
} from 'react-icons/fi'
import api from '../services/api'
import auth from '../config/auth'
import { useAlert } from '../context/AlertProvider'
import { isAdmin } from '../utils/roles'
import './AdminNews.css'

const formatTime = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

const emptyForm = () => ({
  title: '',
  shortDescription: '',
  content: '',
})

const AdminNews = () => {
  const navigate = useNavigate()
  const { confirm, toast } = useAlert()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loadingOne, setLoadingOne] = useState(false)

  const loadNews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/news')
      const list = Array.isArray(res.data) ? res.data : []
      setItems(
        [...list].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      )
    } catch {
      toast('Не удалось загрузить новости', 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const keycloak = typeof window !== 'undefined' ? window.keycloak || auth : auth
    if (!isAdmin(keycloak)) {
      navigate('/', { replace: true })
      return
    }
    loadNews()
  }, [navigate, loadNews])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = async (id) => {
    setLoadingOne(true)
    try {
      const res = await api.get(`/news/${id}`)
      setEditingId(id)
      setForm({
        title: res.data.title || '',
        shortDescription: res.data.shortDescription || '',
        content: res.data.content || '',
      })
      setModalOpen(true)
    } catch {
      toast('Не удалось загрузить новость', 'error')
    } finally {
      setLoadingOne(false)
    }
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const title = form.title.trim()
    const shortDescription = form.shortDescription.trim()
    const content = form.content.trim()
    if (!title || !shortDescription || !content) {
      toast('Заполните заголовок, краткое описание и текст', 'error')
      return
    }
    const body = { title, shortDescription, content }
    setSaving(true)
    try {
      if (editingId != null) {
        await api.put(`/news/${editingId}`, body)
        toast('Новость обновлена', 'success')
      } else {
        await api.post('/news', body)
        toast('Новость создана', 'success')
      }
      closeModal()
      loadNews()
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        toast('Недостаточно прав (нужна роль администратора)', 'error')
      } else {
        toast('Не удалось сохранить новость', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Удаление новости',
      message: 'Удалить эту новость? Восстановить её будет нельзя.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/news/${id}`)
      toast('Новость удалена', 'success')
      loadNews()
    } catch (err) {
      if (err.response?.status === 403) {
        toast('Недостаточно прав', 'error')
      } else {
        toast('Не удалось удалить новость', 'error')
      }
    }
  }

  if (!isAdmin(typeof window !== 'undefined' ? window.keycloak || auth : auth)) {
    return null
  }

  return (
    <div className="admin-news-page">
      <div className="admin-news-header">
        <div className="admin-news-header-left">
          <Link to="/" className="admin-news-back">
            <FiArrowLeft /> На главную
          </Link>
          <h1 className="admin-news-title">Новости — администрирование</h1>
          <p className="admin-news-desc">
            Создание и редактирование публикаций для блока «Новости и объявления» на дашборде.
          </p>
        </div>
        <button type="button" className="admin-news-btn-primary" onClick={openCreate}>
          <FiPlus aria-hidden />
          Новая новость
        </button>
      </div>

      {loading ? (
        <div className="admin-news-loading">
          <FiLoader className="admin-news-spin" />
          Загрузка…
        </div>
      ) : items.length === 0 ? (
        <div className="admin-news-empty">Пока нет новостей. Создайте первую.</div>
      ) : (
        <div className="admin-news-table-wrap">
          <table className="admin-news-table">
            <thead>
              <tr>
                <th>Заголовок</th>
                <th>Автор</th>
                <th>Опубликовано</th>
                <th className="admin-news-col-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id}>
                  <td>
                    <div className="admin-news-cell-title">{n.title}</div>
                    <div className="admin-news-cell-preview">{n.shortDescription}</div>
                  </td>
                  <td>{n.authorName || '—'}</td>
                  <td>
                    <span className="admin-news-date">
                      <FiClock aria-hidden />
                      {formatTime(n.publishedAt)}
                    </span>
                  </td>
                  <td className="admin-news-col-actions">
                    <div className="admin-news-actions">
                      <button
                        type="button"
                        className="admin-news-icon-btn"
                        title="Редактировать"
                        onClick={() => openEdit(n.id)}
                        disabled={loadingOne}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="admin-news-icon-btn admin-news-icon-btn--danger"
                        title="Удалить"
                        onClick={() => handleDelete(n.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="admin-news-modal-overlay" role="presentation" onClick={closeModal}>
          <div
            className="admin-news-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-news-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-news-modal-head">
              <h2 id="admin-news-modal-title">
                {editingId != null ? 'Редактировать новость' : 'Новая новость'}
              </h2>
              <button
                type="button"
                className="admin-news-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Закрыть"
              >
                <FiX />
              </button>
            </div>
            <form className="admin-news-form" onSubmit={handleSubmit}>
              <label className="admin-news-field">
                <span>Заголовок</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={saving}
                  required
                />
              </label>
              <label className="admin-news-field">
                <span>Краткое описание</span>
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  disabled={saving}
                  rows={3}
                  required
                />
              </label>
              <label className="admin-news-field">
                <span>Полный текст</span>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  disabled={saving}
                  rows={12}
                  required
                />
              </label>
              <div className="admin-news-modal-foot">
                <button type="button" className="admin-news-btn-secondary" onClick={closeModal} disabled={saving}>
                  Отмена
                </button>
                <button type="submit" className="admin-news-btn-primary" disabled={saving}>
                  {saving ? 'Сохранение…' : editingId != null ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNews
