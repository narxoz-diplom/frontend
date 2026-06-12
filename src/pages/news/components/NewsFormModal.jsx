import React from 'react'
import { FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const NewsFormModal = ({
  isEditing,
  form,
  saving,
  removeImage,
  onFieldChange,
  onRemoveImageChange,
  onImageFileChange,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation()

  return (
    <div className="admin-news-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-news-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-news-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-news-modal-head">
          <h2 id="admin-news-modal-title">
            {isEditing ? t('adminNewsPage.editTitle') : t('adminNewsPage.createTitle')}
          </h2>
          <button
            type="button"
            className="admin-news-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label={t('courseEdit.closeLabel')}
          >
            <FiX />
          </button>
        </div>
        <form className="admin-news-form" onSubmit={onSubmit}>
          <label className="admin-news-field">
            <span>{t('adminNewsPage.titleField')}</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              disabled={saving}
              required
            />
          </label>
          <label className="admin-news-field">
            <span>{t('adminNewsPage.shortDescription')}</span>
            <textarea
              value={form.shortDescription}
              onChange={(e) => onFieldChange('shortDescription', e.target.value)}
              disabled={saving}
              rows={3}
              required
            />
          </label>
          <label className="admin-news-field">
            <span>{t('adminNewsPage.fullText')}</span>
            <textarea
              value={form.content}
              onChange={(e) => onFieldChange('content', e.target.value)}
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
                    onChange={(e) => onRemoveImageChange(e.target.checked)}
                    disabled={saving}
                  />
                  {t('common.remove') || 'Удалить фото'}
                </label>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageFileChange(e.target.files?.[0] || null)}
              disabled={saving}
            />
          </div>
          <div className="admin-news-modal-foot">
            <button type="button" className="admin-news-btn-secondary" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="admin-news-btn-primary" disabled={saving}>
              {saving ? t('adminNewsPage.saving') : isEditing ? t('common.save') : t('adminNewsPage.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewsFormModal
