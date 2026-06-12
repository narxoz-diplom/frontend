import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiPlay, FiCheckCircle } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { buildProgressKey, isVideoCompleted } from '../lib/videoStorage'

const VideoSidebar = ({ course, courseId, lessons, lessonId, videoId }) => {
  const { t } = useTranslation()

  return (
    <div className="video-sidebar">
      <div className="course-info">
        <Link to={`/courses/${courseId}`} className="course-link">
          <FiArrowLeft /> {t('videoPage.backToCourse')}
        </Link>
        <h3>{course.title}</h3>
      </div>

      <div className="lessons-sidebar">
        <h4>{t('videoPage.lessons')}</h4>
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
                    const isCompleted = isVideoCompleted(buildProgressKey(courseId, l.id, v.id))
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
  )
}

export default VideoSidebar
