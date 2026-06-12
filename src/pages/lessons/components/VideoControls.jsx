import React from 'react'
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiBookmark } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { formatTime } from '../lib/formatters'

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const VideoControls = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  showSpeedMenu,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleSpeedMenu,
  onChangePlaybackRate,
  onAddBookmark,
  onToggleFullscreen
}) => {
  const { t } = useTranslation()
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="video-controls">
      <div className="progress-bar-container" onClick={onSeek}>
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
          <button className="control-btn" onClick={onTogglePlay}>
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>

          <div className="volume-control">
            <button className="control-btn" onClick={onToggleMute}>
              {isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={onVolumeChange}
              className="volume-slider"
            />
          </div>

          <div className="time-display">
            <span>{formatTime(Math.floor(currentTime))}</span>
            <span> / </span>
            <span>{formatTime(Math.floor(duration))}</span>
          </div>
        </div>

        <div className="controls-right">
          <div className="speed-control">
            <button
              className="control-btn"
              onClick={onToggleSpeedMenu}
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="speed-menu">
                {PLAYBACK_RATES.map(rate => (
                  <button
                    key={rate}
                    className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                    onClick={() => onChangePlaybackRate(rate)}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="control-btn" onClick={onAddBookmark} title={t('videoPage.addBookmark')}>
            <FiBookmark />
          </button>

          <button className="control-btn" onClick={onToggleFullscreen}>
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoControls
