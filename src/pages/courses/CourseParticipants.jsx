import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { pickLocalized } from '@/i18n/localize'
import { canUpload } from '@/shared/lib/roles'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { getCourse, getCourseParticipants } from '@/shared/api/coursesApi'
import { useTranslation } from 'react-i18next'
import { PageHeader, Spinner, Icon, EmptyState } from '@/shared/ui/academis'
import { useAllowedEmails } from './hooks/useAllowedEmails'
import AllowedEmailsModal from './components/AllowedEmailsModal'
import UserAvatar from '@/shared/ui/UserAvatar'
import {
  avatarInitials,
  participantDisplayName,
  participantDisplayEmail,
  formatParticipantEnrolledDate,
  participantProgressPercent,
  averageParticipantProgress,
} from './lib/courseDetailUi'
import './CourseParticipants.css'

const ParticipantProgressCell = ({ progress }) => {
  if (progress == null) {
    return <span className="muted">—</span>
  }

  const pct = Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <div className="participants-progress-cell">
      <div className="progress participants-progress-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <span className="mono participants-progress-value">{pct}%</span>
    </div>
  )
}

const CourseParticipants = () => {
  const { t } = useTranslation()
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [participants, setParticipants] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const canManageEmails = canUpload(auth)

  const emails = useAllowedEmails({
    courseId,
    course,
    setCourse,
  })

  const mySub = auth.tokenParsed?.sub ? String(auth.tokenParsed.sub) : ''

  useEffect(() => {
    if (!courseId) return
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const courseRes = await getCourse(courseId)
        setCourse(normalizeCourseViewerResponse(courseRes.data).course)
        try {
          const pr = await getCourseParticipants(courseId)
          setParticipants(pr.data)
        } catch (pe) {
          if (pe?.response?.status === 403) {
            setError('forbidden')
            setParticipants(null)
          } else {
            setError('load')
            setParticipants(null)
          }
        }
      } catch {
        setError('course')
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  const students = participants?.students ?? []
  const avgProgress = useMemo(() => averageParticipantProgress(students), [students])

  if (loading) {
    return (
      <div className="page page-wide course-participants-loading">
        <Spinner size={28} />
        <span className="muted">{t('common.loading')}</span>
      </div>
    )
  }

  if (error === 'course' || !course) {
    return (
      <div className="page page-wide">
        <div className="courses-flash courses-flash--error">{t('coursePage.loadCourseError')}</div>
        <Link to="/courses" className="btn btn-outline">
          {t('coursePage.backToCatalog')}
        </Link>
      </div>
    )
  }

  if (error === 'forbidden') {
    return (
      <div className="page page-wide course-participants-page">
        <EmptyState
          icon="lock"
          title={t('coursePage.participantsForbiddenTitle')}
          desc={t('coursePage.participantsForbiddenDesc')}
          action={(
            <Link to={`/courses/${courseId}`} className="btn btn-primary">
              {t('studio.backToCourse')}
            </Link>
          )}
        />
      </div>
    )
  }

  if (error === 'load') {
    return (
      <div className="page page-wide">
        <div className="courses-flash courses-flash--error">{t('coursePage.participantsLoadError')}</div>
        <Link to={`/courses/${courseId}`} className="btn btn-outline">
          {t('studio.backToCourse')}
        </Link>
      </div>
    )
  }

  const courseTitle = pickLocalized(course, 'title') || course.title || ''
  const allowedEmailsCount = course?.allowedEmails?.length ?? 0
  const instructor = participants?.instructor
  const instructorName = participantDisplayName(instructor) || t('coursePage.participantsUnknownName')
  const instructorEmail = participantDisplayEmail(instructor) || t('coursePage.participantsUnknownEmail')

  return (
    <div className="page page-wide course-participants-page">
      <PageHeader
        title={t('coursePage.participants')}
        subtitle={t('coursePage.participantsPageSubtitle', {
          count: participants?.studentCount ?? students.length,
          avg: avgProgress,
        })}
        back={`/courses/${courseId}`}
        breadcrumb={[
          { label: courseTitle, to: `/courses/${courseId}` },
          { label: t('coursePage.participants') },
        ]}
        actions={
          canManageEmails ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={emails.openEmailsModal}
            >
              <Icon name="mail" size={16} />
              {t('studio.emailAccess')}
              {allowedEmailsCount > 0 && (
                <span className="badge badge-red" style={{ marginLeft: 6 }}>
                  {allowedEmailsCount}
                </span>
              )}
            </button>
          ) : null
        }
      />

      {emails.showEmailsModal && (
        <AllowedEmailsModal
          allowedEmails={emails.allowedEmails}
          newEmailsText={emails.newEmailsText}
          onNewEmailsTextChange={emails.setNewEmailsText}
          error={emails.emailModalError}
          saving={emails.savingEmails}
          onAdd={emails.handleAddEmails}
          onRemove={emails.handleRemoveEmail}
          onSave={emails.handleSaveAllowedEmails}
          onClose={emails.closeEmailsModal}
        />
      )}

      {instructor && (
        <div className="card card-pad course-participants-teacher">
          <div className="eyebrow">{t('coursePage.participantsTeacherEyebrow')}</div>
          <div className="row gap12" style={{ alignItems: 'center' }}>
            <UserAvatar
              avatarUrl={instructor.avatarUrl}
              initials={avatarInitials(instructorName)}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{instructorName}</div>
              <div className="muted" style={{ fontSize: 13 }}>{instructorEmail}</div>
            </div>
            {mySub && instructor.userId === mySub && (
              <span className="badge badge-published">{t('coursePage.participantsYou')}</span>
            )}
          </div>
        </div>
      )}

      <div className="card course-participants-table-card">
        {students.length === 0 ? (
          <EmptyState
            icon="users"
            title={t('coursePage.participantsEmptyStudents')}
            desc={t('coursePage.participantsEmptyStudentsDesc')}
          />
        ) : (
          <div className="course-participants-page__table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">{t('coursePage.participantsColStudent')}</th>
                  <th scope="col">{t('coursePage.participantsColEmail')}</th>
                  <th scope="col">{t('coursePage.participantsColEnrolled')}</th>
                  <th scope="col">{t('coursePage.participantsColProgress')}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const name = participantDisplayName(student) || t('coursePage.participantsUnknownName')
                  const email = participantDisplayEmail(student) || t('coursePage.participantsUnknownEmail')
                  const enrolledLabel = formatParticipantEnrolledDate(student.enrolledAt) || '—'
                  const progress = participantProgressPercent(student)

                  return (
                    <tr key={student.userId}>
                      <td>
                        <div className="row gap10" style={{ alignItems: 'center' }}>
                          <UserAvatar
                            avatarUrl={student.avatarUrl}
                            initials={avatarInitials(name)}
                            small
                          />
                          <span style={{ fontWeight: 600 }}>{name}</span>
                          {mySub && student.userId === mySub && (
                            <span className="badge badge-published">{t('coursePage.participantsYou')}</span>
                          )}
                        </div>
                      </td>
                      <td className="muted">{email}</td>
                      <td className="muted">{enrolledLabel}</td>
                      <td>
                        <ParticipantProgressCell progress={progress} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseParticipants
