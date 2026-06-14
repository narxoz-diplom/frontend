import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '@/app/providers/AlertProvider'
import auth from '@/shared/config/auth'
import { canUpload, isAdmin } from '@/shared/lib/roles'
import { pickLocalized } from '@/i18n/localize'
import {
  getCourses,
  getEnrolledCourses,
  getCourseViews,
  enrollInCourse,
  deleteCourse
} from '@/shared/api/coursesApi'

const loadViewsMap = async (courses) => {
  const viewsMap = {}
  for (const course of courses) {
    try {
      const viewsResponse = await getCourseViews(course.id)
      viewsMap[course.id] = viewsResponse.data || 0
    } catch {
      viewsMap[course.id] = 0
    }
  }
  return viewsMap
}

export const useCourses = () => {
  const { t } = useTranslation()
  const { confirm, toast } = useAlert()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState(new Set())
  const [enrolling, setEnrolling] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const [courseViews, setCourseViews] = useState({})
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
      const response = await getCourses()
      setCourses(response.data)

      const enrolled = new Set()
      response.data.forEach(course => {
        if (course.enrolledStudents && Array.isArray(course.enrolledStudents)) {
          const userId = auth.tokenParsed?.sub
          if (userId && course.enrolledStudents.includes(userId)) {
            enrolled.add(course.id)
          }
        }
      })
      setEnrolledCourses(enrolled)
      setCourseViews(await loadViewsMap(response.data))
      setError(null)
    } catch {
      setError(t('coursesPage.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true)
      const response = await getEnrolledCourses()
      setCourses(response.data)
      setEnrolledCourses(new Set(response.data.map(course => course.id)))
      setCourseViews(await loadViewsMap(response.data))
      setError(null)
    } catch {
      setError(t('coursesPage.enrolledLoadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    if (enrolling.has(courseId)) {
      return
    }

    setEnrolling(prev => new Set(prev).add(courseId))
    setError(null)
    setSuccess(null)

    try {
      await enrollInCourse(courseId)
      setEnrolledCourses(prev => new Set(prev).add(courseId))

      const course = courses.find(c => c.id === courseId)
      setSuccess(t('coursesPage.enrollSuccess', { title: pickLocalized(course, 'title') || t('common.course') }))
      setTimeout(() => {
        setSuccess(null)
      }, 5000)

      if (filter === 'enrolled') {
        loadEnrolledCourses()
      } else {
        loadCourses()
      }
    } catch (err) {
      setError(err.response?.data?.message || t('coursesPage.enrollError'))
    } finally {
      setEnrolling(prev => {
        const newSet = new Set(prev)
        newSet.delete(courseId)
        return newSet
      })
    }
  }

  const isEnrolled = (courseId) => enrolledCourses.has(courseId)

  const canDeleteCourse = (course) => {
    if (!canUpload(auth)) return false
    const sub = auth.tokenParsed?.sub
    if (isAdmin(auth)) return true
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
      await deleteCourse(course.id)
      setCourses((prev) => prev.filter((c) => c.id !== course.id))
      toast(t('coursesPage.deleted'), 'success')
    } catch (err) {
      setError(err.response?.data?.message || t('coursesPage.deleteError'))
    } finally {
      setDeletingCourseId(null)
    }
  }

  return {
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
  }
}
