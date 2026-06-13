import React, { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiBookmark, FiClock, FiFileText } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
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
import './learning-academis.css'

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
    jumpToTime,
  } = useVideoPlayback(videoRef, videoUrl, progressKey)
  const {
    notes,
    setNotes,
    bookmarks,
    addNote,
    updateNote,
    deleteNote,
    addBookmark,
    removeBookmark,
  } = useVideoNotes(progressKey)

  const [showNotes, setShowNotes] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)

  if (loading) {
    return (
      <div className="page page-wide video-player-page video-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (!video || !lesson || !course) {
    return (
      <div className="page page-wide video-player-page">
        <div className="learning-flash learning-flash--error">{t('videoPage.notFound')}</div>
      </div>
    )
  }

  const nextVideo = getNextVideo(lessons, lessonId, videoId)
  const prevVideo = getPrevVideo(lessons, lessonId, videoId)
  const courseTitle = pickLocalized(course, 'title') || course.title || ''

  return (
    <div className="page page-wide video-player-page">
      <PageHeader
        title={video.title}
        subtitle={video.description}
        back={`/courses/${courseId}/lessons/${lessonId}`}
        breadcrumb={[
          { label: t('coursesPage.title'), to: '/courses' },
          { label: courseTitle, to: `/courses/${courseId}` },
          { label: t('videoPage.lessons') },
        ]}
        actions={(
          <div className="row gap8 wrap">
            <button
              type="button"
              className={`btn btn-sm ${showNotes ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowNotes(!showNotes)}
            >
              <FiFileText /> {t('videoPage.notes')}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${showBookmarks ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowBookmarks(!showBookmarks)}
            >
              <FiBookmark /> {t('videoPage.bookmarks')}
            </button>
          </div>
        )}
      />

      <div className="video-grid">
        <div className="col gap14 video-main" style={{ minWidth: 0 }}>
          <div className="video-wrapper player">
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

          <div className="card card-pad video-info">
            <h2 className="h2" style={{ fontSize: 19, margin: 0 }}>
              {video.title}
            </h2>
            <div className="row gap14 dim video-meta" style={{ fontSize: 13, marginTop: 7, fontWeight: 600 }}>
              <span className="row gap5">
                <FiClock size={14} />
                {t('videoPage.duration')}: {formatDuration(video.duration)}
              </span>
              <span>{t('videoPage.size')}: {formatFileSize(video.fileSize)}</span>
            </div>
            {video.description && (
              <p className="muted video-description" style={{ marginTop: 12, fontSize: 14 }}>
                {video.description}
              </p>
            )}

            <div className="row gap10 video-navigation" style={{ marginTop: 16 }}>
              {prevVideo ? (
                <Link
                  to={`/courses/${courseId}/lessons/${prevVideo.lessonId}/videos/${prevVideo.videoId}`}
                  className="btn btn-outline"
                >
                  <Icon name="chevLeft" size={16} />
                  {t('videoPage.previous')}
                </Link>
              ) : (
                <span />
              )}
              {nextVideo && (
                <Link
                  to={`/courses/${courseId}/lessons/${nextVideo.lessonId}/videos/${nextVideo.videoId}`}
                  className="btn btn-primary"
                  style={{ marginLeft: 'auto' }}
                >
                  {t('videoPage.next')}
                  <Icon name="chevRight" size={16} />
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
