import React, { useState } from 'react'
import { FiFileText, FiEdit3, FiTrash2, FiX, FiSave } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { formatTime } from '../lib/formatters'

const NotesPanel = ({ notes, setNotes, currentTime, onAddNote, onUpdateNote, onDeleteNote, onJumpToTime, onClose }) => {
  const { t } = useTranslation()
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [editingNote, setEditingNote] = useState(null)

  const handleAddNote = () => {
    if (!noteText.trim()) return
    onAddNote(noteText, currentTime)
    setNoteText('')
    setShowNoteForm(false)
  }

  const handleUpdateNote = (id, text) => {
    onUpdateNote(id, text)
    setEditingNote(null)
  }

  return (
    <div className="notes-panel">
      <div className="panel-header">
        <h3><FiFileText /> {t('videoPage.notes')}</h3>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      {!showNoteForm ? (
        <button className="btn btn-primary" onClick={() => setShowNoteForm(true)}>
          <FiEdit3 /> {t('videoPage.addNoteAt', { time: formatTime(currentTime) })}
        </button>
      ) : (
        <div className="note-form">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t('videoPage.enterNote')}
            rows="3"
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleAddNote}>
              <FiSave /> {t('common.save')}
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setShowNoteForm(false)
              setNoteText('')
            }}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="notes-list">
        {notes.length === 0 ? (
          <p className="empty-state">{t('videoPage.noNotes')}</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="note-item">
              {editingNote === note.id ? (
                <div className="note-edit">
                  <textarea
                    value={note.text}
                    onChange={(e) => {
                      const newNotes = notes.map(n =>
                        n.id === note.id ? { ...n, text: e.target.value } : n
                      )
                      setNotes(newNotes)
                    }}
                    rows="2"
                  />
                  <div className="note-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleUpdateNote(note.id, note.text)}
                    >
                      <FiSave /> {t('common.save')}
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingNote(null)}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="note-header">
                    <button
                      className="note-time"
                      onClick={() => onJumpToTime(note.time)}
                    >
                      {formatTime(note.time)}
                    </button>
                    <div className="note-actions">
                      <button
                        className="icon-btn"
                        onClick={() => setEditingNote(note.id)}
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => onDeleteNote(note.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <p className="note-text">{note.text}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotesPanel
