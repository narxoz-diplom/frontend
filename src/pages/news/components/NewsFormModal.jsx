import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalHeader } from '@/shared/ui/academis'

const NewsFormModal = ({
  open,
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
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title={isEditing ? t('adminNewsPage.editTitle') : t('adminNewsPage.createTitle')}
        icon="news"
        iconBg="var(--brand)"
        onClose={onClose}
      />
      <form onSubmit={onSubmit}>
        <div className="modal-body col gap14">
          <div className="field">
            <label className="label" htmlFor="news-title">{t('adminNewsPage.titleField')}</label>
            <input
              id="news-title"
              className="input"
              type="text"
              value={form.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="news-short">{t('adminNewsPage.shortDescription')}</label>
            <textarea
              id="news-short"
              className="textarea"
              value={form.shortDescription}
              onChange={(e) => onFieldChange('shortDescription', e.target.value)}
              disabled={saving}
              rows={3}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="news-content">{t('adminNewsPage.fullText')}</label>
            <textarea
              id="news-content"
              className="textarea"
              value={form.content}
              onChange={(e) => onFieldChange('content', e.target.value)}
              disabled={saving}
              rows={10}
              required
            />
          </div>
          <div className="field">
            <span className="label">{t('common.photo') || 'Фото'}</span>
            {form.imageUrl && !removeImage ? (
              <div className="row gap12 wrap" style={{ marginBottom: 10 }}>
                <img
                  src={form.imageUrl}
                  alt=""
                  style={{
                    width: 160,
                    height: 90,
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                />
                <label className="row gap8" style={{ alignItems: 'center' }}>
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
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('adminNewsPage.saving') : isEditing ? t('common.save') : t('adminNewsPage.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewsFormModal
