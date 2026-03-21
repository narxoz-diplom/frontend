import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiPlus,
  FiFile,
  FiBook,
  FiCheckSquare,
  FiUpload,
  FiLoader,
  FiTrash2,
  FiArrowLeft,
  FiMail,
  FiUserPlus,
  FiX
} from 'react-icons/fi'
import api from '../services/api'
import { useAlert } from '../context/AlertProvider'
import { canUpload } from '../utils/roles'
import './CourseEdit.css'

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

  const handleGenerateLessons = async () => {
    if (selectedFileIds.size === 0) {
      setError('Выберите хотя бы один файл')
      return
    }
    setGeneratingLessons(true)
    setError(null)
    try {
      await api.post(`/courses/${id}/lessons/generate-from-files`, {
        fileIds: Array.from(selectedFileIds)
      })
      loadData()
      setSelectedFileIds(new Set())
    } catch (err) {
      console.error('Error generating lessons:', err)
      setError(err.response?.data?.message || 'Ошибка генерации уроков')
    } finally {
      setGeneratingLessons(false)
    }
  }

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
        title: testTitle || 'Тест по курсу'
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
        <aside className="course-edit-sidebar">
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
            <h3>Загруженные файлы</h3>
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
        <main className="course-edit-main">
          <div className="generate-actions">
            <div className="generate-card">
              <h4>Уроки из файлов</h4>
              <p>Выберите файлы слева и сгенерируйте уроки с помощью ИИ</p>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGenerateLessons}
                disabled={generatingLessons || selectedFileIds.size === 0}
              >
                {generatingLessons ? (
                  <><FiLoader className="spin" /> Генерация...</>
                ) : (
                  <><FiBook /> Генерировать уроки из выбранных файлов</>
                )}
              </button>
            </div>
            <div className="generate-card">
              <h4>Тест из уроков</h4>
              <p>Выберите уроки и сгенерируйте тест</p>
              <input
                type="text"
                placeholder="Название теста (опционально)"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="test-title-input"
              />
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGenerateTest}
                disabled={generatingTest || selectedLessonIds.size === 0}
              >
                {generatingTest ? (
                  <><FiLoader className="spin" /> Генерация...</>
                ) : (
                  <><FiCheckSquare /> Генерировать тест из выбранных уроков</>
                )}
              </button>
            </div>
          </div>

          {/* Разделы: Уроки и Тесты */}
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
        </main>
      </div>
    </div>
  )
}

export default CourseEdit
