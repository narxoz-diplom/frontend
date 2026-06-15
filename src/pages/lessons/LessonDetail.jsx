import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { updateLesson } from '@/shared/api/lessonsApi'
import { pickLocalized } from '@/i18n/localize'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import { useCourseProgress } from '@/pages/courses/hooks/useCourseProgress'
import { useLessonData } from './hooks/useLessonData'
import LessonNotes from './components/LessonNotes'
import LessonVideos from './components/LessonVideos'
import LessonFiles from './components/LessonFiles'
import LessonSidebar from './components/LessonSidebar'
import LessonChat from './LessonChat'
import './LessonDetail.css'
import './learning-academis.css'

const LessonDetail = () => {
  const { t } = useTranslation()
  const { courseId, lessonId } = useParams()
  const {
    lesson,
    setLesson,
    course,
    lessons,
    videos,
    files,
    loading,
    error,
    setError,
    refreshVideos,
    refreshFiles,
  } = useLessonData(courseId, lessonId)
  const {
    lessonProgress,
    markLessonComplete,
    markingLessonId,
    currentLessonProgress,
  } = useCourseProgress(courseId)
  const [completeError, setCompleteError] = useState(null)

  const lessonProgressItem = currentLessonProgress(lessonId)

  const handleSaveContent = async (content) => {
    try {
      const response = await updateLesson(lessonId, { ...lesson, content })
      setLesson(response.data)
      setError(null)
      return true
    } catch {
      setError(t('lessonPage.saveError'))
      return false
    }
  }

  const handleMarkComplete = async () => {
    setCompleteError(null)
    const ok = await markLessonComplete(Number(lessonId))
    if (!ok) {
      setCompleteError(t('lessonPage.markCompleteError'))
    }
  }

  if (loading) {
    return (
      <div className="page page-wide lesson-page lesson-page-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (!lesson || !course) {
    return (
      <div className="page page-wide">
        <div className="learning-flash learning-flash--error">{t('coursePage.loadLessonsError')}</div>
      </div>
    )
  }

  const currentIndex = lessons.findIndex((l) => l.id === parseInt(lessonId, 10))
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const canEdit = canUpload(auth)
  const courseTitle = pickLocalized(course, 'title') || course.title || ''
  const lessonTitle = pickLocalized(lesson, 'title') || lesson.title || ''
  const isMarking = markingLessonId === Number(lessonId)

  return (
    <div className="page page-wide lesson-page">
      <div className="lesson-grid">
        <div className="col gap16" style={{ minWidth: 0 }}>
          <PageHeader
            title={lessonTitle}
            subtitle={pickLocalized(lesson, 'description')}
            breadcrumb={[
              { label: t('coursesPage.title'), to: '/courses' },
              { label: courseTitle, to: `/courses/${courseId}` },
              { label: t('lessonPage.lessonOf', { current: currentIndex + 1, total: lessons.length }) },
            ]}
            actions={(
              <div className="row gap8 wrap">
                <span className="badge badge-red">
                  {t('lessonPage.lessonOf', { current: currentIndex + 1, total: lessons.length })}
                </span>
                {lessonProgressItem.completed && (
                  <span className="badge badge-published row gap4">
                    <Icon name="check" size={12} />
                    {t('lessonPage.completed')}
                  </span>
                )}
              </div>
            )}
          />

          {lessonProgressItem.completed && (
            <div style={{ marginTop: -4 }}>
              <div className="row between" style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 600 }}>
                <span className="muted">{t('coursePage.progress')}</span>
                <span style={{ color: 'var(--brand)', fontWeight: 800 }}>
                  {Math.round(lessonProgressItem.progress)}%
                </span>
              </div>
              <div className="progress">
                <i style={{ width: `${lessonProgressItem.progress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="learning-flash learning-flash--error" role="alert">
              {error}
            </div>
          )}

          <LessonVideos
            videos={videos}
            canEdit={canEdit}
            courseId={courseId}
            lessonId={lessonId}
            onVideosChanged={refreshVideos}
            onError={setError}
          />

          <LessonNotes lesson={lesson} canEdit={canEdit} onSave={handleSaveContent} />

          <LessonFiles
            files={files}
            canEdit={canEdit}
            lessonId={lessonId}
            onFilesChanged={refreshFiles}
            onError={setError}
          />

          {!canEdit && (
            <div className="lesson-complete-section">
              {completeError && (
                <div className="learning-flash learning-flash--error" role="alert">
                  {completeError}
                </div>
              )}
              {lessonProgressItem.completed ? (
                <div className="lesson-complete-done" role="status">
                  <Icon name="checkCircle" size={20} />
                  <span>{t('lessonPage.markedComplete')}</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={handleMarkComplete}
                  disabled={isMarking}
                >
                  {isMarking ? (
                    <>
                      <Spinner size={16} color="#fff" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Icon name="checkCircle" size={18} />
                      {t('lessonPage.markComplete')}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="row between gap10 lesson-page-nav">
            {prevLesson ? (
              <Link
                to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="btn btn-outline"
              >
                <Icon name="chevLeft" size={16} />
                {t('lessonPage.previous')}
              </Link>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <Link
                to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="btn btn-primary"
              >
                {t('lessonPage.next')}
                <Icon name="chevRight" size={16} />
              </Link>
            ) : (
              <Link to={`/courses/${courseId}`} className="btn btn-primary">
                {t('testPage.returnToCourse')}
                <Icon name="award" size={16} />
              </Link>
            )}
          </div>
        </div>

        <LessonSidebar
          courseId={courseId}
          lessonId={lessonId}
          lessons={lessons}
          lessonProgress={lessonProgress}
        />
      </div>

      <LessonChat
        lessonId={lessonId}
        courseId={courseId}
        lessonTitle={lessonTitle}
        courseTitle={courseTitle}
        lessonContent={pickLocalized(lesson, 'content') || ''}
      />
    </div>
  )
}

export default LessonDetail
