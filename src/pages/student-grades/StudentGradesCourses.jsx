import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import { getCourseViews } from '@/shared/api/coursesApi'
import {
  fetchEnrolledCourses,
  fetchMyGrades,
  courseGradeStats,
} from '@/shared/api/studentGradesApi'
import { Spinner, EmptyState } from '@/shared/ui/academis'
import GradesCourseCard from '@/pages/grades/GradesCourseCard'

function getCourseId(course) {
  return String(course?.id ?? course?.courseId ?? course?.uuid ?? '').trim()
}

export default function StudentGradesCourses() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [courseViews, setCourseViews] = useState({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [enrolled, myGrades] = await Promise.all([
          fetchEnrolledCourses(),
          fetchMyGrades().catch(() => []),
        ])
        if (cancelled) return

        const list = Array.isArray(enrolled) ? enrolled : []
        setCourses(list)
        setGrades(myGrades)

        const viewsMap = {}
        for (const course of list) {
          const id = getCourseId(course)
          if (!id) continue
          try {
            const viewsResponse = await getCourseViews(id)
            viewsMap[id] = viewsResponse.data || 0
          } catch {
            viewsMap[id] = 0
          }
        }
        if (!cancelled) setCourseViews(viewsMap)
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message || e.message || t('studentGrades.loadError'),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const gradesByCourse = useMemo(() => {
    const map = new Map()
    for (const g of grades) {
      const id = g.courseId || ''
      if (!map.has(id)) map.set(id, [])
      map.get(id).push(g)
    }
    return map
  }, [grades])

  if (loading) {
    return (
      <div className="grades-loading">
        <Spinner size={28} />
        <span className="muted">{t('coursesPage.loading')}</span>
      </div>
    )
  }

  return (
    <>
      {error && <div className="secondary-flash secondary-flash--error">{error}</div>}

      {courses.length === 0 ? (
        <EmptyState icon="grade" title={t('studentGrades.noCourses')} desc={t('studentGrades.subtitle')} />
      ) : (
        <div className="grades-grid">
          {courses.map((course, index) => {
            const courseId = getCourseId(course)
            const title = pickLocalized(course, 'title')
            const courseGrades = gradesByCourse.get(courseId) || []
            const { avgGrade, gradedCount } = courseGradeStats(courseGrades)
            const stats = []

            if (avgGrade !== null) {
              stats.push({
                key: 'avg',
                icon: 'grade',
                label: t('studentGrades.avgShort', { value: avgGrade }),
              })
            }
            if (gradedCount > 0) {
              stats.push({
                key: 'graded',
                label: t('studentGrades.gradedLessons', { count: gradedCount }),
              })
            }
            if (courseViews[courseId] !== undefined) {
              stats.push({
                key: 'views',
                icon: 'eye',
                label: String(courseViews[courseId] || 0),
              })
            }

            return (
              <GradesCourseCard
                key={courseId || course.id}
                course={course}
                index={index}
                to={`/my/grades/${courseId}`}
                state={{ courseTitle: title }}
                actionLabel={t('studentGrades.openCourse')}
                stats={stats}
              />
            )
          })}
        </div>
      )}
    </>
  )
}
