import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAlert } from '@/app/providers/AlertProvider'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { getCourse, getCourseParticipants, deleteCourse } from '@/shared/api/coursesApi'
import { getLessons, deleteLesson } from '@/shared/api/lessonsApi'
import { getCourseTests, updateTestSettings, generateTests } from '@/shared/api/testsApi'
import { getCourseFiles, uploadToCourse, ingestUrlToCourse, deleteFile } from '@/shared/api/filesApi'

export const useCourseEdit = (id, { buildGenerationExtras, onUsageSummary, canGenerate = true } = {}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { confirm } = useAlert()
  const [course, setCourse] = useState(null)
  const [courseFiles, setCourseFiles] = useState([])
  const [lessons, setLessons] = useState([])
  const [tests, setTests] = useState([])
  const [testMaxAttemptsDraft, setTestMaxAttemptsDraft] = useState({})
  const [testDueAtDraft, setTestDueAtDraft] = useState({})
  const [savingTestSettings, setSavingTestSettings] = useState({})
  const [participants, setParticipants] = useState(null)
  const [selectedLessonIds, setSelectedLessonIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [generatingTest, setGeneratingTest] = useState(false)
  const [testTitle, setTestTitle] = useState('')
  const [questionCount, setQuestionCount] = useState(8)
  const [testDifficulty, setTestDifficulty] = useState('medium')
  const [urlInput, setUrlInput] = useState('')
  const [ingestingUrl, setIngestingUrl] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [courseRes, filesRes, lessonsRes, testsRes] = await Promise.all([
        getCourse(id),
        getCourseFiles(id),
        getLessons(id),
        getCourseTests(id)
      ])
      const coursePayload = normalizeCourseViewerResponse(courseRes.data)
      setCourse(coursePayload.course)
      setCourseFiles(filesRes.data || [])
      setLessons(lessonsRes.data || [])
      const testsArr = Array.isArray(testsRes.data) ? testsRes.data : []
      setTests(testsArr)
      setTestMaxAttemptsDraft((prev) => {
        const next = { ...prev }
        for (const tst of testsArr) {
          const tid = tst?.id
          if (tid == null) continue
          if (next[tid] === undefined) {
            next[tid] = tst?.maxAttempts == null ? '' : String(tst.maxAttempts)
          }
        }
        return next
      })
      setTestDueAtDraft((prev) => {
        const next = { ...prev }
        for (const tst of testsArr) {
          const tid = tst?.id
          if (tid == null) continue
          if (next[tid] === undefined) {
            const raw = tst?.dueAt
            next[tid] = raw ? String(raw).slice(0, 16) : ''
          }
        }
        return next
      })
      try {
        const pr = await getCourseParticipants(id)
        setParticipants(pr.data)
      } catch {
        setParticipants(null)
      }
      setError(null)
    } catch {
      setError(t('courseEdit.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const updateTestMaxAttemptsDraft = (testId, value) => {
    setTestMaxAttemptsDraft((p) => ({ ...p, [testId]: value }))
  }

  const updateTestDueAtDraft = (testId, value) => {
    setTestDueAtDraft((p) => ({ ...p, [testId]: value }))
  }

  const saveTestSettings = async (testId) => {
    const raw = testMaxAttemptsDraft?.[testId]
    const trimmed = raw == null ? '' : String(raw).trim()
    const maxAttempts = trimmed === '' ? null : Number(trimmed)
    if (maxAttempts != null && (!Number.isFinite(maxAttempts) || maxAttempts < 1)) {
      setError(t('courseEdit.testMaxAttemptsInvalid'))
      return
    }
    const dueAtRaw = testDueAtDraft?.[testId]
    const dueAt = dueAtRaw == null || String(dueAtRaw).trim() === '' ? null : String(dueAtRaw).trim()
    setSavingTestSettings((p) => ({ ...p, [testId]: true }))
    setError(null)
    try {
      const res = await updateTestSettings(testId, { maxAttempts, dueAt })
      setTests((prev) =>
        prev.map((x) => (String(x.id) === String(testId) ? { ...x, ...res.data } : x))
      )
    } catch (err) {
      setError(err.response?.data?.message || t('courseEdit.testMaxAttemptsSaveError'))
    } finally {
      setSavingTestSettings((p) => ({ ...p, [testId]: false }))
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', id)
      await uploadToCourse(formData)
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || t('courseEdit.uploadError'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleIngestUrl = async () => {
    const u = urlInput.trim()
    if (!u) {
      setError(t('courseEdit.enterUrl'))
      return
    }
    setIngestingUrl(true)
    setError(null)
    try {
      await ingestUrlToCourse(id, u)
      setUrlInput('')
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || t('courseEdit.ingestError'))
    } finally {
      setIngestingUrl(false)
    }
  }

  const toggleLessonSelection = (lessonId) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
  }

  const handleGenerateTest = async () => {
    if (!canGenerate) {
      setError(t('courseEdit.aiModelUnavailable'))
      return
    }
    if (selectedLessonIds.size === 0) {
      setError(t('courseEdit.selectLesson'))
      return
    }
    setGeneratingTest(true)
    setError(null)
    try {
      const { data } = await generateTests(id, {
        fileIds: [],
        lessonIds: Array.from(selectedLessonIds),
        title: testTitle || t('courseEdit.defaultTestTitle'),
        questionCount: questionCount || undefined,
        difficulty: testDifficulty || undefined,
        ...(buildGenerationExtras?.() ?? {})
      })
      if (data?.usageSummary) {
        onUsageSummary?.(data.usageSummary)
      }
      loadData()
      setSelectedLessonIds(new Set())
      setTestTitle('')
    } catch (err) {
      setError(err.response?.data?.message || t('courseEdit.generateTestError'))
    } finally {
      setGeneratingTest(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    const ok = await confirm({
      title: t('courseEdit.deleteFileTitle'),
      message: t('courseEdit.deleteFileMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteFile(fileId)
      loadData()
    } catch {
      setError(t('courseEdit.deleteFileError'))
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    const ok = await confirm({
      title: t('courseEdit.deleteLessonTitle'),
      message: t('courseEdit.deleteLessonMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteLesson(lessonId)
      setSelectedLessonIds((prev) => {
        const next = new Set(prev)
        next.delete(lessonId)
        return next
      })
      loadData()
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || t('courseEdit.deleteLessonError'))
    }
  }

  const handleDeleteCourse = async () => {
    const ok = await confirm({
      title: t('courseEdit.deleteCourseTitle'),
      message: t('courseEdit.deleteCourseMessage', { title: course.title }),
      confirmText: t('courseEdit.deleteCourseConfirm'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    setDeletingCourse(true)
    setError(null)
    try {
      await deleteCourse(id)
      navigate('/courses')
    } catch (err) {
      setError(err.response?.data?.message || t('courseEdit.deleteCourseError'))
    } finally {
      setDeletingCourse(false)
    }
  }

  return {
    course,
    setCourse,
    courseFiles,
    lessons,
    tests,
    participants,
    loading,
    error,
    setError,
    loadData,
    testMaxAttemptsDraft,
    testDueAtDraft,
    savingTestSettings,
    updateTestMaxAttemptsDraft,
    updateTestDueAtDraft,
    saveTestSettings,
    uploading,
    handleFileUpload,
    urlInput,
    setUrlInput,
    ingestingUrl,
    handleIngestUrl,
    selectedLessonIds,
    toggleLessonSelection,
    testTitle,
    setTestTitle,
    questionCount,
    setQuestionCount,
    testDifficulty,
    setTestDifficulty,
    generatingTest,
    handleGenerateTest,
    handleDeleteFile,
    handleDeleteLesson,
    deletingCourse,
    handleDeleteCourse
  }
}
