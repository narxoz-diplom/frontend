import React, { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FiEdit3, FiSave, FiX, FiTrash2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
import { pickLocalized } from '@/i18n/localize'
import { extractEmbeddedImages, removeFirstOccurrence } from '../lib/markdownImages'

const LessonNotes = ({ lesson, canEdit, onSave }) => {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  useEffect(() => {
    setEditedContent(pickLocalized(lesson, 'content') || '')
  }, [lesson])

  const embeddedImages = useMemo(
    () => extractEmbeddedImages(editedContent),
    [editedContent]
  )

  const handleRemoveEmbeddedImage = (fullMatch) => {
    setEditedContent((prev) => removeFirstOccurrence(prev, fullMatch))
  }

  const handleSave = async () => {
    const saved = await onSave(editedContent)
    if (saved) {
      setIsEditing(false)
    }
  }

  return (
    <div className="card">
      <div className="sec-head">
        <div className="row gap8" style={{ alignItems: 'center' }}>
          <Icon name="book" size={17} style={{ color: 'var(--brand)' }} />
          <h3 className="h3">{t('lessonPage.notes')}</h3>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              if (isEditing) {
                setIsEditing(false)
                setEditedContent(pickLocalized(lesson, 'content') || '')
              } else {
                setIsEditing(true)
              }
            }}
          >
            {isEditing ? (
              <>
                <FiX /> {t('common.cancel')}
              </>
            ) : (
              <>
                <FiEdit3 /> {t('common.edit')}
              </>
            )}
          </button>
        )}
      </div>

      <div style={{ padding: '6px 18px 18px' }}>
      {isEditing ? (
        <div className="content-editor">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder={t('lessonPage.notes')}
            className="content-textarea"
            rows="20"
          />
          {embeddedImages.length > 0 && (
            <div className="markdown-embedded-images" aria-label="Markdown images">
              <p className="markdown-embedded-images__title">Markdown images</p>
              <ul className="markdown-embedded-images__list">
                {embeddedImages.map((img, idx) => (
                  <li key={`embed-img-${idx}-${img.url.slice(0, 24)}`} className="markdown-embedded-images__item">
                    <div className="markdown-embedded-images__preview">
                      <img
                        src={img.url}
                        alt={img.alt || ''}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="markdown-embedded-images__meta">
                      <span className="markdown-embedded-images__url" title={img.url}>
                        {img.url.length > 72 ? `${img.url.slice(0, 72)}…` : img.url}
                      </span>
                      {img.alt && (
                        <span className="markdown-embedded-images__alt">alt: {img.alt}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline markdown-embedded-images__remove"
                      onClick={() => handleRemoveEmbeddedImage(img.fullMatch)}
                      title={t('common.delete')}
                    >
                      <FiTrash2 /> {t('common.delete')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="editor-actions">
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              <FiSave /> {t('lessonPage.saveNotes')}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setIsEditing(false)
                setEditedContent(lesson.content || '')
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="lesson-notes-content">
          {pickLocalized(lesson, 'content') ? (
            <div className="markdown markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {pickLocalized(lesson, 'content')}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="empty-notes">
              <p>{t('lessonPage.noNotes')}</p>
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <FiEdit3 /> {t('lessonPage.addNotes')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default LessonNotes
