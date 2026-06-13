import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import auth from '@/shared/config/auth'
import { canUpload, isTeacher, isAdmin } from '@/shared/lib/roles'
import { PageHeader, EmptyState, Icon, Spinner } from '@/shared/ui/academis'
import { useCourses } from './hooks/useCourses'
import CourseCard from './components/CourseCard'
import CourseListRow from './components/CourseListRow'
import CreateCourseModal from './CreateCourseModal'
import './Courses.css'

const Courses = () => {
  const { t } = useTranslation()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
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
    handleDeleteCourse,
  } = useCourses()

  const isStudentView = !isTeacher(auth) && !isAdmin(auth)
  const isTeacherView = canUpload(auth)

  useEffect(() => {
    const onOpenCreate = () => setShowCreateForm(true)
    window.addEventListener('open-create-course', onOpenCreate)
    return () => window.removeEventListener('open-create-course', onOpenCreate)
  }, [])

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return courses
    return courses.filter((course) => {
      const title = pickLocalized(course, 'title') || course.title || ''
      const description = pickLocalized(course, 'description') || course.description || ''
      return (
        title.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      )
    })
  }, [courses, search])

  const enrolledCount =
    filter === 'enrolled'
      ? courses.length
      : courses.filter((course) => isEnrolled(course.id)).length

  const subtitle = isTeacherView
    ? t('coursesPage.subtitleTeacher')
    : t('coursesPage.subtitleStudent')

  const searchPlaceholder = t('coursesPage.searchCourses')

  const emptyDesc = isTeacherView
    ? t('coursesPage.emptyTeacher')
    : t('coursesPage.emptyStudent')

  if (loading) {
    return (
      <div className="page page-wide courses-loading">
        <Spinner size={28} />
        <span className="muted">{t('coursesPage.loading')}</span>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      <PageHeader
        title={t('coursesPage.title')}
        subtitle={subtitle}
        actions={
          isTeacherView ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Icon name="plus" size={17} />
              {t('coursesPage.createNew')}
            </button>
          ) : null
        }
      />

      <div className="row between wrap gap12 courses-toolbar">
        <div className="row gap10 wrap">
          {isStudentView && (
            <div className="tabs">
              <button
                type="button"
                className={`tab${filter === 'all' ? ' active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('coursesPage.allCourses')}
              </button>
              <button
                type="button"
                className={`tab${filter === 'enrolled' ? ' active' : ''}`}
                onClick={() => setFilter('enrolled')}
              >
                {t('coursesPage.myEnrolled')}
                {enrolledCount > 0 && (
                  <span className="badge badge-red" style={{ height: 18, fontSize: 10.5 }}>
                    {enrolledCount}
                  </span>
                )}
              </button>
            </div>
          )}
          <div className="input-icon courses-search">
            <Icon name="search" size={16} />
            <input
              className="input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={`tab${view === 'grid' ? ' active' : ''}`}
            onClick={() => setView('grid')}
            title={t('coursesPage.viewGrid')}
          >
            <Icon name="grid" size={16} />
          </button>
          <button
            type="button"
            className={`tab${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')}
            title={t('coursesPage.viewList')}
          >
            <Icon name="list" size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="courses-flash courses-flash--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="courses-flash courses-flash--success" role="status">
          <Icon name="check" size={16} />
          {success}
        </div>
      )}

      <CreateCourseModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />

      {filteredCourses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="books"
            title={t('coursesPage.noCourses')}
            desc={emptyDesc}
            action={
              isTeacherView ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Icon name="plus" size={16} />
                  {t('coursesPage.createNew')}
                </button>
              ) : null
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="courses-grid">
          {filteredCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
              views={courseViews[course.id]}
              canEnroll={isStudentView}
              enrolled={isEnrolled(course.id)}
              enrolling={enrolling.has(course.id)}
              canDelete={canDeleteCourse(course)}
              deleting={deletingCourseId === course.id}
              onEnroll={handleEnroll}
              onDelete={handleDeleteCourse}
            />
          ))}
        </div>
      ) : (
        <div className="card courses-list-card">
          {filteredCourses.map((course, index) => (
            <CourseListRow
              key={course.id}
              course={course}
              views={courseViews[course.id]}
              last={index === filteredCourses.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Courses
