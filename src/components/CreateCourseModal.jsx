import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX } from 'react-icons/fi'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import './CreateCourseModal.css'

const CreateCourseModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await api.post('/courses', {
        ...form,
        status: 'DRAFT'
      })
      onClose()
      setForm({ title: '', description: '' })
      navigate(`/courses/${response.data.id}/edit`)
    } catch (err) {
      console.error('Error creating course:', err)
      setError(err.response?.data?.message || t('courseModal.createError'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="create-course-modal-overlay" onClick={onClose}>
      <div className="create-course-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-course-modal-header">
          <h2>{t('courseModal.title')}</h2>
          <button className="create-course-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="create-course-form">
          <div className="form-group">
            <label>{t('courseModal.courseTitle')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder={t('courseModal.courseTitlePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label>{t('courseModal.courseDescription')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="5"
              required
              placeholder={t('courseModal.courseDescriptionPlaceholder')}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('courseModal.createLoading') : t('courseModal.title')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCourseModal
