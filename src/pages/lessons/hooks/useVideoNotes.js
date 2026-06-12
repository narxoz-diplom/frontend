import { useState, useEffect } from 'react'
import {
  readVideoNotes,
  saveVideoNotes,
  readVideoBookmarks,
  saveVideoBookmarks
} from '../lib/videoStorage'
import { formatTime } from '../lib/formatters'

export function useVideoNotes(progressKey) {
  const [notes, setNotes] = useState([])
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    setNotes(readVideoNotes(progressKey))
    setBookmarks(readVideoBookmarks(progressKey))
  }, [progressKey])

  const persistNotes = (newNotes) => {
    setNotes(newNotes)
    saveVideoNotes(progressKey, newNotes)
  }

  const persistBookmarks = (newBookmarks) => {
    setBookmarks(newBookmarks)
    saveVideoBookmarks(progressKey, newBookmarks)
  }

  const addNote = (text, time) => {
    const newNote = {
      id: Date.now(),
      time,
      text,
      createdAt: new Date().toISOString()
    }
    persistNotes([...notes, newNote].sort((a, b) => a.time - b.time))
  }

  const updateNote = (id, text) => {
    persistNotes(notes.map(note => (note.id === id ? { ...note, text } : note)))
  }

  const deleteNote = (id) => {
    persistNotes(notes.filter(note => note.id !== id))
  }

  const addBookmark = (time) => {
    const newBookmark = {
      id: Date.now(),
      time,
      title: `Bookmark at ${formatTime(time)}`
    }
    persistBookmarks([...bookmarks, newBookmark].sort((a, b) => a.time - b.time))
  }

  const removeBookmark = (id) => {
    persistBookmarks(bookmarks.filter(b => b.id !== id))
  }

  return {
    notes,
    setNotes,
    bookmarks,
    addNote,
    updateNote,
    deleteNote,
    addBookmark,
    removeBookmark
  }
}
