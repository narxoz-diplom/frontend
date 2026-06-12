import React from 'react'
import { FiBookmark, FiClock, FiTrash2, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { formatTime } from '../lib/formatters'

const BookmarksPanel = ({ bookmarks, onJumpToTime, onRemoveBookmark, onClose }) => {
  const { t } = useTranslation()

  return (
    <div className="bookmarks-panel">
      <div className="panel-header">
        <h3><FiBookmark /> {t('videoPage.bookmarks')}</h3>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      <div className="bookmarks-list">
        {bookmarks.length === 0 ? (
          <p className="empty-state">{t('videoPage.noBookmarks')}</p>
        ) : (
          bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark-item">
              <button
                className="bookmark-time"
                onClick={() => onJumpToTime(bookmark.time)}
              >
                <FiClock /> {formatTime(bookmark.time)}
              </button>
              <span className="bookmark-title">{bookmark.title}</span>
              <button
                className="icon-btn"
                onClick={() => onRemoveBookmark(bookmark.id)}
              >
                <FiTrash2 />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BookmarksPanel
