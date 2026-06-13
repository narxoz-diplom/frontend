import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import { fetchTeacherCourses } from '@/shared/api/teacherGradesApi'
import { resolveApiError } from '@/shared/lib/apiError'
import { Spinner, EmptyState } from '@/shared/ui/academis'
import GradesCourseCard from '@/pages/grades/GradesCourseCard'

function getCourseId(course) {
  return String(course?.id ?? course?.courseId ?? course?.uuid ?? '').trim()
}

export default function TeacherGradesCourses() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { courses: list } = await fetchTeacherCourses()
        if (!cancelled) setCourses(list || [])
      } catch (e) {
        if (!cancelled) {
          setError(resolveApiError(e, t, 'teacherGrades.loadCoursesError'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const getStudentCount = (course) => {
    if (typeof course.studentCount === 'number') return course.studentCount
    if (Array.isArray(course.enrolledStudents)) return course.enrolledStudents.length
    if (typeof course.enrolledCount === 'number') return course.enrolledCount
    return 0
  }

  if (loading) {
    return (
      <div className="grades-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <>
      {error && <div className="secondary-flash secondary-flash--error">{error}</div>}

      {courses.length === 0 ? (
        <EmptyState
          icon="grade"
          title={t('teacherGrades.noCourses')}
          desc={t('teacherGrades.openJournal')}
        />
      ) : (
        <div className="grades-grid">
          {courses.map((course, index) => {
            const courseId = getCourseId(course)
            const title = pickLocalized(course, 'title')
            const count = getStudentCount(course)
            const stats = []
            if (count > 0) {
              stats.push({
                key: 'students',
                icon: 'users',
                label: t('teacherGrades.studentCount', { count }),
              })
            }
            return (
              <GradesCourseCard
                key={courseId || `course-${index}`}
                course={course}
                index={index}
                to={`/teacher/grades/${courseId}`}
                state={{ courseTitle: title }}
                actionLabel={t('teacherGrades.openJournal')}
                stats={stats}
              />
            )
          })}
        </div>
      )}
    </>
  )
}
