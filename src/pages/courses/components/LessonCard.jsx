import React from 'react'
import { Link } from 'react-router-dom'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
import { estimateLessonMinutes, lessonHasVideo } from '../lib/courseDetailUi'

const LessonCard = ({
  courseId,
  lesson,
  index,
  progress,
  highlighted,
  lessonRefs,
  canView = true,
}) => {
  const { t } = useTranslation()
  const isCompleted = progress?.completed === true
  const hasVideo = lessonHasVideo(lesson)
  const durationLabel = t('coursePage.durationMinutes', {
    count: estimateLessonMinutes(lesson),
  })

  const content = (
    <>
      <span
        className={`lesson-num${isCompleted ? ' done' : ''}${highlighted ? ' cur' : ''}`}
        aria-hidden
      >
        {isCompleted ? <Icon name="check" size={14} /> : index + 1}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 650, fontSize: 14 }}>{pickLocalized(lesson, 'title')}</div>
        <div className="row gap10 dim" style={{ fontSize: 12, marginTop: 2 }}>
          <span className="row gap4">
            <Icon name="clock" size={12} />
            {durationLabel}
          </span>
          {hasVideo && (
            <span className="row gap4">
              <Icon name="video" size={12} />
              {t('coursePage.videoLabel')}
            </span>
          )}
        </div>
      </div>
      {canView ? (
        <Icon name="chevRight" size={17} style={{ color: 'var(--text-3)' }} />
      ) : (
        <Icon name="lock" size={15} style={{ color: 'var(--text-3)' }} />
      )}
    </>
  )

  if (!canView) {
    return (
      <div
        ref={(node) => {
          if (node) lessonRefs.current[lesson.id] = node
          else delete lessonRefs.current[lesson.id]
        }}
        className={`lesson-row${highlighted ? ' lesson-row--hit' : ''}`}
        style={{ cursor: 'default', opacity: 0.85 }}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      ref={(node) => {
        if (node) lessonRefs.current[lesson.id] = node
        else delete lessonRefs.current[lesson.id]
      }}
      to={`/courses/${courseId}/lessons/${lesson.id}`}
      className={`lesson-row${highlighted ? ' lesson-row--hit' : ''}`}
    >
      {content}
    </Link>
  )
}

export default LessonCard
