import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload, isTeacher, isAdmin, canEditCourseContent } from '@/shared/lib/roles'
import { getCourseParticipants } from '@/shared/api/coursesApi'
import { getCourseTestResults } from '@/shared/api/testsApi'
import { pickLocalized } from '@/i18n/localize'
import { Icon, SectionCard, Spinner } from '@/shared/ui/academis'
import { useCourseDetail } from './hooks/useCourseDetail'
import { useCourseHighlight } from './hooks/useCourseHighlight'
import CourseHeader from './components/CourseHeader'
import LessonsSection from './components/LessonsSection'
import TestsSection from './components/TestsSection'
import UserAvatar from '@/shared/ui/UserAvatar'
import { avatarInitials, formatAboutDate, participantDisplayName, participantProgressPercent } from './lib/courseDetailUi'
import './CourseDetail.css'

const CourseDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const {
    course,
    lessons,
    tests,
    loading,
    error,
    previewMode,
    courseViews,
    lessonProgress,
    enrolling,
    statusChanging,
    getCourseProgress,
    handleEnrollFromPreview,
    handleStatusChange,
  } = useCourseDetail(id)

  const [participants, setParticipants] = useState(null)
  const [testResultsPreview, setTestResultsPreview] = useState([])

  const { highlightedLessonId, highlightedTestId, lessonRefs, testRefs } = useCourseHighlight({
    selectedLessonId: searchParams.get('lessonId'),
    selectedTestId: searchParams.get('testId'),
    lessons,
    tests,
  })

  const canManageCourse = isTeacher(auth) || isAdmin(auth)
  const canEditTests = canEditCourseContent(auth, course)
  const mySub = auth.tokenParsed?.sub ? String(auth.tokenParsed.sub) : ''

  useEffect(() => {
    if (!id || previewMode) {
      setParticipants(null)
      return undefined
    }
    let cancelled = false
    getCourseParticipants(id)
      .then((response) => {
        if (!cancelled) setParticipants(response.data)
      })
      .catch(() => {
        if (!cancelled) setParticipants(null)
      })
    return () => {
      cancelled = true
    }
  }, [id, previewMode])

  useEffect(() => {
    if (!id || !canManageCourse || tests.length === 0) {
      setTestResultsPreview([])
      return undefined
    }
    let cancelled = false
    getCourseTestResults(id)
      .then((response) => {
        if (!cancelled) setTestResultsPreview((response.data || []).slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setTestResultsPreview([])
      })
    return () => {
      cancelled = true
    }
  }, [id, canManageCourse, tests.length])

  const completedLessonsCount = useMemo(
    () => Object.values(lessonProgress).filter((progress) => progress.completed).length,
    [lessonProgress],
  )

  if (loading) {
    return (
      <div className="page page-wide course-detail-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="page page-wide">
        <div className="courses-flash courses-flash--error">{t('coursePage.loadCourseError')}</div>
      </div>
    )
  }

  const courseProgress = getCourseProgress()
  const enrolledCount = participants?.studentCount
    ?? (Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0)
  const instructorLabel = participantDisplayName(participants?.instructor) || null
  const instructorAvatarUrl = participants?.instructor?.avatarUrl || null
  const showParticipants = !previewMode

  return (
    <div className="page page-wide course-detail">
      <CourseHeader
        course={course}
        courseId={id}
        canManageCourse={canManageCourse}
        statusChanging={statusChanging}
        onStatusChange={handleStatusChange}
        previewMode={previewMode}
        lessonsCount={lessons.length}
        courseProgress={courseProgress}
        courseViews={courseViews}
        lessons={lessons}
        completedLessonsCount={completedLessonsCount}
        enrolling={enrolling}
        onEnroll={handleEnrollFromPreview}
        instructorLabel={instructorLabel}
        instructorAvatarUrl={instructorAvatarUrl}
      />

      {error && (
        <div className="courses-flash courses-flash--error" role="alert">
          {error}
        </div>
      )}

      {previewMode && (
        <div className="preview-banner" role="status">
          <Icon name="eye" size={18} />
          <span>{t('coursePage.previewBanner')}</span>
          {!canUpload(auth) && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={handleEnrollFromPreview}
              disabled={enrolling}
            >
              {enrolling ? t('common.loading') : t('coursesPage.enrollCourse')}
            </button>
          )}
        </div>
      )}

      <div className="grid-2-1" style={{ marginTop: 18 }}>
        <div className="col gap16">
          <LessonsSection
            courseId={id}
            previewMode={previewMode}
            lessons={lessons}
            lessonProgress={lessonProgress}
            highlightedLessonId={highlightedLessonId}
            lessonRefs={lessonRefs}
          />

          <TestsSection
            courseId={id}
            previewMode={previewMode}
            canEditTests={canEditTests}
            tests={tests}
            highlightedTestId={highlightedTestId}
            testRefs={testRefs}
          />
        </div>

        <div className="col gap16">
          {showParticipants && (
            <SectionCard
              title={t('coursePage.participants')}
              icon="users"
              action={
                canManageCourse ? (
                  <Link to={`/courses/${id}/participants`} className="btn btn-sm btn-outline">
                    {t('coursePage.allParticipants')}
                  </Link>
                ) : (
                  <span className="badge badge-red">{enrolledCount}</span>
                )
              }
            >
              {enrolledCount === 0 ? (
                <div className="muted" style={{ padding: 10, fontSize: 13 }}>
                  {t('coursePage.noEnrollmentYet')}
                </div>
              ) : (
                <div className="col gap10">
                  {(participants?.students || []).slice(0, 5).map((student) => {
                    const name = participantDisplayName(student) || t('coursePage.participantsUnknownName')
                    const progress = participantProgressPercent(student)
                    return (
                      <div key={student.userId} className="row gap10" style={{ alignItems: 'center' }}>
                        <UserAvatar
                          avatarUrl={student.avatarUrl}
                          initials={avatarInitials(name)}
                          small
                        />
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{name}</span>
                        {progress != null && (
                          <span className="mono dim" style={{ fontSize: 12, fontWeight: 700 }}>
                            {progress}%
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {canManageCourse && enrolledCount > 0 && (
                    <Link
                      to={`/courses/${id}/participants`}
                      className="btn btn-sm btn-ghost btn-block"
                      style={{ marginTop: 4 }}
                    >
                      {t('coursePage.openParticipantsList')}
                    </Link>
                  )}
                </div>
              )}
            </SectionCard>
          )}

          {canManageCourse && tests.length > 0 && (
            <SectionCard
              title={t('coursePage.testResultsTitle')}
              icon="target"
              action={(
                <Link to={`/courses/${id}/test-results`} className="btn btn-sm btn-outline">
                  {t('coursePage.allTestResults')}
                </Link>
              )}
            >
              <div className="muted" style={{ fontSize: 13, padding: '4px 0 8px' }}>
                {t('coursePage.testResultsLead')}
              </div>
              <div className="col gap8">
                {testResultsPreview.length === 0 ? (
                  <div className="muted" style={{ fontSize: 13 }}>
                    {t('courseEdit.testResultsEmpty')}
                  </div>
                ) : (
                  testResultsPreview.map((result) => {
                    const title = pickLocalized(
                      {
                        title: result.testTitle,
                        titleKz: result.testTitleKz,
                        titleEn: result.testTitleEn,
                      },
                      'title',
                    )
                    const percent = result.maxScore > 0
                      ? Math.round((result.score / result.maxScore) * 100)
                      : 0
                    const studentLabel = result.studentName || result.studentDisplayLabel || result.studentId
                    return (
                      <div
                        key={result.attemptId}
                        className="row between"
                        style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                      >
                        <div>
                          <div style={{ fontWeight: 650, fontSize: 13.5 }}>{studentLabel}</div>
                          <div className="dim" style={{ fontSize: 12 }}>{title}</div>
                        </div>
                        <span className={`badge ${percent >= 60 ? 'badge-published' : 'badge-draft'}`}>
                          {percent}%
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </SectionCard>
          )}

          <SectionCard title={t('coursePage.aboutCourse')} icon="info">
            <div className="col gap10" style={{ fontSize: 13.5 }}>
              {[
                ['layers', t('coursePage.aboutLevel'), course.level],
                ['globe', t('coursePage.aboutLanguage'), course.language],
                ['clock', t('coursePage.aboutUpdated'), formatAboutDate(course.updatedAt)],
                ['book', t('coursePage.aboutLessonsCount'), lessons.length],
              ]
                .filter(([, , value]) => value != null && value !== '')
                .map(([iconName, label, value]) => (
                  <div key={label} className="row between">
                    <span className="row gap8 muted">
                      <Icon name={iconName} size={15} />
                      {label}
                    </span>
                    <span style={{ fontWeight: 650 }}>{value}</span>
                  </div>
                ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
