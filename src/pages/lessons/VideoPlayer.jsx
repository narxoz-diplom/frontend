import React, { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiBookmark, FiClock, FiFileText } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { useVideoData } from './hooks/useVideoData'
import { useVideoPlayback } from './hooks/useVideoPlayback'
import { useVideoNotes } from './hooks/useVideoNotes'
import { getNextVideo, getPrevVideo } from './lib/videoNavigation'
import { buildProgressKey } from './lib/videoStorage'
import { formatDuration, formatFileSize } from './lib/formatters'
import VideoControls from './components/VideoControls'
import NotesPanel from './components/NotesPanel'
import BookmarksPanel from './components/BookmarksPanel'
import VideoSidebar from './components/VideoSidebar'
import './VideoPlayer.css'

const VideoPlayer = () => {
  const { t } = useTranslation()
  const { courseId, lessonId, videoId } = useParams()
  const videoRef = useRef(null)
  const progressKey = buildProgressKey(courseId, lessonId, videoId)

  const { video, lesson, course, lessons, loading, setError, videoUrl } = useVideoData(courseId, lessonId, videoId)
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    isMuted,
    playbackRate,
    isFullscreen,
    showSpeedMenu,
    setShowSpeedMenu,
    saveProgress,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    changePlaybackRate,
    toggleFullscreen,
    jumpToTime
  } = useVideoPlayback(videoRef, videoUrl, progressKey)
  const {
    notes,
    setNotes,
    bookmarks,
    addNote,
    updateNote,
    deleteNote,
    addBookmark,
    removeBookmark
  } = useVideoNotes(progressKey)

  const [showNotes, setShowNotes] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>
  }

  if (!video || !lesson || !course) {
    return <div className="error">{t('videoPage.notFound')}</div>
  }

  const nextVideo = getNextVideo(lessons, lessonId, videoId)
  const prevVideo = getPrevVideo(lessons, lessonId, videoId)

  return (
    <div className="video-player-page">
      <div className="video-player-container">
        <div className="video-main">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              src={videoUrl}
              className="video-element"
              onClick={togglePlay}
              crossOrigin="anonymous"
              preload="metadata"
              onError={() => {
                setError(t('videoPage.playbackError'))
              }}
              onLoadedMetadata={(e) => {
                const target = e.target
                if (target.duration && target.duration > 0) {
                  setDuration(target.duration)
                }
              }}
              onTimeUpdate={(e) => {
                const target = e.target
                setCurrentTime(target.currentTime)
                if (duration > 0) {
                  saveProgress(target.currentTime)
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              playsInline
            />

            <VideoControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              playbackRate={playbackRate}
              isFullscreen={isFullscreen}
              showSpeedMenu={showSpeedMenu}
              onTogglePlay={togglePlay}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
              onToggleSpeedMenu={() => setShowSpeedMenu(!showSpeedMenu)}
              onChangePlaybackRate={changePlaybackRate}
              onAddBookmark={() => addBookmark(currentTime)}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>

          <div className="video-info">
            <div className="video-header">
              <h1>{video.title}</h1>
              <div className="video-actions">
                <button
                  className={`action-btn ${showNotes ? 'active' : ''}`}
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <FiFileText /> {t('videoPage.notes')}
                </button>
                <button
                  className={`action-btn ${showBookmarks ? 'active' : ''}`}
                  onClick={() => setShowBookmarks(!showBookmarks)}
                >
                  <FiBookmark /> {t('videoPage.bookmarks')}
                </button>
              </div>
            </div>

            {video.description && <p className="video-description">{video.description}</p>}

            <div className="video-meta">
              <span><FiClock /> {t('videoPage.duration')}: {formatDuration(video.duration)}</span>
              <span>{t('videoPage.size')}: {formatFileSize(video.fileSize)}</span>
            </div>

            <div className="video-navigation">
              {prevVideo && (
                <Link
                  to={`/courses/${courseId}/lessons/${prevVideo.lessonId}/videos/${prevVideo.videoId}`}
                  className="nav-btn prev-btn"
                >
                  <FiArrowLeft /> {t('videoPage.previous')}
                </Link>
              )}
              {nextVideo && (
                <Link
                  to={`/courses/${courseId}/lessons/${nextVideo.lessonId}/videos/${nextVideo.videoId}`}
                  className="nav-btn next-btn"
                >
                  {t('videoPage.next')} <FiArrowRight />
                </Link>
              )}
            </div>
          </div>

          {showNotes && (
            <NotesPanel
              notes={notes}
              setNotes={setNotes}
              currentTime={currentTime}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onJumpToTime={jumpToTime}
              onClose={() => setShowNotes(false)}
            />
          )}

          {showBookmarks && (
            <BookmarksPanel
              bookmarks={bookmarks}
              onJumpToTime={jumpToTime}
              onRemoveBookmark={removeBookmark}
              onClose={() => setShowBookmarks(false)}
            />
          )}
        </div>

        <VideoSidebar
          course={course}
          courseId={courseId}
          lessons={lessons}
          lessonId={lessonId}
          videoId={videoId}
        />
      </div>
    </div>
  )
}

export default VideoPlayer
