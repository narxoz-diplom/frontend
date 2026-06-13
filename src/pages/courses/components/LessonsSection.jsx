import React from 'react'
import { Link } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import { SectionCard, EmptyState, Icon } from '@/shared/ui/academis'
import LessonCard from './LessonCard'

const LessonsSection = ({
  courseId,
  previewMode,
  lessons,
  lessonProgress,
  highlightedLessonId,
  lessonRefs,
}) => {
  const { t } = useTranslation()
  const isTeacher = canUpload(auth)
  const canView = !previewMode

  const addLessonAction = isTeacher ? (
    <Link to={`/courses/${courseId}/edit`} className="btn btn-sm btn-outline">
      <Icon name="plus" size={14} />
      {t('coursePage.addLesson')}
    </Link>
  ) : null

  return (
    <SectionCard title={t('coursePage.lessons')} icon="book" action={addLessonAction}>
      {lessons.length === 0 ? (
        <EmptyState
          icon="book"
          title={t('coursePage.emptyLessons')}
          desc={
            isTeacher
              ? t('coursePage.createFirstLessonStudio')
              : t('coursePage.emptyLessonsStudent')
          }
          action={
            isTeacher ? (
              <Link to={`/courses/${courseId}/edit`} className="btn btn-primary btn-sm">
                <Icon name="sparkles" size={14} />
                {t('coursePage.openStudio')}
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="col" style={{ gap: 4 }}>
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
              index={index}
              progress={lessonProgress[lesson.id] || { completed: false, progress: 0 }}
              highlighted={String(lesson.id) === highlightedLessonId}
              lessonRefs={lessonRefs}
              canView={canView}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}

export default LessonsSection
