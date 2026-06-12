import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAlert } from '@/app/providers/AlertProvider'
import { pickLocalized } from '@/i18n/localize'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import {
  getCourse,
  getCourseParticipants,
  getCourseViews,
  enrollInCourse,
  updateCourseStatus
} from '@/shared/api/coursesApi'
import { getLessons, createLesson } from '@/shared/api/lessonsApi'
import { getCourseTests } from '@/shared/api/testsApi'
import { getLessonFiles, uploadToLesson, downloadFile, deleteFile } from '@/shared/api/filesApi'

export const MIN_LESSON_CONTENT_LENGTH = 50

export const useCourseDetail = (id) => {
  const { t } = useTranslation()
  const { confirm, toast } = useAlert()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [tests, setTests] = useState([])
  const [lessonFiles, setLessonFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [newLesson, setNewLesson] = useState({ title: '', description: '', content: '', orderNumber: 1 })
  const [uploadingFile, setUploadingFile] = useState(null)
  const [statusChanging, setStatusChanging] = useState(false)
  const [lessonProgress, setLessonProgress] = useState({})
  const [courseViews, setCourseViews] = useState(0)
  const [participantsAccess, setParticipantsAccess] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    loadCourse()
  }, [id])

  const loadProgress = () => {
    if (typeof Storage === 'undefined') return
    const progressData = localStorage.getItem('videoProgress')
    if (!progressData) return
    try {
      const progress = JSON.parse(progressData)
      const lessonProgressMap = {}

      Object.keys(progress).forEach(key => {
        const [courseId, lessonId, videoId] = key.split('-')
        if (courseId === id) {
          if (!lessonProgressMap[lessonId]) {
            lessonProgressMap[lessonId] = { completed: 0, total: 0, videos: {} }
          }
          lessonProgressMap[lessonId].videos[videoId] = progress[key]
          lessonProgressMap[lessonId].total++
          if (progress[key].completed) {
            lessonProgressMap[lessonId].completed++
          }
        }
      })

      const progressPercentages = {}
      Object.keys(lessonProgressMap).forEach(lessonId => {
        const lesson = lessonProgressMap[lessonId]
        progressPercentages[lessonId] = {
          completed: lesson.completed === lesson.total && lesson.total > 0,
          progress: lesson.total > 0 ? (lesson.completed / lesson.total) * 100 : 0
        }
      })

      setLessonProgress(progressPercentages)
    } catch {}
  }

  const loadCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getCourse(id)
      const { course: courseData, preview } = normalizeCourseViewerResponse(response.data)
      setCourse(courseData)
      setPreviewMode(preview)

      if (preview) {
        setLessons([])
        setTests([])
        setLessonFiles({})
        setParticipantsAccess(false)
      } else {
        try {
          await getCourseParticipants(id)
          setParticipantsAccess(true)
        } catch {
          setParticipantsAccess(false)
        }
        await loadLessons()
        await loadTests()
        loadProgress()
      }

      try {
        const viewsResponse = await getCourseViews(id)
        setCourseViews(viewsResponse.data || 0)
      } catch {
        setCourseViews(0)
      }
    } catch {
      setError(t('coursePage.loadCourseError'))
      setCourse(null)
      setPreviewMode(false)
      setParticipantsAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollFromPreview = async () => {
    if (enrolling) return
    setEnrolling(true)
    setError(null)
    try {
      await enrollInCourse(id)
      toast(t('coursesPage.enrollSuccess', { title: pickLocalized(course, 'title') || t('common.course') }), 'success')
      await loadCourse()
    } catch (err) {
      setError(err.response?.data?.message || t('coursesPage.enrollError'))
    } finally {
      setEnrolling(false)
    }
  }

  const statusLabelFor = (s) =>
    s === 'PUBLISHED'
      ? t('dashboard.published')
      : s === 'DRAFT'
        ? t('common.draft')
        : s === 'ARCHIVED'
          ? t('common.archived')
          : s

  const handleStatusChange = async (newStatus) => {
    if (newStatus === course?.status) return

    const ok = await confirm({
      title: t('coursePage.changeStatusTitle'),
      message: t('coursePage.changeStatusMessage', { status: statusLabelFor(newStatus) }),
      confirmText: t('common.edit'),
      cancelText: t('common.cancel'),
      variant: 'default'
    })
    if (!ok) return

    setStatusChanging(true)
    try {
      const response = await updateCourseStatus(id, newStatus)
      setCourse(response.data)
      setError(null)
      toast(t('coursePage.statusChanged', { status: statusLabelFor(newStatus) }), 'success')
    } catch {
      setError(t('coursePage.statusChangeError'))
    } finally {
      setStatusChanging(false)
    }
  }

  const loadTests = async () => {
    try {
      const response = await getCourseTests(id)
      setTests(response.data || [])
    } catch {}
  }

  const loadLessons = async () => {
    try {
      const response = await getLessons(id)
      const lessonsData = response.data
      setLessons(lessonsData)

      const filesMap = {}
      for (const lesson of lessonsData) {
        try {
          const filesResponse = await getLessonFiles(lesson.id)
          filesMap[lesson.id] = filesResponse.data
        } catch {
          filesMap[lesson.id] = []
        }
      }
      setLessonFiles(filesMap)
      loadProgress()
    } catch {
      setError(t('coursePage.loadLessonsError'))
    }
  }

  const openLessonForm = () => {
    setNewLesson({
      title: '',
      description: '',
      content: '',
      orderNumber: lessons.length + 1
    })
    setShowLessonForm(true)
  }

  const closeLessonForm = () => {
    setShowLessonForm(false)
  }

  const handleCreateLesson = async (e) => {
    e.preventDefault()
    const trimmedContent = (newLesson.content || '').trim()
    if (trimmedContent.length < MIN_LESSON_CONTENT_LENGTH) {
      setError(t('coursePage.lessonContentTooShort', { min: MIN_LESSON_CONTENT_LENGTH }))
      return
    }
    try {
      const payload = { ...newLesson, content: trimmedContent }
      const response = await createLesson(id, payload)
      const newLessonData = response.data
      setLessons((prev) => [...prev, newLessonData])
      setLessonFiles({ ...lessonFiles, [newLessonData.id]: [] })
      setShowLessonForm(false)
      setNewLesson({
        title: '',
        description: '',
        content: '',
        orderNumber: (newLessonData.orderNumber ?? 0) + 1
      })
      setError(null)
    } catch (err) {
      const status = err.response?.status
      const body = err.response?.data
      const msg =
        typeof body === 'string'
          ? body
          : body?.message || (Array.isArray(body?.errors) ? body.errors.map((x) => x?.defaultMessage || x).join(' ') : null)
      if (status === 403) {
        setError(msg || t('coursePage.createLessonForbidden'))
      } else if (msg) {
        setError(msg)
      } else {
        setError(t('coursePage.createLessonError'))
      }
    }
  }

  const handleFileUpload = async (lessonId, file) => {
    try {
      setUploadingFile({ ...uploadingFile, [lessonId]: true })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('lessonId', lessonId)

      const response = await uploadToLesson(formData)
      setLessonFiles({
        ...lessonFiles,
        [lessonId]: [...(lessonFiles[lessonId] || []), response.data]
      })
    } catch (err) {
      const apiError = err.response?.data?.message || err.response?.data?.error
      if (err.response?.status === 413 || err.response?.status === 400) {
        setError(apiError ||
          'File size too large. Maximum allowed size is 2GB. Please upload a smaller file.')
      } else if (apiError) {
        setError(apiError)
      } else {
        setError('Failed to upload file. Please try again.')
      }
    } finally {
      setUploadingFile({ ...uploadingFile, [lessonId]: false })
    }
  }

  const getCourseProgress = () => {
    if (lessons.length === 0) return 0
    const completedLessons = Object.values(lessonProgress).filter(p => p.completed).length
    return (completedLessons / lessons.length) * 100
  }

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const response = await downloadFile(fileId)
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to download file. Please try again.')
    }
  }

  const handleDeleteFile = async (fileId, lessonId) => {
    const ok = await confirm({
      title: t('filesPage.deleteTitle'),
      message: t('filesPage.deleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteFile(fileId)
      const filesResponse = await getLessonFiles(lessonId)
      setLessonFiles({
        ...lessonFiles,
        [lessonId]: filesResponse.data
      })
      setError(null)
    } catch {
      setError(t('filesPage.deleteError'))
    }
  }

  return {
    course,
    lessons,
    tests,
    lessonFiles,
    loading,
    error,
    previewMode,
    participantsAccess,
    courseViews,
    lessonProgress,
    enrolling,
    statusChanging,
    showLessonForm,
    newLesson,
    setNewLesson,
    uploadingFile,
    statusLabelFor,
    getCourseProgress,
    handleEnrollFromPreview,
    handleStatusChange,
    openLessonForm,
    closeLessonForm,
    handleCreateLesson,
    handleFileUpload,
    handleFileDownload,
    handleDeleteFile
  }
}
