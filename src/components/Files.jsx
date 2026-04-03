import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit3, FiTrash2, FiSave, FiX, FiDownload } from 'react-icons/fi'
import api from '../services/api'
import { useAlert } from '../context/AlertProvider'
import { canDelete, isAdmin, canUpload } from '../utils/roles'
import './Files.css'

const Files = () => {
  const { confirm, toast } = useAlert()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingFile, setEditingFile] = useState(null)
  const [editFileName, setEditFileName] = useState('')

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await api.get('/files')
      setFiles(response.data)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке файлов')
    } finally {
      setLoading(false)
    }
  }


  const handleEdit = (file) => {
    setEditingFile(file.id)
    setEditFileName(file.originalFileName)
  }

  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/files/${id}`, { originalFileName: editFileName })
      setSuccess('Файл успешно обновлен')
      setEditingFile(null)
      setEditFileName('')
      loadFiles()
    } catch (err) {
      setError('Ошибка при обновлении файла')
    }
  }

  const handleCancelEdit = () => {
    setEditingFile(null)
    setEditFileName('')
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Удаление файла',
      message: 'Удалить этот файл?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await api.delete(`/files/${id}`)
      toast('Файл удалён', 'success')
      loadFiles()
    } catch (err) {
      setError('Ошибка при удалении файла')
    }
  }

  const handleDownload = async (id, fileName) => {
    try {
      const response = await api.get(`/files/${id}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('Ошибка при скачивании файла')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return <div className="loading">Загрузка файлов...</div>
  }

    return (
        <div className="files-section"> {/* Добавили уникальный класс-обертку */}
            <div className="files-header">
                <h2>File Management</h2>
                <p className="files-subtitle">
                    Просмотр и управление файлами. Для загрузки файлов перейдите к соответствующему уроку в курсе.
                </p>
            </div>

            {error && <div className="error-banner">{error}</div>}
            {success && <div className="success-banner">{success}</div>}

            {/* Убрали inline style, заменили на класс info-banner */}
            <div className="info-banner">
                <div className="info-content">
                    <strong>Информация:</strong> Файлы теперь загружаются к урокам.
                    Перейдите к нужному курсу и уроку, чтобы загрузить файлы.
                </div>
                <Link to="/courses" className="btn-primary">
                    Перейти к курсам
                </Link>
            </div>

            {/* Заменили "card" на "files-container-card", чтобы глобальный CSS не мешал */}
            <div className="files-container-card">
                <div className="card-header-flex">
                    <h3>{isAdmin(window.keycloak) ? 'Все файлы' : 'Мои файлы'}</h3>
                    <span className="file-count-badge">{files.length}</span>
                </div>

                {files.length === 0 ? (
                    <div className="empty-files">
                        <p>Файлы не найдены. Файлы загружаются к урокам в курсах.</p>
                    </div>
                ) : (
                    <ul className="file-list">
                        {files.map((file) => (
                            <li key={file.id} className="file-item">
                                <div className="file-icon-wrapper">
                                    <FiFileText />
                                </div>

                                <div className="file-content">
                                    {editingFile === file.id ? (
                                        <div className="file-edit-form">
                                            <input
                                                type="text"
                                                value={editFileName}
                                                onChange={(e) => setEditFileName(e.target.value)}
                                                className="file-edit-input"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="file-name" title={file.originalFileName}>
                                                {file.originalFileName}
                                            </div>
                                            <div className="file-meta">
                                                <span>{formatFileSize(file.fileSize)}</span>
                                                <span>{file.contentType.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                                <span>{formatDate(file.uploadedAt)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="file-actions">
                                    {editingFile === file.id ? (
                                        <>
                                            <button className="btn-icon" onClick={() => handleSaveEdit(file.id)} title="Сохранить">
                                                <FiSave style={{ color: 'var(--primary-color)' }} />
                                            </button>
                                            <button className="btn-icon" onClick={handleCancelEdit} title="Отмена">
                                                <FiX />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-icon" onClick={() => handleDownload(file.id, file.originalFileName)} title="Скачать">
                                                <FiDownload />
                                            </button>
                                            {canUpload(window.keycloak) && (
                                                <button className="btn-icon" onClick={() => handleEdit(file)} title="Редактировать">
                                                    <FiEdit3 />
                                                </button>
                                            )}
                                            {canUpload(window.keycloak) && (
                                                <button className="btn-icon danger" onClick={() => handleDelete(file.id)} title="Удалить">
                                                    <FiTrash2 />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default Files

