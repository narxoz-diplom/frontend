import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload, isTeacher, isAdmin } from '@/shared/lib/roles'
import { useCourses } from './hooks/useCourses'
import CourseCard from './components/CourseCard'
import CreateCourseModal from './CreateCourseModal'
import './Courses.css'

const Courses = () => {
  const { t } = useTranslation()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const {
    courses,
    loading,
    error,
    success,
    enrolling,
    filter,
    setFilter,
    courseViews,
    deletingCourseId,
    handleEnroll,
    isEnrolled,
    canDeleteCourse,
    handleDeleteCourse
  } = useCourses()

  const isStudentView = !isTeacher(auth) && !isAdmin(auth)

  if (loading) {
    return <div className="loading">{t('coursesPage.loading')}</div>
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>{t('coursesPage.title')}</h1>
        <div className="courses-header-actions">
          {isStudentView && (
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
          {canUpload(auth) && (
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
            <CourseCard
              key={course.id}
              course={course}
              views={courseViews[course.id]}
              canEnroll={isStudentView}
              enrolled={isEnrolled(course.id)}
              enrolling={enrolling.has(course.id)}
              canDelete={canDeleteCourse(course)}
              deleting={deletingCourseId === course.id}
              onEnroll={handleEnroll}
              onDelete={handleDeleteCourse}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Courses
