import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { canUpload, isTeacher, isAdmin } from '../utils/roles'
import './Courses.css'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', imageUrl: '' })
  const [enrolledCourses, setEnrolledCourses] = useState(new Set())
  const [enrolling, setEnrolling] = useState(new Set())
  const [filter, setFilter] = useState('all') // 'all' или 'enrolled'

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
      const response = await api.get('/courses')
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
      
      setError(null)
    } catch (err) {
      setError('Failed to load courses')
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
      
      setError(null)
    } catch (err) {
      console.error('Error loading enrolled courses:', err)
      setError('Не удалось загрузить записанные курсы')
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
      setError('Failed to create course')
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
      setSuccess(`Вы успешно записались на курс "${course?.title || 'курс'}"!`)
      
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
      setError(err.response?.data?.message || 'Не удалось записаться на курс. Попробуйте еще раз.')
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

  if (loading) {
    return <div className="loading">Loading courses...</div>
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>Courses</h1>
        <div className="courses-header-actions">
          {!isTeacher(window.keycloak) && !isAdmin(window.keycloak) && (
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Все курсы
              </button>
              <button
                className={`filter-btn ${filter === 'enrolled' ? 'active' : ''}`}
                onClick={() => setFilter('enrolled')}
              >
                Мои записанные курсы
              </button>
            </div>
          )}
          {canUpload(window.keycloak) && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : '+ Create Course'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showCreateForm && (
        <div className="card create-course-form">
          <h3>Create New Course</h3>
          <form onSubmit={handleCreateCourse}>
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newCourse.description}
                onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label>Image URL (optional)</label>
              <input
                type="url"
                value={newCourse.imageUrl}
                onChange={(e) => setNewCourse({...newCourse, imageUrl: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Course</button>
          </form>
        </div>
      )}

      <div className="courses-grid">
        {courses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
            No courses available yet
          </p>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="course-card">
              {course.imageUrl && (
                <div className="course-image">
                  <img src={course.imageUrl} alt={course.title} />
                </div>
              )}
              <div className="course-content">
                <h3>{course.title}</h3>
                <p className="course-description">
                  {course.description || 'No description available'}
                </p>
                <div className="course-meta">
                  <span className="course-status">{course.status}</span>
                  {course.lessons && (
                    <span className="course-lessons">
                      {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="course-actions">
                  <Link to={`/courses/${course.id}`} className="btn btn-primary">
                    View Course
                  </Link>
                  {!isTeacher(window.keycloak) && !isAdmin(window.keycloak) && (
                    <button
                      className={`btn ${isEnrolled(course.id) ? 'btn-secondary' : 'btn-success'}`}
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling.has(course.id) || isEnrolled(course.id)}
                      title={isEnrolled(course.id) ? 'Вы уже записаны на этот курс' : 'Записаться на курс'}
                    >
                      {enrolling.has(course.id) 
                        ? 'Запись...' 
                        : isEnrolled(course.id) 
                        ? '✓ Записан' 
                        : 'Enroll'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Courses


