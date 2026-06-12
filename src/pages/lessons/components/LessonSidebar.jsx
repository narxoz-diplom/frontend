import React from 'react'
import { Link } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/localize'
import LessonChat from '../LessonChat'

const LessonSidebar = ({ course, courseId, lesson, lessonId, lessons, prevLesson, nextLesson }) => {
  const { t } = useTranslation()

  return (
    <aside className="lesson-sidebar lesson-rail">
      <div className="sidebar-section lesson-rail__card">
        <p className="lesson-rail__eyebrow">{t('lessonPage.course')}</p>
        <h3 className="lesson-rail__title">{pickLocalized(course, 'title')}</h3>
        <Link to={`/courses/${courseId}`} className="lesson-rail__link">
          {t('lessonPage.openCoursePage')}
        </Link>
      </div>

      <div className="sidebar-section lesson-rail__card">
        <p className="lesson-rail__eyebrow">{t('lessonPage.navigation')}</p>
        <h3 className="lesson-rail__title lesson-rail__title--sm">{t('lessonPage.allLessons')}</h3>
        <div className="lessons-nav">
          {lessons.map((l, index) => (
            <Link
              key={l.id}
              to={`/courses/${courseId}/lessons/${l.id}`}
              className={`lesson-nav-item ${l.id === parseInt(lessonId) ? 'active' : ''}`}
            >
              <span className="lesson-nav-number">{index + 1}</span>
              <span className="lesson-nav-title">{pickLocalized(l, 'title')}</span>
            </Link>
          ))}
        </div>
      </div>

      <LessonChat
        lessonId={lessonId}
        courseId={courseId}
        lessonTitle={pickLocalized(lesson, 'title')}
        courseTitle={pickLocalized(course, 'title')}
        lessonContent={pickLocalized(lesson, 'content') || ''}
      />

      <div className="lesson-navigation lesson-rail__nav">
        {prevLesson && (
          <Link
            to={`/courses/${courseId}/lessons/${prevLesson.id}`}
            className="nav-btn prev-btn"
          >
            <FiChevronLeft aria-hidden /> {t('lessonPage.previous')}
          </Link>
        )}
        {nextLesson && (
          <Link
            to={`/courses/${courseId}/lessons/${nextLesson.id}`}
            className="nav-btn next-btn"
          >
            {t('lessonPage.next')} <FiChevronRight aria-hidden />
          </Link>
        )}
      </div>
    </aside>
  )
}

export default LessonSidebar
