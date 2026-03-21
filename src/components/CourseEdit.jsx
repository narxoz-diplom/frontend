import React, { useState, useEffect } from 'react'
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
  FiPlus
} from 'react-icons/fi'
import api from '../services/api'
import { useAlert } from '../context/AlertProvider'
import { canUpload } from '../utils/roles'
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

const CourseEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirm } = useAlert()
  const [course, setCourse] = useState(null)
  const [courseFiles, setCourseFiles] = useState([])
  const [lessons, setLessons] = useState([])
  const [tests, setTests] = useState([])
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
  const [urlInput, setUrlInput] = useState('')
  const [ingestingUrl, setIngestingUrl] = useState(false)
  const [questionCount, setQuestionCount] = useState(8)
  const [testDifficulty, setTestDifficulty] = useState('medium')
  const [quickGenLoading, setQuickGenLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

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
      setCourse(courseRes.data)
      setCourseFiles(filesRes.data || [])
      setLessons(lessonsRes.data || [])
      setTests(testsRes.data || [])
      setAllowedEmails(Array.isArray(courseRes.data?.allowedEmails) ? courseRes.data.allowedEmails : [])
      setError(null)
    } catch (err) {
      console.error('Error loading course:', err)
      setError('Не удалось загрузить данные курса')
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
      setError(err.response?.data?.message || 'Ошибка загрузки файла')
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
      setError('Введите URL')
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
      setError(err.response?.data?.message || 'Не удалось загрузить страницу по ссылке')
    } finally {
      setIngestingUrl(false)
    }
  }

  const handleGenerateOutline = async () => {
    if (selectedFileIds.size === 0) {
      setError('Выберите хотя бы один файл')
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
      setError(err.response?.data?.message || 'Ошибка генерации оглавления')
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
        title: `Урок ${base.length + 1}`,
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
    const timer = setInterval(async () => {
      try {
        const { data } = await api.get(`/courses/${id}/lessons/generation-jobs/${lessonsJobId}`)
        setJobStatus(data.status)
        if (data.status === 'COMPLETED') {
          clearInterval(timer)
          setLessonsJobId(null)
          setJobStatus(null)
          setOutlineDraft(null)
          loadData()
        }
        if (data.status === 'FAILED') {
          clearInterval(timer)
          setLessonsJobId(null)
          setError(data.errorMessage || 'Фоновая генерация уроков завершилась с ошибкой')
        }
      } catch (e) {
        console.error(e)
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [lessonsJobId, id])

  const handleApproveLessonsJob = async () => {
    if (!outlineDraft?.length) {
      setError('Сначала сгенерируйте и отредактируйте оглавление')
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
      setError('Отметьте хотя бы один урок в оглавлении')
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
      setOutlineDraft(null)
    } catch (err) {
      console.error('job:', err)
      setError(err.response?.data?.message || 'Не удалось запустить генерацию уроков')
    } finally {
      setGeneratingLessons(false)
    }
  }

  const handleQuickGenerateAllLessons = async () => {
    if (selectedFileIds.size === 0) {
      setError('Выберите хотя бы один файл')
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
      setError(err.response?.data?.message || 'Ошибка генерации уроков')
    } finally {
      setQuickGenLoading(false)
    }
  }

  const handleGenerateLessons = handleQuickGenerateAllLessons

  const handleGenerateTest = async () => {
    if (selectedLessonIds.size === 0) {
      setError('Выберите хотя бы один урок')
      return
    }
    setGeneratingTest(true)
    setError(null)
    try {
      await api.post(`/courses/${id}/tests/generate`, {
        fileIds: [],
        lessonIds: Array.from(selectedLessonIds),
        title: testTitle || 'Тест по курсу',
        questionCount: questionCount || undefined,
        difficulty: testDifficulty || undefined
      })
      loadData()
      setSelectedLessonIds(new Set())
      setTestTitle('')
    } catch (err) {
      console.error('Error generating test:', err)
      setError(err.response?.data?.message || 'Ошибка генерации теста')
    } finally {
      setGeneratingTest(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    const ok = await confirm({
      title: 'Удаление файла',
      message: 'Удалить этот файл?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await api.delete(`/files/${fileId}`)
      loadData()
    } catch (err) {
      setError('Ошибка удаления файла')
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    const ok = await confirm({
      title: 'Удаление урока',
      message:
        'Удалить этот урок? Связанные видео и данные урока будут удалены.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
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
      setError(err.response?.data?.message || 'Ошибка при удалении урока')
    }
  }

  const handleDeleteCourse = async () => {
    const ok = await confirm({
      title: 'Удаление курса',
      message: `Удалить курс «${course.title}»? Это действие необратимо: курс, уроки и связанные данные будут удалены.`,
      confirmText: 'Удалить курс',
      cancelText: 'Отмена',
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
      setError(err.response?.data?.message || 'Не удалось удалить курс')
    } finally {
      setDeletingCourse(false)
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
      setEmailModalError('Не найдено корректных email. Проверьте формат адресов.')
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
    setEmailModalError(invalid.length > 0 ? `Добавлены только корректные. Неверные (${invalid.length}): ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}` : null)
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
      setEmailModalError(err.response?.data?.message || 'Ошибка сохранения списка email')
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
        <p>Загрузка...</p>
      </div>
    )
  }

  if (!course) {
    return <div className="course-edit-error">Курс не найден</div>
  }

  if (!canUpload(window.keycloak)) {
    return <div className="course-edit-error">Доступ запрещён</div>
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
          <FiArrowLeft /> К курсу
        </Link>
        <div className="course-edit-title-row">
          <h1>{course.title}</h1>
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={handleDeleteCourse}
            disabled={deletingCourse}
            title="Удалить курс навсегда"
          >
            {deletingCourse ? (
              <>
                <FiLoader className="spin" /> Удаление...
              </>
            ) : (
              <>
                <FiTrash2 /> Удалить курс
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
              <FiLink aria-hidden /> Страница по URL
            </h3>
            <p className="gen-source-hint">
              Скачиваем публичную HTML-страницу, извлекаем текст и индексируем его в базе курса (как отдельный .txt).
              Сложные сайты, PDF по ссылке и страницы за логином могут не подойти — тогда загрузите файл вручную.
            </p>
            <input
              type="url"
              className="gen-input"
              placeholder="https://example.com/article"
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
                  <FiLoader className="spin" /> Индексация…
                </>
              ) : (
                <>
                  <FiLink /> Добавить в материалы
                </>
              )}
            </button>
          </div>
          <div className="sidebar-section">
            <h3>Добавить файлы</h3>
            <label className="upload-zone">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {uploading ? (
                <><FiLoader className="spin" /> Загрузка...</>
              ) : (
                <><FiUpload /> Загрузить файл</>
              )}
            </label>
          </div>
          <div className="sidebar-section">
            <div className="gen-sidebar-files-head">
              <h3>Материалы курса</h3>
              {courseFiles.length > 0 && (
                <span className="gen-sidebar-files-count">
                  {selectedFileIds.size}/{courseFiles.length} в контексте
                </span>
              )}
            </div>
            {courseFiles.length === 0 ? (
              <p className="empty-hint">Нет файлов. Загрузите материалы курса.</p>
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
                      title="Удалить"
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
              title="Управление списком email для доступа к курсу"
            >
              <FiMail />
              <span>Доступ по email</span>
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
                  <FiMail /> Список email для доступа к курсу
                </h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeEmailsModal}
                  aria-label="Закрыть"
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-emails-desc">
                  {allowedEmails.length === 0
                    ? 'Пустой список — записаться на курс может любой пользователь. Добавьте email, чтобы ограничить доступ.'
                    : `Только пользователи с указанными адресами (${allowedEmails.length}) смогут записаться на курс.`}
                </p>
                {emailModalError && (
                  <div className="modal-emails-error">{emailModalError}</div>
                )}
                <div className="modal-emails-add">
                  <textarea
                    placeholder="Введите или вставьте email — по одному на строку или через запятую/точку с запятой"
                    value={newEmailsText}
                    onChange={(e) => setNewEmailsText(e.target.value)}
                    className="modal-emails-textarea"
                    rows={4}
                    autoFocus
                    aria-label="Поле для ввода email"
                  />
                  <button
                    type="button"
                    className="btn btn-primary modal-emails-add-btn"
                    onClick={handleAddEmails}
                    disabled={!newEmailsText.trim()}
                    title="Добавить все корректные email из поля выше"
                  >
                    <FiUserPlus /> Добавить
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
                            title="Удалить из списка"
                          >
                            <FiTrash2 />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="modal-emails-empty">Список пуст. Введите email выше и нажмите «Добавить».</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEmailsModal}
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveAllowedEmails}
                  disabled={savingEmails}
                >
                  {savingEmails ? <><FiLoader className="spin" /> Сохранение...</> : 'Сохранить'}
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
                    ? 'Генерация завершена'
                    : jobStatus === 'FAILED'
                      ? 'Генерация остановлена'
                      : 'Создаём уроки в фоне'}
                </strong>
                <span className="gen-job-banner__meta">
                  Статус: <code>{jobStatus || 'PENDING'}</code>
                  {jobStatus === 'RUNNING' || jobStatus === 'PENDING'
                    ? ' — страницу можно не закрывать, список уроков обновится сам.'
                    : null}
                </span>
              </div>
            </div>
          )}

          <header className="gen-studio__intro">
            <p className="gen-studio__kicker">Генерация контента</p>
            <h2 className="gen-studio__title">Соберите курс из материалов</h2>
            <p className="gen-studio__lead">
              Модель использует только отмеченные файлы и проиндексированные страницы. Сначала чертим план курса, вы
              правите структуру, затем запускается фоновая сборка уроков. Перед публикацией всё стоит просмотреть вручную.
            </p>
            <dl className="gen-studio__meta">
              <div>
                <dt>Материалов в контексте</dt>
                <dd>{selectedFileIds.size}</dd>
              </div>
              <div>
                <dt>Уроков в курсе</dt>
                <dd>{lessons.length}</dd>
              </div>
              <div>
                <dt>Пунктов плана</dt>
                <dd>{outlineDraft?.length ?? 0}</dd>
              </div>
            </dl>
          </header>

          <div className="gen-track" role="navigation" aria-label="Этапы генерации">
            {[
              { n: 1, label: 'Материалы', done: selectedFileIds.size > 0 },
              { n: 2, label: 'Параметры', done: genActiveStep >= 2 },
              { n: 3, label: 'План', done: !!outlineDraft?.length },
              { n: 4, label: 'Уроки', done: lessons.length > 0 && !lessonsJobId }
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
                <p className="gen-pipeline-card__eyebrow">Основной поток</p>
                <h4 className="gen-pipeline-card__title">План → правки → уроки</h4>
                <p className="gen-pipeline-card__subtitle">
                  Сгенерируйте оглавление, отредактируйте пункты и утвердите запуск — дальше работа идёт на сервере.
                </p>
              </div>

              <div className="gen-form-section">
                <span className="gen-form-section__label">Запрос к модели</span>
                <div className="gen-params-grid gen-params-grid--primary">
                <label className="gen-field gen-field--full">
                  <span className="gen-label">Пожелания к курсу</span>
                  <textarea
                    className="gen-textarea"
                    rows={3}
                    value={genParams.teacherBrief}
                    onChange={(e) => setGenParams((p) => ({ ...p, teacherBrief: e.target.value }))}
                    placeholder="Тема, акценты, что исключить, стиль изложения…"
                  />
                </label>
              </div>
              </div>

              <div className="gen-form-section">
                <span className="gen-form-section__label">Параметры курса</span>
                <div className="gen-params-grid">
                <label className="gen-field">
                  <span className="gen-label">Аудитория</span>
                  <select
                    className="gen-select"
                    value={genParams.targetAudience}
                    onChange={(e) => setGenParams((p) => ({ ...p, targetAudience: e.target.value }))}
                  >
                    <option value="school">Школа</option>
                    <option value="bachelor">Бакалавриат</option>
                    <option value="pro">Профи / специалисты</option>
                  </select>
                </label>
                <label className="gen-field">
                  <span className="gen-label">Мин. уроков в плане</span>
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
                  <span className="gen-label">Макс. уроков в плане</span>
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
                  <span className="gen-label">Глубина текста</span>
                  <select
                    className="gen-select"
                    value={genParams.depth}
                    onChange={(e) => setGenParams((p) => ({ ...p, depth: e.target.value }))}
                  >
                    <option value="shallow">Кратко</option>
                    <option value="medium">Средне</option>
                    <option value="deep">Развёрнуто</option>
                  </select>
                </label>
                <label className="gen-field">
                  <span className="gen-label">Источник контекста</span>
                  <select
                    className="gen-select"
                    value={genParams.retrievalMode}
                    onChange={(e) => setGenParams((p) => ({ ...p, retrievalMode: e.target.value }))}
                  >
                    <option value="full_collection">Все выбранные материалы</option>
                    <option value="semantic">Семантический поиск по запросу</option>
                  </select>
                </label>
                {genParams.retrievalMode === 'semantic' && (
                  <label className="gen-field gen-field--full">
                    <span className="gen-label">Запрос для отбора фрагментов</span>
                    <input
                      className="gen-input"
                      value={genParams.retrievalQuery}
                      onChange={(e) => setGenParams((p) => ({ ...p, retrievalQuery: e.target.value }))}
                      placeholder="Например: микросервисы, деплой, очереди сообщений"
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
                      <FiLoader className="spin" /> Строим план курса…
                    </>
                  ) : (
                    <>
                      <FiEdit3 /> Сгенерировать оглавление
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline gen-cta"
                  onClick={addOutlineRow}
                  disabled={outlineLoading}
                  title="Добавить пустой пункт плана без запроса к модели"
                >
                  <FiPlus aria-hidden /> Пункт вручную
                </button>
                {selectedFileIds.size === 0 && (
                  <span className="gen-actions-hint">Отметьте файлы слева, чтобы включить их в контекст</span>
                )}
              </div>

              {outlineDraft && outlineDraft.length > 0 && (
                <div className="outline-editor">
                  <div className="outline-editor__head">
                    <h5>План курса</h5>
                    <p className="outline-editor__hint">
                      Включайте и выключайте пункты, меняйте заголовки и описания, добавляйте свои уроки или удаляйте
                      лишние — порядок можно менять стрелками. В плане всегда остаётся хотя бы один пункт.
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
                            <span>Включить</span>
                          </label>
                          <span className="outline-row__idx">#{idx + 1}</span>
                          <div className="outline-row__move">
                            <button
                              type="button"
                              className="btn btn-outline outline-move-btn"
                              onClick={() => moveOutlineRow(idx, -1)}
                              disabled={idx === 0}
                              aria-label="Выше"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline outline-move-btn"
                              onClick={() => moveOutlineRow(idx, 1)}
                              disabled={idx === outlineDraft.length - 1}
                              aria-label="Ниже"
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
                                ? 'Нельзя удалить последний пункт — добавьте ещё один, затем удалите этот'
                                : 'Удалить пункт из плана'
                            }
                            aria-label={`Удалить пункт ${idx + 1}`}
                          >
                            <FiTrash2 aria-hidden />
                          </button>
                        </div>
                        <input
                          className="gen-input outline-title-input"
                          value={row.title ?? ''}
                          onChange={(e) => updateOutlineRow(idx, 'title', e.target.value)}
                          aria-label={`Заголовок урока ${idx + 1}`}
                        />
                        <textarea
                          className="gen-textarea outline-summary-input"
                          rows={4}
                          value={row.summary ?? ''}
                          onChange={(e) => updateOutlineRow(idx, 'summary', e.target.value)}
                          placeholder="Цели урока, ключевые темы — можно несколько строк, поле растягивается снизу"
                          aria-label={`Описание и цели урока ${idx + 1}`}
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
                      <FiPlus aria-hidden /> Добавить урок в план
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
                        <FiLoader className="spin" /> Запускаем фоновую генерацию…
                      </>
                    ) : (
                      <>
                        <FiZap /> Утвердить план и создать уроки
                      </>
                    )}
                  </button>
                  <p className="gen-footnote">
                    Долгие курсы обрабатываются в фоне: статус показывается выше. Пока идёт задача, тот же план в
                    интерфейсе скрывается — при ошибке проверьте сообщение в красной плашке.
                  </p>
                </div>
              )}
            </section>

            <aside className="gen-side-rail" aria-label="Дополнительные сценарии">
              <p className="gen-side-rail__title">Другие сценарии</p>
              <p className="gen-side-rail__hint">
                Не заменяют основной поток: для черновика или теста после появления уроков.
              </p>
            <div className="generate-card gen-alt-card">
              <div className="gen-alt-card__icon">
                <FiBook aria-hidden />
              </div>
              <h4>Один запрос — все уроки</h4>
              <p>
                Без шага оглавления: сразу полный набор уроков по выбранным материалам и настройкам выше. Удобно для
                черновика, но меньше контроля над структурой.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-lg gen-cta gen-cta--wide"
                onClick={handleQuickGenerateAllLessons}
                disabled={quickGenLoading || selectedFileIds.size === 0}
              >
                {quickGenLoading ? (
                  <>
                    <FiLoader className="spin" /> Генерируем…
                  </>
                ) : (
                  <>
                    <FiLayers /> Сгенерировать все уроки сразу
                  </>
                )}
              </button>
            </div>

            <div className="generate-card gen-test-card">
              <div className="gen-alt-card__icon gen-alt-card__icon--quiz">
                <FiCheckSquare aria-hidden />
              </div>
              <h4>Тест по урокам</h4>
              <p>Вопросы строятся по содержанию выбранных уроков. Отметьте их в списке ниже.</p>
              <input
                type="text"
                placeholder="Название теста (необязательно)"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="gen-input"
              />
              <div className="gen-test-row">
                <label className="gen-field">
                  <span className="gen-label">Вопросов</span>
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
                  <span className="gen-label">Сложность</span>
                  <select
                    className="gen-select"
                    value={testDifficulty}
                    onChange={(e) => setTestDifficulty(e.target.value)}
                  >
                    <option value="easy">Лёгкая</option>
                    <option value="medium">Средняя</option>
                    <option value="hard">Сложная</option>
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
                    <FiLoader className="spin" /> Составляем тест…
                  </>
                ) : (
                  <>
                    <FiCheckSquare /> Сгенерировать тест
                  </>
                )}
              </button>
            </div>
            </aside>
          </div>

          <div className="gen-results">
            <div className="gen-results__head">
              <h3 className="gen-results__heading">Содержимое курса</h3>
              <p className="gen-results__sub">Уроки и тесты после генерации</p>
            </div>
          <div className="course-sections">
            <section className="course-section">
              <h3>Уроки ({lessons.length})</h3>
              {lessons.length === 0 ? (
                <p className="empty-hint">Уроков пока нет. Загрузите файлы и сгенерируйте уроки.</p>
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
                        title="Удалить урок"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="course-section">
              <h3>Тесты ({tests.length})</h3>
              {tests.length === 0 ? (
                <p className="empty-hint">Тестов пока нет. Выберите уроки и сгенерируйте тест.</p>
              ) : (
                <div className="tests-grid">
                  {tests.map((t) => (
                    <Link
                      key={t.id}
                      to={`/courses/${id}/tests/${t.id}`}
                      className="test-card"
                    >
                      <FiCheckSquare />
                      <span>{t.title}</span>
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
