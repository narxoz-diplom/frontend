import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit3, FiTrash2, FiSave, FiX, FiDownload, FiFileText } from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { getFiles, renameFile, deleteFile, downloadFile } from '@/shared/api/filesApi'
import { useAlert } from '@/app/providers/AlertProvider'
import { isAdmin, canUpload } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import './Files.css'

const Files = () => {
  const { t } = useTranslation()
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
      const response = await getFiles()
      setFiles(response.data)
      setError(null)
    } catch (err) {
      setError(t('filesPage.loadError'))
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
      await renameFile(id, editFileName)
      setSuccess(t('filesPage.updateSuccess'))
      setEditingFile(null)
      setEditFileName('')
      loadFiles()
    } catch (err) {
      setError(t('filesPage.updateError'))
    }
  }

  const handleCancelEdit = () => {
    setEditingFile(null)
    setEditFileName('')
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('filesPage.deleteTitle'),
      message: t('filesPage.deleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteFile(id)
      toast(t('filesPage.deleted'), 'success')
      loadFiles()
    } catch (err) {
      setError(t('filesPage.deleteError'))
    }
  }

  const handleDownload = async (id, fileName) => {
    try {
      const response = await downloadFile(id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(t('filesPage.downloadError'))
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
    return <div className="loading">{t('filesPage.loading')}</div>
  }

    return (
        <div className="files-section">
            <div className="files-header">
                <h2>{t('filesPage.title')}</h2>
                <p className="files-subtitle">
                    {t('filesPage.subtitle')}
                </p>
            </div>

            {error && <div className="error-banner">{error}</div>}
            {success && <div className="success-banner">{success}</div>}

            <div className="info-banner">
                <div className="info-content">
                    <strong>{t('common.info')}:</strong> {t('filesPage.infoText')}
                </div>
                <Link to="/courses" className="btn-primary">
                    {t('filesPage.goToCourses')}
                </Link>
            </div>

            <div className="files-container-card">
                <div className="card-header-flex">
                    <h3>{isAdmin(auth) ? t('filesPage.allFiles') : t('filesPage.myFiles')}</h3>
                    <span className="file-count-badge">{files.length}</span>
                </div>

                {files.length === 0 ? (
                    <div className="empty-files">
                        <p>{t('filesPage.empty')}</p>
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
                                            <button className="btn-icon" onClick={() => handleSaveEdit(file.id)} title={t('common.save')}>
                                                <FiSave style={{ color: 'var(--primary-color)' }} />
                                            </button>
                                            <button className="btn-icon" onClick={handleCancelEdit} title={t('common.cancel')}>
                                                <FiX />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-icon" onClick={() => handleDownload(file.id, file.originalFileName)} title={t('common.file')}>
                                                <FiDownload />
                                            </button>
                                            {canUpload(auth) && (
                                                <button className="btn-icon" onClick={() => handleEdit(file)} title={t('common.edit')}>
                                                    <FiEdit3 />
                                                </button>
                                            )}
                                            {canUpload(auth) && (
                                                <button className="btn-icon danger" onClick={() => handleDelete(file.id)} title={t('common.delete')}>
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
