import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import { Icon } from '@/shared/ui/academis'

const LessonSidebar = ({ course, courseId, lessonId, lessons, lessonProgress }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentIndex = lessons.findIndex((l) => l.id === parseInt(lessonId, 10))

  return (
    <aside className="lesson-aside">
      <div className="card" style={{ position: 'sticky', top: 12 }}>
        <div className="sec-head">
          <h3 className="h3">{t('lessonPage.navigation')}</h3>
          <span className="dim mono" style={{ fontSize: 12 }}>
            {currentIndex + 1}/{lessons.length}
          </span>
        </div>
        <div className="lesson-aside-scroll">
          {lessons.map((lesson, index) => {
            const isCurrent = lesson.id === parseInt(lessonId, 10)
            const isDone = lessonProgress?.[lesson.id]?.completed
            return (
              <div
                key={lesson.id}
                className={`lnav-item${isCurrent ? ' current' : ''}`}
                onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') navigate(`/courses/${courseId}/lessons/${lesson.id}`)
                }}
                role="link"
                tabIndex={0}
              >
                <span
                  className={`lesson-num${isDone ? ' done' : ''}${isCurrent ? ' cur' : ''}`}
                  style={{ width: 26, height: 26, fontSize: 12 }}
                >
                  {isDone ? <Icon name="check" size={13} /> : index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? 700 : 550,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {pickLocalized(lesson, 'title')}
                  </div>
                </div>
                {lesson.videos?.length > 0 && (
                  <Icon name="video" size={13} style={{ color: 'var(--text-3)' }} />
                )}
              </div>
            )
          })}
        </div>
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border)' }}>
          <Link to={`/courses/${courseId}`} className="btn btn-sm btn-ghost btn-block">
            <Icon name="book" size={14} />
            {t('lessonPage.openCoursePage')}
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default LessonSidebar
