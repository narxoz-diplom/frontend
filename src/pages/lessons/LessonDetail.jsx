import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { updateLesson } from '@/shared/api/lessonsApi'
import { pickLocalized } from '@/i18n/localize'
import { useLessonData } from './hooks/useLessonData'
import { useLessonProgress } from './hooks/useLessonProgress'
import LessonNotes from './components/LessonNotes'
import LessonVideos from './components/LessonVideos'
import LessonFiles from './components/LessonFiles'
import LessonSidebar from './components/LessonSidebar'
import './LessonDetail.css'

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
    refreshFiles
  } = useLessonData(courseId, lessonId)
  const lessonProgress = useLessonProgress(courseId, lessonId, videos)

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

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>
  }

  if (!lesson || !course) {
    return <div className="error">{t('coursePage.loadLessonsError')}</div>
  }

  const currentIndex = lessons.findIndex(l => l.id === parseInt(lessonId))
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const canEdit = canUpload(auth)

  return (
    <div className="lesson-detail lesson-detail--v2">
      <header className="lesson-page__intro">
        <Link to={`/courses/${courseId}`} className="back-link">
          <FiArrowLeft aria-hidden /> {t('lessonPage.backToCourse')}
        </Link>
        <p className="lesson-page__kicker">
          {t('lessonPage.lessonOf', { current: currentIndex + 1, total: lessons.length })}
          {pickLocalized(course, 'title') ? ` · ${pickLocalized(course, 'title')}` : ''}
        </p>
        <div className="lesson-page__title-row">
          <h1 className="lesson-page__title">{pickLocalized(lesson, 'title')}</h1>
          {lessonProgress.completed && (
            <span className="lesson-page__badge lesson-page__badge--done">
              <FiCheckCircle aria-hidden /> {t('lessonPage.completed')}
            </span>
          )}
        </div>
        {pickLocalized(lesson, 'description') && <p className="lesson-page__lead">{pickLocalized(lesson, 'description')}</p>}
        {videos.length > 0 && (
          <div className="lesson-page__progress" aria-label={t('coursePage.progress')}>
            <div className="lesson-page__progress-track">
              <div
                className="lesson-page__progress-fill"
                style={{ width: `${lessonProgress.progress}%` }}
              />
            </div>
            <span className="lesson-page__progress-label">{Math.round(lessonProgress.progress)}%</span>
          </div>
        )}
      </header>

      {error && <div className="lesson-page__error">{error}</div>}

      <div className="lesson-content-wrapper">
        <div className="lesson-main-content">
          <LessonNotes lesson={lesson} canEdit={canEdit} onSave={handleSaveContent} />
          <LessonVideos
            videos={videos}
            canEdit={canEdit}
            courseId={courseId}
            lessonId={lessonId}
            onVideosChanged={refreshVideos}
            onError={setError}
          />
          <LessonFiles
            files={files}
            canEdit={canEdit}
            lessonId={lessonId}
            onFilesChanged={refreshFiles}
            onError={setError}
          />
        </div>

        <LessonSidebar
          course={course}
          courseId={courseId}
          lesson={lesson}
          lessonId={lessonId}
          lessons={lessons}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
        />
      </div>
    </div>
  )
}

export default LessonDetail
