import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiLoader,
} from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { getNews, getNewsItem, createNews, updateNews, deleteNews } from '@/shared/api/newsApi'
import { uploadNewsImage } from '@/shared/api/filesApi'
import { useAlert } from '@/app/providers/AlertProvider'
import { isAdmin } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import NewsFormModal from './components/NewsFormModal'
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
      const res = await getNews()
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
    if (!isAdmin(auth)) {
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
      const res = await getNewsItem(id)
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

  const handleFieldChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleImageFileChange = (file) => {
    setImageFile(file)
    if (file) setRemoveImage(false)
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
        const uploadRes = await uploadNewsImage(up)
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
        await updateNews(editingId, {
          ...body,
          removeImage,
          imageFileId: uploadedImageFileId,
        })
        toast(t('adminNewsPage.updated'), 'success')
      } else {
        await createNews({
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
      await deleteNews(id)
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

  if (!isAdmin(auth)) {
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
        <NewsFormModal
          isEditing={editingId != null}
          form={form}
          saving={saving}
          removeImage={removeImage}
          onFieldChange={handleFieldChange}
          onRemoveImageChange={setRemoveImage}
          onImageFileChange={handleImageFileChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default AdminNews
