import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createCourse } from '@/shared/api/coursesApi'
import { Modal, ModalHeader, Icon, Spinner } from '@/shared/ui/academis'

const CreateCourseModal = ({ isOpen, open, onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const visible = open ?? isOpen
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (visible) {
      setForm({ title: '', description: '', imageUrl: '' })
      setError(null)
    }
  }, [visible])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await createCourse({
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        status: 'DRAFT',
      })
      onClose()
      setForm({ title: '', description: '', imageUrl: '' })
      navigate(`/courses/${response.data.id}/edit`)
    } catch (err) {
      setError(err.response?.data?.message || t('courseModal.createError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalHeader
        title={t('courseModal.title')}
        subtitle={
          t('courseModal.subtitle', {
            defaultValue: 'Создайте курс и наполните его с помощью ИИ',
          })
        }
        icon="plus"
        iconBg="var(--brand)"
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="field">
            <label className="label" htmlFor="course-title">
              {t('courseModal.courseTitle')}
              <span style={{ color: 'var(--brand)' }}> *</span>
            </label>
            <input
              id="course-title"
              className="input"
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              placeholder={t('courseModal.courseTitlePlaceholder')}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="course-description">
              {t('courseModal.courseDescription')}
              <span style={{ color: 'var(--brand)' }}> *</span>
            </label>
            <textarea
              id="course-description"
              className="input"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={5}
              required
              placeholder={t('courseModal.courseDescriptionPlaceholder')}
              style={{ resize: 'vertical', minHeight: 110 }}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="course-image">
              {t('courseModal.courseImageUrl', { defaultValue: 'URL обложки' })}
            </label>
            <input
              id="course-image"
              className="input"
              type="url"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {error && (
            <div className="courses-flash courses-flash--error" style={{ marginTop: 4 }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner size={15} color="#fff" />
                {t('courseModal.createLoading')}
              </>
            ) : (
              <>
                <Icon name="plus" size={16} />
                {t('courseModal.title')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateCourseModal
