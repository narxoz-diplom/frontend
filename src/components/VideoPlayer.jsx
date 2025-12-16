import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiArrowLeft,
  FiArrowRight,
  FiBookmark,
  FiEdit3,
  FiTrash2,
  FiX,
  FiSave,
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiChevronRight
} from 'react-icons/fi'
import api from '../services/api'
import './VideoPlayer.css'

const VideoPlayer = () => {
  const { courseId, lessonId, videoId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [video, setVideo] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  
  // Notes and bookmarks
  const [notes, setNotes] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [showNotes, setShowNotes] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)

  const progressKey = `${courseId}-${lessonId}-${videoId}`

  useEffect(() => {
    loadVideo()
    loadProgress()
    loadNotes()
    loadBookmarks()
    loadPlaybackRate()
  }, [videoId, lessonId, courseId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const current = video.currentTime
      setCurrentTime(current)
      saveProgress(current)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      loadProgress()
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [videoRef.current])

  const loadVideo = async () => {
    try {
      setLoading(true)
      
      // Загружаем видео и урок
      const videosResponse = await api.get(`/courses/lessons/${lessonId}/videos`)
      const foundVideo = videosResponse.data.find(v => v.id === parseInt(videoId))
      
      if (foundVideo) {
        setVideo(foundVideo)
        setVideoUrl(`/api${foundVideo.videoUrl}`)
      }

      const lessonsResponse = await api.get(`/courses/${courseId}/lessons`)
      const allLessons = lessonsResponse.data || []
      setLessons(allLessons)
      const foundLesson = allLessons.find(l => l.id === parseInt(lessonId))
      setLesson(foundLesson)

      const courseResponse = await api.get(`/courses/${courseId}`)
      setCourse(courseResponse.data)

      setLoading(false)
    } catch (err) {
      console.error('Error loading video:', err)
      setError('Failed to load video')
      setLoading(false)
    }
  }

  const loadProgress = () => {
    if (typeof Storage !== 'undefined') {
      const progressData = localStorage.getItem('videoProgress')
      if (progressData) {
        try {
          const progress = JSON.parse(progressData)
          const savedProgress = progress[progressKey]
          if (savedProgress && videoRef.current) {
            videoRef.current.currentTime = savedProgress.currentTime || 0
            setCurrentTime(savedProgress.currentTime || 0)
          }
        } catch (e) {
          console.error('Error loading progress:', e)
        }
      }
    }
  }

  const saveProgress = (time) => {
    if (typeof Storage !== 'undefined') {
      const progressData = localStorage.getItem('videoProgress') || '{}'
      try {
        const progress = JSON.parse(progressData)
        const completed = time >= duration * 0.95 // 95% считается завершенным
        progress[progressKey] = {
          currentTime: time,
          duration: duration,
          completed: completed,
          lastWatched: new Date().toISOString()
        }
        localStorage.setItem('videoProgress', JSON.stringify(progress))
      } catch (e) {
        console.error('Error saving progress:', e)
      }
    }
  }

  const loadNotes = () => {
    if (typeof Storage !== 'undefined') {
      const notesData = localStorage.getItem('videoNotes')
      if (notesData) {
        try {
          const allNotes = JSON.parse(notesData)
          const videoNotes = allNotes[progressKey] || []
          setNotes(videoNotes)
        } catch (e) {
          console.error('Error loading notes:', e)
        }
      }
    }
  }

  const saveNotes = (newNotes) => {
    if (typeof Storage !== 'undefined') {
      const notesData = localStorage.getItem('videoNotes') || '{}'
      try {
        const allNotes = JSON.parse(notesData)
        allNotes[progressKey] = newNotes
        localStorage.setItem('videoNotes', JSON.stringify(allNotes))
      } catch (e) {
        console.error('Error saving notes:', e)
      }
    }
  }

  const loadBookmarks = () => {
    if (typeof Storage !== 'undefined') {
      const bookmarksData = localStorage.getItem('videoBookmarks')
      if (bookmarksData) {
        try {
          const allBookmarks = JSON.parse(bookmarksData)
          const videoBookmarks = allBookmarks[progressKey] || []
          setBookmarks(videoBookmarks)
        } catch (e) {
          console.error('Error loading bookmarks:', e)
        }
      }
    }
  }

  const saveBookmarks = (newBookmarks) => {
    if (typeof Storage !== 'undefined') {
      const bookmarksData = localStorage.getItem('videoBookmarks') || '{}'
      try {
        const allBookmarks = JSON.parse(bookmarksData)
        allBookmarks[progressKey] = newBookmarks
        localStorage.setItem('videoBookmarks', JSON.stringify(allBookmarks))
      } catch (e) {
        console.error('Error saving bookmarks:', e)
      }
    }
  }

  const loadPlaybackRate = () => {
    if (typeof Storage !== 'undefined') {
      const savedRate = localStorage.getItem('videoPlaybackRate')
      if (savedRate) {
        const rate = parseFloat(savedRate)
        if (videoRef.current) {
          videoRef.current.playbackRate = rate
          setPlaybackRate(rate)
        }
      }
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
      localStorage.setItem('videoPlaybackRate', rate.toString())
      setShowSpeedMenu(false)
    }
  }

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.video-wrapper')
    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const addBookmark = () => {
    const newBookmark = {
      id: Date.now(),
      time: currentTime,
      title: `Bookmark at ${formatTime(currentTime)}`
    }
    const newBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.time - b.time)
    setBookmarks(newBookmarks)
    saveBookmarks(newBookmarks)
  }

  const removeBookmark = (id) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id)
    setBookmarks(newBookmarks)
    saveBookmarks(newBookmarks)
  }

  const jumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const addNote = () => {
    if (!noteText.trim()) return
    
    const newNote = {
      id: Date.now(),
      time: currentTime,
      text: noteText,
      createdAt: new Date().toISOString()
    }
    const newNotes = [...notes, newNote].sort((a, b) => a.time - b.time)
    setNotes(newNotes)
    saveNotes(newNotes)
    setNoteText('')
    setShowNoteForm(false)
  }

  const updateNote = (id, text) => {
    const newNotes = notes.map(note => 
      note.id === id ? { ...note, text } : note
    )
    setNotes(newNotes)
    saveNotes(newNotes)
    setEditingNote(null)
  }

  const deleteNote = (id) => {
    const newNotes = notes.filter(note => note.id !== id)
    setNotes(newNotes)
    saveNotes(newNotes)
  }

  const getNextVideo = () => {
    const currentLessonIndex = lessons.findIndex(l => l.id === parseInt(lessonId))
    if (currentLessonIndex === -1) return null
    
    const currentLesson = lessons[currentLessonIndex]
    const currentVideoIndex = currentLesson.videos?.findIndex(v => v.id === parseInt(videoId)) || -1
    
    // Следующее видео в текущем уроке
    if (currentLesson.videos && currentVideoIndex < currentLesson.videos.length - 1) {
      return {
        lessonId: currentLesson.id,
        videoId: currentLesson.videos[currentVideoIndex + 1].id
      }
    }
    
    // Первое видео следующего урока
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1]
      if (nextLesson.videos && nextLesson.videos.length > 0) {
        return {
          lessonId: nextLesson.id,
          videoId: nextLesson.videos[0].id
        }
      }
    }
    
    return null
  }

  const getPrevVideo = () => {
    const currentLessonIndex = lessons.findIndex(l => l.id === parseInt(lessonId))
    if (currentLessonIndex === -1) return null
    
    const currentLesson = lessons[currentLessonIndex]
    const currentVideoIndex = currentLesson.videos?.findIndex(v => v.id === parseInt(videoId)) || -1
    
    // Предыдущее видео в текущем уроке
    if (currentVideoIndex > 0) {
      return {
        lessonId: currentLesson.id,
        videoId: currentLesson.videos[currentVideoIndex - 1].id
      }
    }
    
    // Последнее видео предыдущего урока
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1]
      if (prevLesson.videos && prevLesson.videos.length > 0) {
        return {
          lessonId: prevLesson.id,
          videoId: prevLesson.videos[prevLesson.videos.length - 1].id
        }
      }
    }
    
    return null
  }

  if (loading) {
    return <div className="loading">Loading video...</div>
  }

  if (!video || !lesson || !course) {
    return <div className="error">Video not found</div>
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const nextVideo = getNextVideo()
  const prevVideo = getPrevVideo()

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
            />
            
            {/* Custom Controls */}
            <div className="video-controls">
              <div className="progress-bar-container" onClick={handleSeek}>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div 
                    className="progress-handle" 
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="controls-bottom">
                <div className="controls-left">
                  <button className="control-btn" onClick={togglePlay}>
                    {isPlaying ? <FiPause /> : <FiPlay />}
                  </button>
                  
                  <div className="volume-control">
                    <button className="control-btn" onClick={toggleMute}>
                      {isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                    />
                  </div>
                  
                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                <div className="controls-right">
                  <div className="speed-control">
                    <button 
                      className="control-btn"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    >
                      {playbackRate}x
                    </button>
                    {showSpeedMenu && (
                      <div className="speed-menu">
                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                          <button
                            key={rate}
                            className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                            onClick={() => changePlaybackRate(rate)}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button className="control-btn" onClick={addBookmark} title="Add bookmark">
                    <FiBookmark />
                  </button>
                  
                  <button className="control-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="video-info">
            <div className="video-header">
              <h1>{video.title}</h1>
              <div className="video-actions">
                <button 
                  className={`action-btn ${showNotes ? 'active' : ''}`}
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <FiFileText /> Notes
                </button>
                <button 
                  className={`action-btn ${showBookmarks ? 'active' : ''}`}
                  onClick={() => setShowBookmarks(!showBookmarks)}
                >
                  <FiBookmark /> Bookmarks
                </button>
              </div>
            </div>
            
            {video.description && <p className="video-description">{video.description}</p>}
            
            <div className="video-meta">
              <span><FiClock /> Duration: {formatDuration(video.duration)}</span>
              <span>Size: {formatFileSize(video.fileSize)}</span>
            </div>
            
            <div className="video-navigation">
              {prevVideo && (
                <Link
                  to={`/courses/${courseId}/lessons/${prevVideo.lessonId}/videos/${prevVideo.videoId}`}
                  className="nav-btn prev-btn"
                >
                  <FiArrowLeft /> Previous
                </Link>
              )}
              {nextVideo && (
                <Link
                  to={`/courses/${courseId}/lessons/${nextVideo.lessonId}/videos/${nextVideo.videoId}`}
                  className="nav-btn next-btn"
                >
                  Next <FiArrowRight />
                </Link>
              )}
            </div>
          </div>
          
          {/* Notes Panel */}
          {showNotes && (
            <div className="notes-panel">
              <div className="panel-header">
                <h3><FiFileText /> Notes</h3>
                <button className="close-btn" onClick={() => setShowNotes(false)}>
                  <FiX />
                </button>
              </div>
              
              {!showNoteForm ? (
                <button className="btn btn-primary" onClick={() => setShowNoteForm(true)}>
                  <FiEdit3 /> Add Note at {formatTime(currentTime)}
                </button>
              ) : (
                <div className="note-form">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter your note..."
                    rows="3"
                  />
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={addNote}>
                      <FiSave /> Save
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                      setShowNoteForm(false)
                      setNoteText('')
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="notes-list">
                {notes.length === 0 ? (
                  <p className="empty-state">No notes yet</p>
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
                              onClick={() => updateNote(note.id, note.text)}
                            >
                              <FiSave /> Save
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingNote(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="note-header">
                            <button 
                              className="note-time"
                              onClick={() => jumpToTime(note.time)}
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
                                onClick={() => deleteNote(note.id)}
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
          )}
          
          {/* Bookmarks Panel */}
          {showBookmarks && (
            <div className="bookmarks-panel">
              <div className="panel-header">
                <h3><FiBookmark /> Bookmarks</h3>
                <button className="close-btn" onClick={() => setShowBookmarks(false)}>
                  <FiX />
                </button>
              </div>
              
              <div className="bookmarks-list">
                {bookmarks.length === 0 ? (
                  <p className="empty-state">No bookmarks yet. Click the bookmark button to add one.</p>
                ) : (
                  bookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="bookmark-item">
                      <button 
                        className="bookmark-time"
                        onClick={() => jumpToTime(bookmark.time)}
                      >
                        <FiClock /> {formatTime(bookmark.time)}
                      </button>
                      <span className="bookmark-title">{bookmark.title}</span>
                      <button 
                        className="icon-btn"
                        onClick={() => removeBookmark(bookmark.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="video-sidebar">
          <div className="course-info">
            <Link to={`/courses/${courseId}`} className="course-link">
              <FiArrowLeft /> Back to Course
            </Link>
            <h3>{course.title}</h3>
          </div>
          
          <div className="lessons-sidebar">
            <h4>Lessons</h4>
            <div className="lessons-list">
              {lessons.map((l, index) => (
                <div key={l.id} className={`lesson-item ${l.id === parseInt(lessonId) ? 'active' : ''}`}>
                  <div className="lesson-item-header">
                    <span className="lesson-number">{index + 1}</span>
                    <span className="lesson-title">{l.title}</span>
                  </div>
                  {l.videos && l.videos.length > 0 && (
                    <div className="lesson-videos-list">
                      {l.videos.map((v) => {
                        const videoProgressKey = `${courseId}-${l.id}-${v.id}`
                        const progressData = localStorage.getItem('videoProgress')
                        let isCompleted = false
                        if (progressData) {
                          try {
                            const progress = JSON.parse(progressData)
                            isCompleted = progress[videoProgressKey]?.completed || false
                          } catch (e) {}
                        }
                        return (
                          <Link
                            key={v.id}
                            to={`/courses/${courseId}/lessons/${l.id}/videos/${v.id}`}
                            className={`video-item ${v.id === parseInt(videoId) ? 'active' : ''}`}
                          >
                            <FiPlay className="video-icon" />
                            <span className="video-title">{v.title}</span>
                            {isCompleted && <FiCheckCircle className="completed-icon" />}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default VideoPlayer
