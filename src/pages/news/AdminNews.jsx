import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { getNews, getNewsItem, createNews, updateNews, deleteNews } from '@/shared/api/newsApi'
import { uploadNewsImage } from '@/shared/api/filesApi'
import { useAlert } from '@/app/providers/AlertProvider'
import { isAdmin } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner, EmptyState } from '@/shared/ui/academis'
import NewsFormModal from './components/NewsFormModal'
import '../secondary-academis.css'

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

  const locale = i18n.language === 'kz' ? 'kk-KZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'

  const loadNews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getNews()
      const list = Array.isArray(res.data) ? res.data : []
      setItems([...list].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)))
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

    const body = { title, shortDescription, content }
    setSaving(true)
    try {
      if (editingId != null) {
        await updateNews(editingId, { ...body, removeImage, imageFileId: uploadedImageFileId })
        toast(t('adminNewsPage.updated'), 'success')
      } else {
        await createNews({ ...body, imageFileId: uploadedImageFileId })
        toast(t('adminNewsPage.created'), 'success')
      }
      closeModal()
      loadNews()
    } catch (err) {
      if (err.response?.status === 403) {
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

  if (!isAdmin(auth)) return null

  return (
    <div className="page page-wide">
      <PageHeader
        title={t('adminNewsPage.title')}
        subtitle={`${items.length} ${t('adminNewsPage.headline').toLowerCase()}`}
        back="/"
        actions={(
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Icon name="plus" size={16} />
            {t('adminNewsPage.newItem')}
          </button>
        )}
      />

      {loading ? (
        <div className="secondary-page-loading">
          <Spinner size={28} />
          <span className="muted">{t('adminNewsPage.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon="news" title={t('adminNewsPage.empty')} />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('adminNewsPage.headline')}</th>
                  <th>{t('adminNewsPage.author')}</th>
                  <th>{t('adminNewsPage.published')}</th>
                  <th style={{ width: 100 }}>{t('adminNewsPage.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className="row gap10" style={{ alignItems: 'center' }}>
                        <span className="news-dot" style={{ background: 'var(--brand)' }} />
                        <div>
                          <Link to={`/news/${n.id}`} style={{ fontWeight: 600 }}>
                            {n.title}
                          </Link>
                          {n.shortDescription && (
                            <div className="dim clamp-1" style={{ fontSize: 12, marginTop: 2 }}>
                              {n.shortDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="muted">{n.authorName || '—'}</td>
                    <td className="muted">{formatTime(n.publishedAt, locale)}</td>
                    <td>
                      <div className="row gap4">
                        <button
                          type="button"
                          className="btn btn-icon btn-ghost btn-sm"
                          title={t('adminNewsPage.edit')}
                          onClick={() => openEdit(n.id)}
                          disabled={loadingOne}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-ghost btn-sm"
                          title={t('adminNewsPage.delete')}
                          onClick={() => handleDelete(n.id)}
                        >
                          <Icon name="trash" size={15} style={{ color: 'var(--brand)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewsFormModal
        open={modalOpen}
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
    </div>
  )
}

export default AdminNews
