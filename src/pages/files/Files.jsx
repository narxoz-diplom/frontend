import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getFiles, renameFile, deleteFile, downloadFile } from '@/shared/api/filesApi'
import auth from '@/shared/config/auth'
import { useAlert } from '@/app/providers/AlertProvider'
import { canUpload, isAdmin } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import {
  PageHeader,
  Icon,
  Spinner,
  EmptyState,
  Dropdown,
  Modal,
  ModalHeader,
} from '@/shared/ui/academis'
import '../secondary-academis.css'

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

const formatDate = (dateString, locale) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getFileMeta = (contentType = '', name = '') => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (contentType.includes('pdf') || ext === 'pdf') return { icon: 'doc', color: '#e41616' }
  if (contentType.includes('video') || ['mp4', 'webm', 'mov'].includes(ext)) {
    return { icon: 'video', color: '#2563eb' }
  }
  if (['csv', 'xls', 'xlsx'].includes(ext)) return { icon: 'grade', color: '#11a957' }
  if (['sql', 'db'].includes(ext)) return { icon: 'layers', color: '#7c3aed' }
  return { icon: 'file', color: '#828c9e' }
}

const Files = () => {
  const { t, i18n } = useTranslation()
  const { confirm, toast } = useAlert()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [renamingFile, setRenamingFile] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [search, setSearch] = useState('')

  const locale = i18n.language === 'kz' ? 'kk-KZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await getFiles()
      setFiles(response.data)
      setError(null)
    } catch {
      setError(t('filesPage.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => (f.originalFileName || '').toLowerCase().includes(q))
  }, [files, search])

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + (f.fileSize || 0), 0),
    [files],
  )

  const handleRename = (file) => {
    setRenamingFile(file)
    setRenameValue(file.originalFileName)
  }

  const handleSaveRename = async () => {
    if (!renamingFile) return
    try {
      await renameFile(renamingFile.id, renameValue.trim())
      setSuccess(t('filesPage.updateSuccess'))
      setRenamingFile(null)
      setRenameValue('')
      loadFiles()
    } catch {
      setError(t('filesPage.updateError'))
    }
  }

  const handleDelete = async (file) => {
    const ok = await confirm({
      title: t('filesPage.deleteTitle'),
      message: t('filesPage.deleteMessage'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await deleteFile(file.id)
      toast(t('filesPage.deleted'), 'success')
      loadFiles()
    } catch {
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
    } catch {
      setError(t('filesPage.downloadError'))
    }
  }

  if (loading) {
    return (
      <div className="page page-wide secondary-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('filesPage.loading')}</span>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      <PageHeader
        title={t('filesPage.title')}
        subtitle={`${filteredFiles.length} · ${formatFileSize(totalSize)}`}
        actions={(
          <Link to="/courses" className="btn btn-primary">
            <Icon name="upload" size={16} />
            {t('filesPage.goToCourses')}
          </Link>
        )}
      />

      {error && (
        <div className="secondary-flash secondary-flash--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="secondary-flash secondary-flash--success" role="status">
          {success}
        </div>
      )}

      <div className="card card-pad secondary-flash secondary-flash--info files-info-card">
        <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>
          <strong>{t('common.info')}:</strong> {t('filesPage.infoText')}
        </span>
      </div>

      <div className="input-icon" style={{ maxWidth: 320, marginBottom: 14 }}>
        <span className="ic">
          <Icon name="search" size={16} />
        </span>
        <input
          className="input"
          placeholder={t('filesPage.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredFiles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="files"
            title={t('filesPage.empty')}
            desc={t('filesPage.subtitle')}
          />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{isAdmin(auth) ? t('filesPage.allFiles') : t('filesPage.myFiles')}</th>
                  <th>{t('notificationsPage.type')}</th>
                  <th>{t('videoPage.size')}</th>
                  <th>{t('adminNewsPage.published')}</th>
                  <th style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const meta = getFileMeta(file.contentType, file.originalFileName)
                  return (
                    <tr key={file.id}>
                      <td>
                        <div className="row gap10" style={{ alignItems: 'center' }}>
                          <span
                            className="file-tic"
                            style={{
                              color: meta.color,
                              background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                            }}
                          >
                            <Icon name={meta.icon} size={16} />
                          </span>
                          <span style={{ fontWeight: 600 }}>{file.originalFileName}</span>
                        </div>
                      </td>
                      <td className="muted">
                        {file.contentType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </td>
                      <td className="mono muted">{formatFileSize(file.fileSize)}</td>
                      <td className="muted">{formatDate(file.uploadedAt, locale)}</td>
                      <td>
                        <Dropdown
                          trigger={(
                            <button type="button" className="btn btn-icon btn-ghost btn-sm">
                              <Icon name="dots" size={16} />
                            </button>
                          )}
                        >
                          <div
                            className="menu-item"
                            role="menuitem"
                            onClick={() => handleDownload(file.id, file.originalFileName)}
                          >
                            <Icon name="download" size={16} />
                            {t('coursePage.testResultsExport').replace(' CSV', '')}
                          </div>
                          {canUpload(auth) && (
                            <>
                              <div
                                className="menu-item"
                                role="menuitem"
                                onClick={() => handleRename(file)}
                              >
                                <Icon name="edit" size={16} />
                                {t('common.edit')}
                              </div>
                              <div className="menu-sep" />
                              <div
                                className="menu-item danger"
                                role="menuitem"
                                onClick={() => handleDelete(file)}
                              >
                                <Icon name="trash" size={16} />
                                {t('common.delete')}
                              </div>
                            </>
                          )}
                        </Dropdown>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!renamingFile} onClose={() => setRenamingFile(null)}>
        <ModalHeader
          title={t('common.edit')}
          icon="edit"
          onClose={() => setRenamingFile(null)}
        />
        <div className="modal-body">
          <input
            className="input"
            value={renameValue}
            autoFocus
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
          />
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={() => setRenamingFile(null)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSaveRename}>
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Files
