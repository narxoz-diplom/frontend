import React from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload, isTeacher, isAdmin } from '@/shared/lib/roles'
import { useCourseDetail } from './hooks/useCourseDetail'
import { useCourseHighlight } from './hooks/useCourseHighlight'
import CourseHeader from './components/CourseHeader'
import LessonsSection from './components/LessonsSection'
import TestsSection from './components/TestsSection'
import './CourseDetail.css'

const CourseDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const {
    course,
    lessons,
    tests,
    lessonFiles,
    loading,
    error,
    previewMode,
    participantsAccess,
    courseViews,
    lessonProgress,
    enrolling,
    statusChanging,
    showLessonForm,
    newLesson,
    setNewLesson,
    uploadingFile,
    statusLabelFor,
    getCourseProgress,
    handleEnrollFromPreview,
    handleStatusChange,
    openLessonForm,
    closeLessonForm,
    handleCreateLesson,
    handleFileUpload,
    handleFileDownload,
    handleDeleteFile
  } = useCourseDetail(id)

  const { highlightedLessonId, highlightedTestId, lessonRefs, testRefs } = useCourseHighlight({
    selectedLessonId: searchParams.get('lessonId'),
    selectedTestId: searchParams.get('testId'),
    lessons,
    tests
  })

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>
  }

  if (!course) {
    return <div className="error">{t('coursePage.loadCourseError')}</div>
  }

  const courseProgress = getCourseProgress()
  const statusLabel = statusLabelFor(course.status)
  const canManageCourse = isTeacher(auth) || isAdmin(auth)

  return (
    <div className="course-detail course-detail--v2">
      <CourseHeader
        course={course}
        statusLabel={statusLabel}
        canManageCourse={canManageCourse}
        statusChanging={statusChanging}
        onStatusChange={handleStatusChange}
        previewMode={previewMode}
        lessonsCount={lessons.length}
        testsCount={tests.length}
        courseProgress={courseProgress}
        courseViews={courseViews}
      />

      {error && <div className="course-page__error">{error}</div>}

      {previewMode && (
        <div className="course-page__preview-banner" role="status">
          <p>{t('coursePage.previewHint')}</p>
          {!canUpload(auth) && (
            <button
              type="button"
              className="btn btn-primary course-page__preview-enroll"
              onClick={handleEnrollFromPreview}
              disabled={enrolling}
            >
              {enrolling ? t('common.loading') : t('coursePage.previewEnroll')}
            </button>
          )}
        </div>
      )}

      <div className="course-content-section">
        {participantsAccess && !previewMode && (
          <section className="course-participants-teaser course-panel" aria-labelledby="course-participants-teaser-title">
            <div className="course-participants-teaser__row">
              <div>
                <h2 id="course-participants-teaser-title" className="course-participants-teaser__title">
                  {t('coursePage.participantsTitle')}
                </h2>
                <p className="course-participants-teaser__lead">{t('coursePage.participantsTeaserLead')}</p>
              </div>
              <Link to={`/courses/${id}/participants`} className="course-participants-teaser__cta">
                {t('coursePage.participantsOpenPage')}
              </Link>
            </div>
          </section>
        )}

        <LessonsSection
          courseId={id}
          previewMode={previewMode}
          lessons={lessons}
          lessonFiles={lessonFiles}
          lessonProgress={lessonProgress}
          uploadingFile={uploadingFile}
          highlightedLessonId={highlightedLessonId}
          lessonRefs={lessonRefs}
          showLessonForm={showLessonForm}
          newLesson={newLesson}
          onNewLessonChange={setNewLesson}
          onOpenLessonForm={openLessonForm}
          onCloseLessonForm={closeLessonForm}
          onCreateLesson={handleCreateLesson}
          onUploadFile={handleFileUpload}
          onDownloadFile={handleFileDownload}
          onDeleteFile={handleDeleteFile}
        />

        <TestsSection
          courseId={id}
          previewMode={previewMode}
          tests={tests}
          highlightedTestId={highlightedTestId}
          testRefs={testRefs}
        />
      </div>
    </div>
  )
}

export default CourseDetail
