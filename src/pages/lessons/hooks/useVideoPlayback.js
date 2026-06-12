import { useState, useEffect } from 'react'
import {
  readVideoProgress,
  saveVideoProgress,
  readPlaybackRate,
  savePlaybackRate
} from '../lib/videoStorage'

export function useVideoPlayback(videoRef, videoUrl, progressKey) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  const saveProgress = (time) => {
    if (typeof Storage === 'undefined') return
    saveVideoProgress(progressKey, {
      currentTime: time,
      duration: duration,
      completed: time >= duration * 0.95,
      lastWatched: new Date().toISOString()
    })
  }

  const loadProgress = () => {
    if (typeof Storage === 'undefined' || !videoRef.current) return
    const savedProgress = readVideoProgress()[progressKey]
    if (!savedProgress || savedProgress.currentTime === undefined) return
    const savedTime = savedProgress.currentTime || 0
    if (videoRef.current.readyState >= 2) {
      videoRef.current.currentTime = savedTime
      setCurrentTime(savedTime)
    } else {
      const checkReady = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          videoRef.current.currentTime = savedTime
          setCurrentTime(savedTime)
        } else if (videoRef.current) {
          setTimeout(checkReady, 100)
        }
      }
      checkReady()
    }
  }

  const loadPlaybackRate = () => {
    const rate = readPlaybackRate()
    if (rate != null && videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  useEffect(() => {
    loadProgress()
    loadPlaybackRate()
  }, [progressKey])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const current = video.currentTime
      setCurrentTime(current)
      if (duration > 0) {
        saveProgress(current)
      }
    }

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration
      if (videoDuration && videoDuration > 0) {
        setDuration(videoDuration)
        setTimeout(() => {
          loadProgress()
        }, 100)
      }
    }

    const handleLoadedData = () => {
      const videoDuration = video.duration
      if (videoDuration && videoDuration > 0 && duration === 0) {
        setDuration(videoDuration)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleCanPlay = () => {
      if (video.duration && video.duration > 0 && duration === 0) {
        setDuration(video.duration)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('volumechange', handleVolumeChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('volumechange', handleVolumeChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [videoUrl, duration])

  const togglePlay = async () => {
    if (!videoRef.current) return
    try {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        await videoRef.current.play()
        setIsPlaying(true)
      }
    } catch {
      setIsPlaying(false)
    }
  }

  const handleSeek = (e) => {
    if (!videoRef.current || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = pos * duration
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
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
      savePlaybackRate(rate)
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

  const jumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return {
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
  }
}
