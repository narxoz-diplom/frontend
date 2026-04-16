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
import { useTranslation } from 'react-i18next'
import './AdminNews.css'

const formatTime = (iso, locale = 'ru-RU') => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(locale, {
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
  imageUrl: null,
})

const AdminNews = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { confirm, toast } = useAlert()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
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
      toast(t('adminNewsPage.loadError'), 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [toast, t])

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
    setImageFile(null)
    setRemoveImage(false)
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
        imageUrl: res.data.imageUrl || null,
      })
      setImageFile(null)
      setRemoveImage(false)
      setModalOpen(true)
    } catch {
      toast(t('adminNewsPage.loadOneError'), 'error')
    } finally {
      setLoadingOne(false)
    }
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm())
    setImageFile(null)
    setRemoveImage(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const title = form.title.trim()
    const shortDescription = form.shortDescription.trim()
    const content = form.content.trim()
    if (!title || !shortDescription || !content) {
      toast(t('adminNewsPage.fillRequired'), 'error')
      return
    }
    let uploadedImageFileId = null
    if (imageFile) {
      try {
        const up = new FormData()
        up.append('file', imageFile)
        const uploadRes = await api.post('/files/upload-news-image', up, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploadedImageFileId = uploadRes.data?.id ?? null
        if (!uploadedImageFileId) {
          toast(t('common.uploadError') || 'Ошибка загрузки фото', 'error')
          return
        }
      } catch {
        toast(t('common.uploadError') || 'Ошибка загрузки фото', 'error')
        return
      }
    }

    const body = {
      title,
      shortDescription,
      content,
    }
    setSaving(true)
    try {
      if (editingId != null) {
        await api.put(`/news/${editingId}`, {
          ...body,
          removeImage,
          imageFileId: uploadedImageFileId,
        })
        toast(t('adminNewsPage.updated'), 'success')
      } else {
        await api.post('/news', {
          ...body,
          imageFileId: uploadedImageFileId,
        })
        toast(t('adminNewsPage.created'), 'success')
      }
      closeModal()
      loadNews()
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        toast(t('adminNewsPage.noRightsAdmin'), 'error')
      } else {
        toast(t('adminNewsPage.saveError'), 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('adminNewsPage.deleteTitle'),
      message: t('adminNewsPage.deleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/news/${id}`)
      toast(t('adminNewsPage.deleted'), 'success')
      loadNews()
    } catch (err) {
      if (err.response?.status === 403) {
        toast(t('adminNewsPage.noRights'), 'error')
      } else {
        toast(t('adminNewsPage.deleteError'), 'error')
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
            <FiArrowLeft /> {t('adminNewsPage.backHome')}
          </Link>
          <h1 className="admin-news-title">{t('adminNewsPage.title')}</h1>
          <p className="admin-news-desc">
            {t('adminNewsPage.subtitle')}
          </p>
        </div>
        <button type="button" className="admin-news-btn-primary" onClick={openCreate}>
          <FiPlus aria-hidden />
          {t('adminNewsPage.newItem')}
        </button>
      </div>

      {loading ? (
        <div className="admin-news-loading">
          <FiLoader className="admin-news-spin" />
          {t('adminNewsPage.loading')}
        </div>
      ) : items.length === 0 ? (
        <div className="admin-news-empty">{t('adminNewsPage.empty')}</div>
      ) : (
        <div className="admin-news-table-wrap">
          <table className="admin-news-table">
            <thead>
              <tr>
                <th>{t('adminNewsPage.headline')}</th>
                <th>{t('adminNewsPage.author')}</th>
                <th>{t('adminNewsPage.published')}</th>
                <th className="admin-news-col-actions">{t('adminNewsPage.actions')}</th>
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
                      {formatTime(n.publishedAt, i18n.language === 'kz' ? 'kk-KZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU')}
                    </span>
                  </td>
                  <td className="admin-news-col-actions">
                    <div className="admin-news-actions">
                      <button
                        type="button"
                        className="admin-news-icon-btn"
                        title={t('adminNewsPage.edit')}
                        onClick={() => openEdit(n.id)}
                        disabled={loadingOne}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="admin-news-icon-btn admin-news-icon-btn--danger"
                        title={t('adminNewsPage.delete')}
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
                {editingId != null ? t('adminNewsPage.editTitle') : t('adminNewsPage.createTitle')}
              </h2>
              <button
                type="button"
                className="admin-news-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label={t('courseEdit.closeLabel')}
              >
                <FiX />
              </button>
            </div>
            <form className="admin-news-form" onSubmit={handleSubmit}>
              <label className="admin-news-field">
                <span>{t('adminNewsPage.titleField')}</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={saving}
                  required
                />
              </label>
              <label className="admin-news-field">
                <span>{t('adminNewsPage.shortDescription')}</span>
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  disabled={saving}
                  rows={3}
                  required
                />
              </label>
              <label className="admin-news-field">
                <span>{t('adminNewsPage.fullText')}</span>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  disabled={saving}
                  rows={12}
                  required
                />
              </label>
              <div className="admin-news-field">
                <span>{t('common.photo') || 'Фото'}</span>
                {form.imageUrl && !removeImage ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <img
                      src={form.imageUrl}
                      alt=""
                      style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)' }}
                    />
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={removeImage}
                        onChange={(e) => setRemoveImage(e.target.checked)}
                        disabled={saving}
                      />
                      {t('common.remove') || 'Удалить фото'}
                    </label>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setImageFile(f)
                    if (f) setRemoveImage(false)
                  }}
                  disabled={saving}
                />
              </div>
              <div className="admin-news-modal-foot">
                <button type="button" className="admin-news-btn-secondary" onClick={closeModal} disabled={saving}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="admin-news-btn-primary" disabled={saving}>
                  {saving ? t('adminNewsPage.saving') : editingId != null ? t('common.save') : t('adminNewsPage.create')}
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
