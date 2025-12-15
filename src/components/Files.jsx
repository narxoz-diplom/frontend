import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { canDelete, isAdmin } from '../utils/roles'

const Files = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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


  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      return
    }
    try {
      await api.delete(`/files/${id}`)
      setSuccess('Файл успешно удален')
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
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>File Management</h2>
        <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
          Просмотр и управление файлами. Для загрузки файлов перейдите к соответствующему уроку в курсе.
        </p>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3', marginBottom: '20px' }}>
        <p style={{ margin: 0, color: '#1565c0' }}>
          💡 <strong>Информация:</strong> Файлы теперь загружаются к урокам. 
          Перейдите к нужному курсу и уроку, чтобы загрузить файлы.
        </p>
        <Link 
          to="/courses" 
          className="btn btn-primary"
          style={{ marginTop: '10px', display: 'inline-block' }}
        >
          Перейти к курсам
        </Link>
      </div>

      <div className="card">
        <h3>{isAdmin(window.keycloak) ? 'Все файлы' : 'Мои файлы'} ({files.length})</h3>
        {files.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>
            Файлы не найдены. Файлы загружаются к урокам в курсах.
          </p>
        ) : (
          <ul className="file-list">
            {files.map((file) => (
              <li key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.originalFileName}</div>
                  <div className="file-meta">
                    {formatFileSize(file.fileSize)} • {file.contentType} • 
                    Загружено: {formatDate(file.uploadedAt)}
                  </div>
                </div>
                <div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownload(file.id, file.originalFileName)}
                    style={{ marginRight: '10px' }}
                  >
                    Скачать
                  </button>
                  {canDelete(window.keycloak) && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(file.id)}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Files

