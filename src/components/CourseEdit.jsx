import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiFile,
  FiBook,
  FiCheckSquare,
  FiUpload,
  FiLoader,
  FiTrash2,
  FiArrowLeft,
  FiMail,
  FiUserPlus,
  FiX,
  FiZap,
  FiLayers,
  FiEdit3,
  FiLink,
  FiCpu,
  FiPlus,
  FiClipboard,
  FiUsers
} from 'react-icons/fi'
import api from '../services/api'
import { pickLocalized } from '../i18n/localize'
import { useAlert } from '../context/AlertProvider'
import { canUpload } from '../utils/roles'
import { normalizeCourseViewerResponse } from '../utils/courseResponse'
import { useTranslation } from 'react-i18next'
import './CourseEdit.css'

const newOutlineRowId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `ol-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

/** Нормализация пункта плана из API (разные сервисы могут слать разные имена полей). */
const mapApiOutlineItem = (o, i) => {
  const summary =
    (typeof o.summary === 'string' && o.summary) ||
    (typeof o.description === 'string' && o.description) ||
    (typeof o.goal === 'string' && o.goal) ||
    (typeof o.objectives === 'string' && o.objectives) ||
    ''
  return {
    id: newOutlineRowId(),
    title: o.title || `Урок ${i + 1}`,
    summary,
    order: o.order != null ? o.order : i + 1,
    include: o.include !== false
  }
}

const courseEditGenSessionKey = (courseId) => `courseEditGen:${courseId}`

const CourseEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirm } = useAlert()
  const [course, setCourse] = useState(null)
  const [courseFiles, setCourseFiles] = useState([])
  const [lessons, setLessons] = useState([])
  const [tests, setTests] = useState([])
  const [participants, setParticipants] = useState(null)
  const [selectedFileIds, setSelectedFileIds] = useState(new Set())
  const [selectedLessonIds, setSelectedLessonIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [generatingLessons, setGeneratingLessons] = useState(false)
  const [generatingTest, setGeneratingTest] = useState(false)
  const [testTitle, setTestTitle] = useState('')
  const [allowedEmails, setAllowedEmails] = useState([])
  const [newEmailsText, setNewEmailsText] = useState('')
  const [savingEmails, setSavingEmails] = useState(false)
  const [showEmailsModal, setShowEmailsModal] = useState(false)
  const [emailModalError, setEmailModalError] = useState(null)
  const [deletingCourse, setDeletingCourse] = useState(false)

  const [genParams, setGenParams] = useState({
    teacherBrief: '',
    targetAudience: 'bachelor',
    minLessons: 5,
    maxLessons: 10,
    depth: 'medium',
    retrievalMode: 'full_collection',
    retrievalQuery: ''
  })
  const [outlineDraft, setOutlineDraft] = useState(null)
  const [outlineLoading, setOutlineLoading] = useState(false)
  const [lessonsJobId, setLessonsJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [jobProgress, setJobProgress] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [ingestingUrl, setIngestingUrl] = useState(false)
  const [questionCount, setQuestionCount] = useState(8)
  const [testDifficulty, setTestDifficulty] = useState('medium')
  const [quickGenLoading, setQuickGenLoading] = useState(false)
  const [backfillingLocales, setBackfillingLocales] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  useLayoutEffect(() => {
    if (!id) return
    try {
      const raw = sessionStorage.getItem(courseEditGenSessionKey(id))
      if (!raw) return
      const s = JSON.parse(raw)
      if (Array.isArray(s.selectedFileIds) && s.selectedFileIds.length > 0) {
        setSelectedFileIds(new Set(s.selectedFileIds))
      }
      if (s.outlineDraft && Array.isArray(s.outlineDraft) && s.outlineDraft.length > 0) {
        setOutlineDraft(s.outlineDraft)
      }
      if (s.genParams && typeof s.genParams === 'object') {
        setGenParams((prev) => ({ ...prev, ...s.genParams }))
      }
      if (s.lessonsJobId) {
        setLessonsJobId(s.lessonsJobId)
        setJobStatus(s.jobStatus || 'PENDING')
      }
    } catch (e) {
      console.warn('course edit gen session restore', e)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const hasDraft = outlineDraft && outlineDraft.length > 0
    const hasJob = !!lessonsJobId
    const hasFiles = selectedFileIds.size > 0
    if (!hasDraft && !hasJob && !hasFiles) {
      sessionStorage.removeItem(courseEditGenSessionKey(id))
      return
    }
    try {
      sessionStorage.setItem(
        courseEditGenSessionKey(id),
        JSON.stringify({
          selectedFileIds: Array.from(selectedFileIds),
          outlineDraft,
          genParams,
          lessonsJobId,
          jobStatus
        })
      )
    } catch (e) {
      console.warn('course edit gen session save', e)
    }
  }, [id, selectedFileIds, outlineDraft, genParams, lessonsJobId, jobStatus])

  useEffect(() => {
    if (!showEmailsModal) return
    const onEscape = (e) => {
      if (e.key === 'Escape') {
        closeEmailsModal()
      }
    }
    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [showEmailsModal])

  const loadData = async () => {
    try {
      setLoading(true)
      const [courseRes, filesRes, lessonsRes, testsRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/files/course/${id}`),
        api.get(`/courses/${id}/lessons`),
        api.get(`/courses/${id}/tests`)
      ])
      const coursePayload = normalizeCourseViewerResponse(courseRes.data)
      setCourse(coursePayload.course)
      setCourseFiles(filesRes.data || [])
      setLessons(lessonsRes.data || [])
      setTests(testsRes.data || [])
      setAllowedEmails(
        Array.isArray(coursePayload.course?.allowedEmails) ? coursePayload.course.allowedEmails : []
      )
      try {
        const pr = await api.get(`/courses/${id}/participants`)
        setParticipants(pr.data)
      } catch (pe) {
        console.warn('Course participants:', pe)
        setParticipants(null)
      }
      setError(null)
    } catch (err) {
      console.error('Error loading course:', err)
      setError(t('courseEdit.loadError'))
    } finally {
      setLoading(false)
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
      await api.post('/files/upload-to-course', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      loadData()
    } catch (err) {
      console.error('Error uploading file:', err)
      setError(err.response?.data?.message || t('courseEdit.uploadError'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const toggleFileSelection = (fileId) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) next.delete(fileId)
      else next.add(fileId)
      return next
    })
  }

  const toggleLessonSelection = (lessonId) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
  }

  const buildLessonParamsPayload = () => {
    const p = {}
    if (genParams.teacherBrief?.trim()) p.teacherBrief = genParams.teacherBrief.trim()
    if (genParams.targetAudience) p.targetAudience = genParams.targetAudience
    if (genParams.minLessons != null) p.minLessons = Number(genParams.minLessons)
    if (genParams.maxLessons != null) p.maxLessons = Number(genParams.maxLessons)
    if (genParams.depth) p.depth = genParams.depth
    if (genParams.retrievalMode) p.retrievalMode = genParams.retrievalMode
    if (genParams.retrievalQuery?.trim()) p.retrievalQuery = genParams.retrievalQuery.trim()
    return Object.keys(p).length ? p : undefined
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
      await api.post(`/files/course/${id}/ingest-url`, { url: u })
      setUrlInput('')
      loadData()
    } catch (err) {
      console.error('ingest url:', err)
      setError(err.response?.data?.message || t('courseEdit.ingestError'))
    } finally {
      setIngestingUrl(false)
    }
  }

  const handleGenerateOutline = async () => {
    if (selectedFileIds.size === 0) {
      setError(t('courseEdit.selectFile'))
      return
    }
    setOutlineLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/courses/${id}/lessons/generate-outline`, {
        fileIds: Array.from(selectedFileIds),
        topK: 200,
        params: buildLessonParamsPayload()
      })
      const rows = (data.outline || []).map((o, i) => mapApiOutlineItem(o, i))
      setOutlineDraft(rows.length > 0 ? rows : null)
    } catch (err) {
      console.error('outline:', err)
      setError(err.response?.data?.message || t('courseEdit.outlineError'))
    } finally {
      setOutlineLoading(false)
    }
  }

  const updateOutlineRow = (index, field, value) => {
    setOutlineDraft((prev) => {
      if (!prev) return prev
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const moveOutlineRow = (index, dir) => {
    setOutlineDraft((prev) => {
      if (!prev) return prev
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next.map((r, i) => ({ ...r, order: i + 1 }))
    })
  }

  const addOutlineRow = () => {
    setOutlineDraft((prev) => {
      const base = prev ?? []
      const row = {
        id: newOutlineRowId(),
        title: `${t('common.lesson')} ${base.length + 1}`,
        summary: '',
        include: true,
        order: base.length + 1
      }
      return [...base, row].map((r, i) => ({ ...r, order: i + 1 }))
    })
  }

  const removeOutlineRow = (index) => {
    setOutlineDraft((prev) => {
      if (!prev || prev.length <= 1) return prev
      const next = prev.filter((_, i) => i !== index)
      return next.map((r, i) => ({ ...r, order: i + 1 }))
    })
  }

  useEffect(() => {
    if (!lessonsJobId) return undefined
    let timerId
    const tick = async () => {
      try {
        const { data } = await api.get(`/courses/${id}/lessons/generation-jobs/${lessonsJobId}`)
        setJobStatus(data.status)
        setJobProgress({
          total: data.totalLessons ?? null,
          completed: data.completedLessons ?? null,
          currentTitle: data.currentLessonTitle ?? null
        })
        if (data.status === 'COMPLETED') {
          clearInterval(timerId)
          setLessonsJobId(null)
          setJobStatus(null)
          setJobProgress(null)
          setOutlineDraft(null)
          try {
            sessionStorage.removeItem(courseEditGenSessionKey(id))
          } catch (_) {
            /* ignore */
          }
          loadData()
        }
        if (data.status === 'FAILED') {
          clearInterval(timerId)
          setLessonsJobId(null)
          setJobProgress(null)
          const partial =
            data.completedLessons != null &&
            data.totalLessons != null &&
            data.completedLessons > 0 ? ` ${t('courseEdit.lessons')}: ${data.completedLessons}/${data.totalLessons}.`
              : ''
          setError(
            (data.errorMessage || t('courseEdit.generateLessonsError')) + partial
          )
          loadData()
        }
      } catch (e) {
        console.error(e)
      }
    }
    timerId = setInterval(tick, 2000)
    tick()
    return () => clearInterval(timerId)
  }, [lessonsJobId, id])

  const handleApproveLessonsJob = async () => {
    if (!outlineDraft?.length) {
      setError(t('courseEdit.editOutlineFirst'))
      return
    }
    const outline = outlineDraft
      .filter((r) => r.include !== false)
      .map((r, i) => ({
        title: r.title,
        summary: r.summary || '',
        order: i + 1
      }))
    if (outline.length === 0) {
      setError(t('courseEdit.selectOutlineLesson'))
      return
    }
    setGeneratingLessons(true)
    setError(null)
    try {
      const { data } = await api.post(`/courses/${id}/lessons/generation-jobs/from-outline`, {
        fileIds: Array.from(selectedFileIds),
        outline,
        params: buildLessonParamsPayload()
      })
      setLessonsJobId(data.jobId)
      setJobStatus('PENDING')
      setJobProgress({ total: null, completed: 0, currentTitle: null })
    } catch (err) {
      console.error('job:', err)
      setError(err.response?.data?.message || t('courseEdit.startLessonsError'))
    } finally {
      setGeneratingLessons(false)
    }
  }

  const handleQuickGenerateAllLessons = async () => {
    if (selectedFileIds.size === 0) {
      setError(t('courseEdit.selectFile'))
      return
    }
    setQuickGenLoading(true)
    setError(null)
    try {
      await api.post(`/courses/${id}/lessons/generate-from-files`, {
        fileIds: Array.from(selectedFileIds),
        topK: 200,
        params: buildLessonParamsPayload()
      })
      loadData()
      setSelectedFileIds(new Set())
    } catch (err) {
      console.error('Error generating lessons:', err)
      setError(err.response?.data?.message || t('courseEdit.generateLessonsError'))
    } finally {
      setQuickGenLoading(false)
    }
  }

  const handleGenerateLessons = handleQuickGenerateAllLessons

  const handleGenerateTest = async () => {
    if (selectedLessonIds.size === 0) {
      setError(t('courseEdit.selectLesson'))
      return
    }
    setGeneratingTest(true)
    setError(null)
    try {
      await api.post(`/courses/${id}/tests/generate`, {
        fileIds: [],
        lessonIds: Array.from(selectedLessonIds),
        title: testTitle || t('courseEdit.defaultTestTitle'),
        questionCount: questionCount || undefined,
        difficulty: testDifficulty || undefined
      })
      loadData()
      setSelectedLessonIds(new Set())
      setTestTitle('')
    } catch (err) {
      console.error('Error generating test:', err)
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
      await api.delete(`/files/${fileId}`)
      loadData()
    } catch (err) {
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
      await api.delete(`/courses/lessons/${lessonId}`)
      setSelectedLessonIds((prev) => {
        const next = new Set(prev)
        next.delete(lessonId)
        return next
      })
      loadData()
      setError(null)
    } catch (err) {
      console.error('Error deleting lesson:', err)
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
      await api.delete(`/courses/${id}`)
      navigate('/courses')
    } catch (err) {
      console.error('Error deleting course:', err)
      setError(err.response?.data?.message || t('courseEdit.deleteCourseError'))
    } finally {
      setDeletingCourse(false)
    }
  }

  const handleBackfillLocalizations = async () => {
    setBackfillingLocales(true)
    setError(null)
    try {
      await api.post(`/courses/${id}/backfill-localizations`)
      await loadData()
    } catch (err) {
      console.error('Error backfilling localizations:', err)
      setError(err.response?.data?.message || t('courseEdit.backfillError'))
    } finally {
      setBackfillingLocales(false)
    }
  }

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim())

  const parseEmailsFromText = (text) => {
    if (!text || !text.trim()) return []
    const raw = text
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    return [...new Set(raw)].filter(isValidEmail)
  }

  const handleAddEmails = () => {
    const toAdd = parseEmailsFromText(newEmailsText)
    const invalid = newEmailsText
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && !isValidEmail(s))
    if (toAdd.length === 0 && invalid.length > 0) {
      setEmailModalError(t('courseEdit.invalidEmails'))
      return
    }
    if (toAdd.length === 0) {
      setEmailModalError(null)
      return
    }
    setAllowedEmails((prev) => {
      const set = new Set(prev)
      toAdd.forEach((e) => set.add(e))
      return [...set]
    })
    setNewEmailsText('')
    setEmailModalError(invalid.length > 0 ? t('courseEdit.partialInvalid', { count: invalid.length, sample: `${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}` }) : null)
  }

  const handleRemoveEmail = (email) => {
    setAllowedEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleSaveAllowedEmails = async () => {
    setSavingEmails(true)
    setEmailModalError(null)
    try {
      await api.put(`/courses/${id}/allowed-emails`, allowedEmails)
      setCourse((prev) => prev ? { ...prev, allowedEmails } : null)
      setEmailModalError(null)
    } catch (err) {
      console.error('Error saving allowed emails:', err)
      setEmailModalError(err.response?.data?.message || t('courseEdit.saveEmailsError'))
    } finally {
      setSavingEmails(false)
    }
  }

  const openEmailsModal = () => {
    setAllowedEmails(Array.isArray(course?.allowedEmails) ? [...course.allowedEmails] : [])
    setNewEmailsText('')
    setEmailModalError(null)
    setShowEmailsModal(true)
  }

  const closeEmailsModal = () => {
    setShowEmailsModal(false)
    setEmailModalError(null)
  }


  if (loading) {
    return (
      <div className="course-edit-loading">
        <FiLoader className="spin" size={40} />
        <p>{t('courseEdit.loading')}</p>
      </div>
    )
  }

  if (!course) {
    return <div className="course-edit-error">{t('courseEdit.notFound')}</div>
  }

  if (!canUpload(window.keycloak)) {
    return <div className="course-edit-error">{t('courseEdit.forbidden')}</div>
  }

  const genActiveStep =
    lessonsJobId || quickGenLoading
      ? 4
      : outlineLoading
        ? 3
        : outlineDraft?.length
          ? 3
          : selectedFileIds.size > 0
            ? 2
            : 1

  return (
    <div className="course-edit">
      <div className="course-edit-header">
        <Link to={`/courses/${id}`} className="back-link">
          <FiArrowLeft /> {t('courseEdit.backToCourse')}
        </Link>
        <div className="course-edit-title-row">
          <h1>{course.title}</h1>
          <button
            type="button"
            className="btn btn-secondary btn-trans"
            onClick={handleBackfillLocalizations}
            disabled={backfillingLocales}
            title={t('courseEdit.backfillTitle')}
          >
            {backfillingLocales ? t('courseEdit.backfilling') : t('courseEdit.backfill')}
          </button>
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={handleDeleteCourse}
            disabled={deletingCourse}
            title={t('courseEdit.deleteForever')}
          >
            {deletingCourse ? (
              <>
                <FiLoader className="spin" /> {t('courseEdit.deleting')}
              </>
            ) : (
              <>
                <FiTrash2 /> {t('courseEdit.deleteCourse')}
              </>
            )}
          </button>
        </div>
        <p className="course-edit-description">{course.description}</p>
      </div>

      {error && <div className="course-edit-error-banner">{error}</div>}

      <div className="course-edit-layout">
        {/* Левая панель: файлы */}
        <aside className="course-edit-sidebar gen-sources-panel">
          <div className="sidebar-section gen-source-card">
            <h3>
              <FiLink aria-hidden /> {t('courseEdit.urlTitle')}
            </h3>
            <p className="gen-source-hint">
              {t('courseEdit.urlDesc')}
            </p>
            <input
              type="url"
              className="gen-input"
              placeholder={t('courseEdit.urlPlaceholder')}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoComplete="url"
            />
            <button
              type="button"
              className="btn btn-outline btn-block gen-source-btn"
              onClick={handleIngestUrl}
              disabled={ingestingUrl || !urlInput.trim()}
            >
              {ingestingUrl ? (
                <>
                  <FiLoader className="spin" /> {t('courseEdit.indexing')}
                </>
              ) : (
                <>
                  <FiLink /> {t('courseEdit.addToMaterials')}
                </>
              )}
            </button>
          </div>
          <div className="sidebar-section">
            <h3>{t('courseEdit.addFiles')}</h3>
            <label className="upload-zone">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {uploading ? (
                <><FiLoader className="spin" /> {t('courseEdit.uploading')}</>
              ) : (
                <><FiUpload /> {t('courseEdit.uploadFile')}</>
              )}
            </label>
          </div>
          <div className="sidebar-section">
            <div className="gen-sidebar-files-head">
              <h3>{t('courseEdit.courseMaterials')}</h3>
              {courseFiles.length > 0 && (
                <span className="gen-sidebar-files-count">
                  {selectedFileIds.size}/{courseFiles.length} {t('courseEdit.inContext')}
                </span>
              )}
            </div>
            {courseFiles.length === 0 ? (
              <p className="empty-hint">{t('courseEdit.noFiles')}</p>
            ) : (
              <ul className="files-list">
                {courseFiles.map((f) => (
                  <li key={f.id} className="file-item">
                    <label className="file-check">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.has(f.id)}
                        onChange={() => toggleFileSelection(f.id)}
                      />
                      <FiFile />
                      <span title={f.originalFileName}>{f.originalFileName}</span>
                    </label>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteFile(f.id)}
                      title={t('courseEdit.deleteItem')}
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className="btn btn-outline btn-block allowed-emails-trigger"
              onClick={openEmailsModal}
              title={t('courseEdit.emailAccessTitle')}
            >
              <FiMail />
              <span>{t('courseEdit.emailAccess')}</span>
              {(course?.allowedEmails?.length ?? 0) > 0 && (
                <span className="allowed-emails-badge">{course.allowedEmails.length}</span>
              )}
            </button>
          </div>
        </aside>

        {/* Модальное окно: список пользователей (email) */}
        {showEmailsModal && (
          <div
            className="modal-overlay"
            onClick={closeEmailsModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="emails-modal-title"
          >
            <div
              className="modal-dialog modal-emails"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 id="emails-modal-title">
                  <FiMail /> {t('courseEdit.emailAccessTitle')}
                </h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeEmailsModal}
                  aria-label={t('courseEdit.closeLabel')}
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-emails-desc">
                  {allowedEmails.length === 0
                    ? t('courseEdit.emailAccessDescEmpty')
                    : t('courseEdit.emailAccessDescFilled', { count: allowedEmails.length })}
                </p>
                {emailModalError && (
                  <div className="modal-emails-error">{emailModalError}</div>
                )}
                <div className="modal-emails-add">
                  <textarea
                    placeholder={t('courseEdit.emailPlaceholder')}
                    value={newEmailsText}
                    onChange={(e) => setNewEmailsText(e.target.value)}
                    className="modal-emails-textarea"
                    rows={4}
                    autoFocus
                    aria-label={t('courseEdit.emailFieldLabel')}
                  />
                  <button
                    type="button"
                    className="btn btn-primary modal-emails-add-btn"
                    onClick={handleAddEmails}
                    disabled={!newEmailsText.trim()}
                    title={t('courseEdit.addValidEmails')}
                  >
                    <FiUserPlus /> {t('courseEdit.add')}
                  </button>
                </div>
                {allowedEmails.length > 0 ? (
                  <div className="modal-emails-list-wrap">
                    <ul className="modal-emails-list">
                      {allowedEmails.map((email) => (
                        <li key={email} className="modal-emails-item">
                          <span className="modal-emails-item-text">{email}</span>
                          <button
                            type="button"
                            className="btn-icon danger"
                            onClick={() => handleRemoveEmail(email)}
                            title={t('courseEdit.removeFromList')}
                          >
                            <FiTrash2 />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="modal-emails-empty">{t('courseEdit.emailListEmpty')}</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEmailsModal}
                >
                  {t('courseEdit.close')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveAllowedEmails}
                  disabled={savingEmails}
                >
                  {savingEmails ? <><FiLoader className="spin" /> {t('courseEdit.saving')}</> : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Центр: кнопки генерации */}
        <main className="course-edit-main gen-studio">
          {lessonsJobId && (
            <div className={`gen-job-banner gen-job-banner--${(jobStatus || 'PENDING').toLowerCase()}`}>
              <div className="gen-job-banner__icon">
                <FiCpu className={jobStatus === 'COMPLETED' ? '' : 'spin'} aria-hidden />
              </div>
              <div className="gen-job-banner__body">
                <strong>
                  {jobStatus === 'COMPLETED'
                    ? t('courseEdit.generationDone')
                    : jobStatus === 'FAILED'
                      ? t('courseEdit.generationStopped')
                      : t('courseEdit.generatingInBackground')}
                </strong>
                <span className="gen-job-banner__meta">
                  {t('courseEdit.statusLabel')}: <code>{jobStatus || 'PENDING'}</code>
                  {jobProgress != null &&
                  jobProgress.total != null &&
                  jobProgress.completed != null &&
                  jobProgress.total > 0 ? (
                    <>
                      {' '}
                      — уроки: {jobProgress.completed}/{jobProgress.total}
                      {jobProgress.currentTitle
                        ? ` («${jobProgress.currentTitle.slice(0, 60)}${jobProgress.currentTitle.length > 60 ? '…' : ''}»)`
                        : ''}
                    </>
                  ) : null}
                  {jobStatus === 'RUNNING' || jobStatus === 'PENDING'
                    ? ' — после обновления страницы прогресс восстановится; уже созданные уроки остаются в курсе.'
                    : null}
                </span>
              </div>
            </div>
          )}

          <header className="gen-studio__intro">
            <p className="gen-studio__kicker">{t('courseEdit.contentGen')}</p>
            <h2 className="gen-studio__title">{t('courseEdit.buildCourse')}</h2>
            <p className="gen-studio__lead">
              {t('courseEdit.buildCourseDesc')}
            </p>
            <dl className="gen-studio__meta">
              <div>
                <dt>{t('courseEdit.materialsInContext')}</dt>
                <dd>{selectedFileIds.size}</dd>
              </div>
              <div>
                <dt>{t('courseEdit.lessonsInCourse')}</dt>
                <dd>{lessons.length}</dd>
              </div>
              <div>
                <dt>{t('courseEdit.outlineItems')}</dt>
                <dd>{outlineDraft?.length ?? 0}</dd>
              </div>
            </dl>
          </header>

          <div className="gen-track" role="navigation" aria-label={t('courseEdit.generationStages')}>
            {[
              { n: 1, label: t('courseEdit.materials'), done: selectedFileIds.size > 0 },
              { n: 2, label: t('courseEdit.params'), done: genActiveStep >= 2 },
              { n: 3, label: t('courseEdit.plan'), done: !!outlineDraft?.length },
              { n: 4, label: t('courseEdit.lessons'), done: lessons.length > 0 && !lessonsJobId }
            ].flatMap((step, i, arr) => {
              const state =
                genActiveStep === step.n ? 'active' : step.done ? 'done' : 'todo'
              const nodes = [
                <div
                  key={`seg-${step.n}`}
                  className={`gen-track__segment gen-track__segment--${state}`}
                >
                  <span className="gen-track__num" aria-hidden>
                    {step.done && state !== 'active' ? '✓' : step.n}
                  </span>
                  <span className="gen-track__label">{step.label}</span>
                </div>
              ]
              if (i < arr.length - 1) {
                const prevDone = step.done
                nodes.push(
                  <div
                    key={`bar-${step.n}`}
                    className={`gen-track__connector${prevDone ? ' gen-track__connector--done' : ''}`}
                    aria-hidden
                  />
                )
              }
              return nodes
            })}
          </div>

          <div className="gen-workspace">
            <section className="generate-card gen-pipeline-card">
              <div className="gen-pipeline-card__head">
                <p className="gen-pipeline-card__eyebrow">{t('courseEdit.mainFlow')}</p>
                <h4 className="gen-pipeline-card__title">{t('courseEdit.mainFlowTitle')}</h4>
                <p className="gen-pipeline-card__subtitle">
                  {t('courseEdit.mainFlowDesc')}
                </p>
              </div>

              <div className="gen-form-section">
                <span className="gen-form-section__label">{t('courseEdit.requestToModel')}</span>
                <div className="gen-params-grid gen-params-grid--primary">
                <label className="gen-field gen-field--full">
                  <span className="gen-label">{t('courseEdit.courseWishes')}</span>
                  <textarea
                    className="gen-textarea"
                    rows={3}
                    value={genParams.teacherBrief}
                    onChange={(e) => setGenParams((p) => ({ ...p, teacherBrief: e.target.value }))}
                    placeholder={t('courseEdit.courseWishesPlaceholder')}
                  />
                </label>
              </div>
              </div>

              <div className="gen-form-section">
                <span className="gen-form-section__label">{t('courseEdit.courseParams')}</span>
                <div className="gen-params-grid">
                <label className="gen-field">
                  <span className="gen-label">{t('courseEdit.audience')}</span>
                  <select
                    className="gen-select"
                    value={genParams.targetAudience}
                    onChange={(e) => setGenParams((p) => ({ ...p, targetAudience: e.target.value }))}
                  >
                    <option value="school">{t('courseEdit.audienceSchool')}</option>
                    <option value="bachelor">{t('courseEdit.audienceBachelor')}</option>
                    <option value="pro">{t('courseEdit.audiencePro')}</option>
                  </select>
                </label>
                <label className="gen-field">
                  <span className="gen-label">{t('courseEdit.minLessons')}</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className="gen-input"
                    value={genParams.minLessons}
                    onChange={(e) => setGenParams((p) => ({ ...p, minLessons: e.target.value }))}
                  />
                </label>
                <label className="gen-field">
                  <span className="gen-label">{t('courseEdit.maxLessons')}</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className="gen-input"
                    value={genParams.maxLessons}
                    onChange={(e) => setGenParams((p) => ({ ...p, maxLessons: e.target.value }))}
                  />
                </label>
                <label className="gen-field">
                  <span className="gen-label">{t('courseEdit.depth')}</span>
                  <select
                    className="gen-select"
                    value={genParams.depth}
                    onChange={(e) => setGenParams((p) => ({ ...p, depth: e.target.value }))}
                  >
                    <option value="shallow">{t('courseEdit.depthShallow')}</option>
                    <option value="medium">{t('courseEdit.depthMedium')}</option>
                    <option value="deep">{t('courseEdit.depthDeep')}</option>
                  </select>
                </label>
                <label className="gen-field">
                  <span className="gen-label">{t('courseEdit.contextSource')}</span>
                  <select
                    className="gen-select"
                    value={genParams.retrievalMode}
                    onChange={(e) => setGenParams((p) => ({ ...p, retrievalMode: e.target.value }))}
                  >
                    <option value="full_collection">{t('courseEdit.contextAll')}</option>
                    <option value="semantic">{t('courseEdit.contextSemantic')}</option>
                  </select>
                </label>
                {genParams.retrievalMode === 'semantic' && (
                  <label className="gen-field gen-field--full">
                    <span className="gen-label">{t('courseEdit.retrievalQuery')}</span>
                    <input
                      className="gen-input"
                      value={genParams.retrievalQuery}
                      onChange={(e) => setGenParams((p) => ({ ...p, retrievalQuery: e.target.value }))}
                      placeholder={t('courseEdit.retrievalQueryPlaceholder')}
                    />
                  </label>
                )}
                </div>
              </div>

              <div className="gen-actions-row">
                <button
                  type="button"
                  className="btn btn-primary gen-cta"
                  onClick={handleGenerateOutline}
                  disabled={outlineLoading || selectedFileIds.size === 0}
                >
                  {outlineLoading ? (
                    <>
                      <FiLoader className="spin" /> {t('courseEdit.buildOutline')}
                    </>
                  ) : (
                    <>
                      <FiEdit3 /> {t('courseEdit.generateOutline')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline gen-cta"
                  onClick={addOutlineRow}
                  disabled={outlineLoading}
                  title={t('courseEdit.addManualItemTitle')}
                >
                  <FiPlus aria-hidden /> {t('courseEdit.addManualItem')}
                </button>
                {selectedFileIds.size === 0 && (
                  <span className="gen-actions-hint">{t('courseEdit.selectFilesHint')}</span>
                )}
              </div>

              {outlineDraft && outlineDraft.length > 0 && (
                <div className="outline-editor">
                  <div className="outline-editor__head">
                    <h5>{t('courseEdit.coursePlan')}</h5>
                    <p className="outline-editor__hint">
                      {t('courseEdit.coursePlanHint')}
                    </p>
                  </div>
                  <ul className="outline-list">
                    {outlineDraft.map((row, idx) => (
                      <li key={row.id ?? `outline-${idx}`} className="outline-row">
                        <div className="outline-row__toolbar">
                          <label className="outline-row__check">
                            <input
                              type="checkbox"
                              checked={row.include !== false}
                              onChange={(e) => updateOutlineRow(idx, 'include', e.target.checked)}
                            />
                            <span>{t('courseEdit.include')}</span>
                          </label>
                          <span className="outline-row__idx">#{idx + 1}</span>
                          <div className="outline-row__move">
                            <button
                              type="button"
                              className="btn btn-outline outline-move-btn"
                              onClick={() => moveOutlineRow(idx, -1)}
                              disabled={idx === 0}
                              aria-label={t('courseEdit.moveUp')}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline outline-move-btn"
                              onClick={() => moveOutlineRow(idx, 1)}
                              disabled={idx === outlineDraft.length - 1}
                              aria-label={t('courseEdit.moveDown')}
                            >
                              ↓
                            </button>
                          </div>
                          <button
                            type="button"
                            className="btn-icon danger outline-row__remove"
                            onClick={() => removeOutlineRow(idx)}
                            disabled={outlineDraft.length <= 1}
                            title={
                              outlineDraft.length <= 1
                                ? t('courseEdit.cannotDeleteLast')
                                : t('courseEdit.deletePlanItem')
                            }
                            aria-label={t('courseEdit.deletePlanItem')}
                          >
                            <FiTrash2 aria-hidden />
                          </button>
                        </div>
                        <input
                          className="gen-input outline-title-input"
                          value={row.title ?? ''}
                          onChange={(e) => updateOutlineRow(idx, 'title', e.target.value)}
                          aria-label={t('courseEdit.lessonTitleAria', { index: idx + 1 })}
                        />
                        <textarea
                          className="gen-textarea outline-summary-input"
                          rows={4}
                          value={row.summary ?? ''}
                          onChange={(e) => updateOutlineRow(idx, 'summary', e.target.value)}
                          placeholder={t('courseEdit.lessonGoalsPlaceholder')}
                          aria-label={t('courseEdit.lessonGoalsAria', { index: idx + 1 })}
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="outline-editor__footer-actions">
                    <button
                      type="button"
                      className="btn btn-outline gen-cta"
                      onClick={addOutlineRow}
                    >
                      <FiPlus aria-hidden /> {t('courseEdit.addLessonToPlan')}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg gen-cta gen-cta--wide"
                    onClick={handleApproveLessonsJob}
                    disabled={generatingLessons || lessonsJobId}
                  >
                    {generatingLessons ? (
                      <>
                        <FiLoader className="spin" /> {t('courseEdit.startingBackground')}
                      </>
                    ) : (
                      <>
                        <FiZap /> {t('courseEdit.approvePlan')}
                      </>
                    )}
                  </button>
                  <p className="gen-footnote">
                    {t('courseEdit.backgroundHint')}
                  </p>
                </div>
              )}
            </section>

            <aside className="gen-side-rail" aria-label="Дополнительные сценарии">
              <p className="gen-side-rail__title">{t('courseEdit.otherScenarios')}</p>
              <p className="gen-side-rail__hint">
                {t('courseEdit.otherScenariosHint')}
              </p>
            <div className="generate-card gen-alt-card">
              <div className="gen-alt-card__icon">
                <FiBook aria-hidden />
              </div>
              <h4>{t('courseEdit.quickAllLessonsTitle')}</h4>
              <p>
                {t('courseEdit.quickAllLessonsDesc')}
              </p>
              <button
                type="button"
                className="btn btn-outline btn-lg gen-cta gen-cta--wide"
                onClick={handleQuickGenerateAllLessons}
                disabled={quickGenLoading || selectedFileIds.size === 0}
              >
                {quickGenLoading ? (
                  <>
                    <FiLoader className="spin" /> {t('courseEdit.generating')}
                  </>
                ) : (
                  <>
                    <FiLayers /> {t('courseEdit.generateAllLessons')}
                  </>
                )}
              </button>
            </div>

            <div className="generate-card gen-test-card">
              <div className="gen-alt-card__icon gen-alt-card__icon--quiz">
                <FiCheckSquare aria-hidden />
              </div>
              <h4>{t('courseEdit.testByLessons')}</h4>
              <p>{t('courseEdit.testByLessonsDesc')}</p>
              <input
                type="text"
                placeholder={t('courseEdit.testTitlePlaceholder')}
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="gen-input"
              />
              <div className="gen-test-row">
                <label className="gen-field">
                  <span className="gen-label">{t('courseEdit.questionCount')}</span>
                  <input
                    type="number"
                    min={3}
                    max={25}
                    className="gen-input"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                  />
                </label>
                <label className="gen-field">
                  <span className="gen-label">{t('courseEdit.difficulty')}</span>
                  <select
                    className="gen-select"
                    value={testDifficulty}
                    onChange={(e) => setTestDifficulty(e.target.value)}
                  >
                    <option value="easy">{t('courseEdit.difficultyEasy')}</option>
                    <option value="medium">{t('courseEdit.difficultyMedium')}</option>
                    <option value="hard">{t('courseEdit.difficultyHard')}</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-lg gen-cta gen-cta--wide"
                onClick={handleGenerateTest}
                disabled={generatingTest || selectedLessonIds.size === 0}
              >
                {generatingTest ? (
                  <>
                    <FiLoader className="spin" /> {t('courseEdit.generatingTest')}
                  </>
                ) : (
                  <>
                    <FiCheckSquare /> {t('courseEdit.generateTest')}
                  </>
                )}
              </button>
            </div>
            </aside>
          </div>

          <div className="gen-results">
            <div className="gen-results__head">
              <h3 className="gen-results__heading">{t('courseEdit.content')}</h3>
              <p className="gen-results__sub">{t('courseEdit.contentDesc')}</p>
            </div>
          <div className="course-sections">
            {participants && (
              <section className="course-section course-edit-participants">
                <div className="course-edit-participants__head">
                  <h3>
                    <FiUsers aria-hidden /> {t('coursePage.participantsTitle')}
                  </h3>
                  <p className="empty-hint">{t('coursePage.participantsSubtitle')}</p>
                </div>
                <div className="course-edit-participants__grid">
                  <div>
                    <div className="course-edit-participants__label">{t('coursePage.participantsInstructor')}</div>
                    <code className="course-edit-participants__id">{participants.instructor?.userId}</code>
                    {participants.instructor?.displayLabel && (
                      <div className="course-edit-participants__email">{participants.instructor.displayLabel}</div>
                    )}
                  </div>
                  <div>
                    <div className="course-edit-participants__label">
                      {t('coursePage.participantsStudents')} (
                      {t('coursePage.participantsCount', { count: participants.studentCount ?? 0 })})
                    </div>
                    {(participants.students?.length ?? 0) === 0 ? (
                      <p className="empty-hint">{t('coursePage.participantsEmptyStudents')}</p>
                    ) : (
                      <ul className="course-edit-participants__list">
                        {participants.students.map((s) => (
                          <li key={s.userId}>
                            <code>{s.userId}</code>
                            {s.displayLabel ? <span>{s.displayLabel}</span> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}
            <section className="course-section">
              <h3>{t('courseEdit.lessons')} ({lessons.length})</h3>
              {lessons.length === 0 ? (
                <p className="empty-hint">{t('courseEdit.noLessons')}</p>
              ) : (
                <div className="lessons-grid">
                  {lessons.map((l) => (
                    <div key={l.id} className="lesson-item">
                      <label className="lesson-check">
                        <input
                          type="checkbox"
                          checked={selectedLessonIds.has(l.id)}
                          onChange={() => toggleLessonSelection(l.id)}
                        />
                        <Link to={`/courses/${id}/lessons/${l.id}`}>{l.title}</Link>
                      </label>
                      <button
                        type="button"
                        className="btn-icon danger lesson-delete-btn"
                        onClick={() => handleDeleteLesson(l.id)}
                        title={t('courseEdit.deleteLessonTitle')}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="course-section">
              <div className="tests-section-head">
                <h3>{t('common.tests')} ({tests.length})</h3>
                <Link
                  to={`/courses/${id}/test-results`}
                  className="btn btn-outline tests-results-page-link"
                >
                  <FiClipboard aria-hidden /> {t('courseEdit.testResultsTitle')}
                </Link>
              </div>
              {tests.length === 0 ? (
                <p className="empty-hint">{t('courseEdit.noTests')}</p>
              ) : (
                <div className="tests-grid">
                  {tests.map((testItem) => (
                    <Link
                      key={testItem.id}
                      to={`/courses/${id}/tests/${testItem.id}`}
                      className="test-card"
                    >
                      <FiCheckSquare />
                      <span>{testItem.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CourseEdit
