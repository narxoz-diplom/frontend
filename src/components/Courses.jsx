import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiTrash2, FiUserPlus, FiCheckCircle, FiChevronRight } from 'react-icons/fi'
import api from '../services/api'
import { useAlert } from '../context/AlertProvider'
import { canUpload, isTeacher, isAdmin } from '../utils/roles'
import { pickLocalized } from '../i18n/localize'
import { useTranslation } from 'react-i18next'
import './Courses.css'
import CreateCourseModal from './CreateCourseModal';

const Courses = () => {
  const { t } = useTranslation()
  const { confirm, toast } = useAlert()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', imageUrl: '' })
  const [enrolledCourses, setEnrolledCourses] = useState(new Set())
  const [enrolling, setEnrolling] = useState(new Set())
  const [filter, setFilter] = useState('all') // 'all' или 'enrolled'
  const [courseViews, setCourseViews] = useState({}) // { courseId: views }
  const [deletingCourseId, setDeletingCourseId] = useState(null)

  useEffect(() => {
    if (filter === 'enrolled') {
      loadEnrolledCourses()
    } else {
      loadCourses()
    }
  }, [filter])

  const loadCourses = async () => {
    try {
      setLoading(true)
      // Для студента «все курсы» = каталог PUBLISHED; GET /courses отдаёт только записанные / allowedEmails
      const catalogUrl = canUpload(window.keycloak) ? '/courses' : '/courses/published'
      const response = await api.get(catalogUrl)
      setCourses(response.data)
      
      // Извлекаем список записанных курсов
      const enrolled = new Set()
      response.data.forEach(course => {
        if (course.enrolledStudents && Array.isArray(course.enrolledStudents)) {
          const userId = window.keycloak?.tokenParsed?.sub
          if (userId && course.enrolledStudents.includes(userId)) {
            enrolled.add(course.id)
          }
        }
      })
      setEnrolledCourses(enrolled)
      
      // Загружаем просмотры для каждого курса
      const viewsMap = {}
      for (const course of response.data) {
        try {
          const viewsResponse = await api.get(`/courses/${course.id}/views`)
          viewsMap[course.id] = viewsResponse.data || 0
        } catch (err) {
          console.error(`Error loading views for course ${course.id}:`, err)
          viewsMap[course.id] = 0
        }
      }
      setCourseViews(viewsMap)
      
      setError(null)
    } catch (err) {
      setError(t('coursesPage.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/courses/enrolled')
      setCourses(response.data)
      
      // Все загруженные курсы - это записанные курсы
      const enrolled = new Set(response.data.map(course => course.id))
      setEnrolledCourses(enrolled)
      
      // Загружаем просмотры для каждого курса
      const viewsMap = {}
      for (const course of response.data) {
        try {
          const viewsResponse = await api.get(`/courses/${course.id}/views`)
          viewsMap[course.id] = viewsResponse.data || 0
        } catch (err) {
          console.error(`Error loading views for course ${course.id}:`, err)
          viewsMap[course.id] = 0
        }
      }
      setCourseViews(viewsMap)
      
      setError(null)
    } catch (err) {
      console.error('Error loading enrolled courses:', err)
      setError(t('coursesPage.enrolledLoadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/courses', {
        ...newCourse,
        status: 'DRAFT'
      })
      setCourses([...courses, response.data])
      setShowCreateForm(false)
      setNewCourse({ title: '', description: '', imageUrl: '' })
    } catch (err) {
      console.error('Error creating course:', err)
      setError(t('coursesPage.createError'))
    }
  }

  const handleEnroll = async (courseId) => {
    if (enrolling.has(courseId)) {
      return // Уже идет процесс записи
    }

    setEnrolling(prev => new Set(prev).add(courseId))
    setError(null)
    setSuccess(null)

    try {
      await api.post(`/courses/${courseId}/enroll`)
      
      // Обновляем состояние записанных курсов
      setEnrolledCourses(prev => new Set(prev).add(courseId))
      
      // Находим курс для отображения сообщения
      const course = courses.find(c => c.id === courseId)
      setSuccess(t('coursesPage.enrollSuccess', { title: pickLocalized(course, 'title') || t('common.course') }))
      
      // Скрываем сообщение через 5 секунд
      setTimeout(() => {
        setSuccess(null)
      }, 5000)
      
      // Перезагружаем список курсов для обновления данных
      if (filter === 'enrolled') {
        loadEnrolledCourses()
      } else {
        loadCourses()
      }
    } catch (err) {
      console.error('Error enrolling in course:', err)
      setError(err.response?.data?.message || t('coursesPage.enrollError'))
    } finally {
      setEnrolling(prev => {
        const newSet = new Set(prev)
        newSet.delete(courseId)
        return newSet
      })
    }
  }

  const isEnrolled = (courseId) => {
    return enrolledCourses.has(courseId)
  }

  const canDeleteCourse = (course) => {
    if (!canUpload(window.keycloak)) return false
    const sub = window.keycloak?.tokenParsed?.sub
    if (isAdmin(window.keycloak)) return true
    return sub && course.instructorId === sub
  }

  const handleDeleteCourse = async (course) => {
    const ok = await confirm({
      title: t('coursesPage.deleteTitle'),
      message: t('coursesPage.deleteMessage', { title: pickLocalized(course, 'title') || course.title }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    setDeletingCourseId(course.id)
    setError(null)
    try {
      await api.delete(`/courses/${course.id}`)
      setCourses((prev) => prev.filter((c) => c.id !== course.id))
      toast(t('coursesPage.deleted'), 'success')
    } catch (err) {
      console.error('Error deleting course:', err)
      setError(err.response?.data?.message || t('coursesPage.deleteError'))
    } finally {
      setDeletingCourseId(null)
    }
  }

  if (loading) {
    return <div className="loading">{t('coursesPage.loading')}</div>
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>{t('coursesPage.title')}</h1>
        <div className="courses-header-actions">
          {!isTeacher(window.keycloak) && !isAdmin(window.keycloak) && (
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('coursesPage.allCourses')}
              </button>
              <button
                className={`filter-btn ${filter === 'enrolled' ? 'active' : ''}`}
                onClick={() => setFilter('enrolled')}
              >
                {t('coursesPage.myEnrolled')}
              </button>
            </div>
          )}
          {canUpload(window.keycloak) && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? t('common.cancel') : `+ ${t('coursesPage.createNew')}`}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <CreateCourseModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
      />

      <div className="courses-grid">
        {courses.length === 0 ? (
          <p className="courses-empty">{t('coursesPage.noCourses')}</p>
        ) : (
          courses.map((course) => (
            <article key={course.id} className="course-card">
              <div className={`course-card__media${course.imageUrl ? '' : ' course-card__media--placeholder'}`}>
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt="" decoding="async" />
                ) : (
                  <span className="course-card__media-fallback" aria-hidden>
                    {String(pickLocalized(course, 'title') || course.title || '?').slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="course-card__body">
                <div className="course-card__head">
                  <span
                    className={`course-card__status course-card__status--${String(course.status || 'unknown').toLowerCase()}`}
                  >
                    {course.status || '—'}
                  </span>
                </div>
                <h3 className="course-card__title">{pickLocalized(course, 'title')}</h3>
                <p className="course-card__description">
                  {pickLocalized(course, 'description') || t('coursesPage.noDescription')}
                </p>
                <div className="course-card__meta">
                  {course.lessons && (
                    <span className="course-card__stat">
                      {course.lessons.length} {t('coursesPage.lessonsSuffix')}
                    </span>
                  )}
                  {courseViews[course.id] !== undefined && (
                    <span className="course-card__stat course-card__stat--views">
                      <FiEye aria-hidden /> {courseViews[course.id] || 0}
                    </span>
                  )}
                </div>
                <div className="course-card__footer">
                  <div className="course-card__actions">
                    <Link to={`/courses/${course.id}`} className="course-card__btn course-card__btn--outline">
                      <span>{t('coursesPage.viewCourse')}</span>
                      <FiChevronRight className="course-card__btn-icon" aria-hidden />
                    </Link>
                    {!isTeacher(window.keycloak) && !isAdmin(window.keycloak) && (
                      isEnrolled(course.id) ? (
                        <span className="course-card__enrolled-pill" title={t('coursesPage.alreadyEnrolled')}>
                          <FiCheckCircle aria-hidden />
                          {t('coursesPage.enrolled')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="course-card__btn course-card__btn--enroll"
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrolling.has(course.id)}
                          title={t('coursesPage.enrollCourse')}
                        >
                          {enrolling.has(course.id) ? (
                            t('coursesPage.enrolling')
                          ) : (
                            <>
                              <FiUserPlus className="course-card__btn-icon course-card__btn-icon--left" aria-hidden />
                              {t('coursesPage.enroll')}
                            </>
                          )}
                        </button>
                      )
                    )}
                  </div>
                  {canDeleteCourse(course) && (
                    <button
                      type="button"
                      className="course-card__icon-btn"
                      onClick={() => handleDeleteCourse(course)}
                      disabled={deletingCourseId === course.id}
                      title={t('coursesPage.deleteCourse')}
                    >
                      {deletingCourseId === course.id ? '…' : <FiTrash2 aria-hidden />}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default Courses


