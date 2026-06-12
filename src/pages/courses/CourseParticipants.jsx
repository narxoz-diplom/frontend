import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiLoader } from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { pickLocalized } from '@/i18n/localize'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { getCourse, getCourseParticipants } from '@/shared/api/coursesApi'
import { useTranslation } from 'react-i18next'
import './CourseParticipants.css'

const CourseParticipants = () => {
  const { t } = useTranslation()
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [participants, setParticipants] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) {
    return (
      <div className="course-participants-page course-participants-page--loading">
        <FiLoader className="course-participants-page__spinner" aria-hidden />
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (error === 'course' || !course) {
    return (
      <div className="course-participants-page course-participants-page--error">
        <p>{t('coursePage.loadCourseError')}</p>
        <Link to="/courses" className="course-participants-page__back-link">
          {t('coursePage.backToCatalog')}
        </Link>
      </div>
    )
  }

  if (error === 'forbidden') {
    return (
      <div className="course-participants-page course-participants-page--error">
        <p>{t('coursePage.participantsForbidden')}</p>
        <Link to={`/courses/${courseId}`} className="course-participants-page__back-link">
          {t('testPage.backToCourse')}
        </Link>
      </div>
    )
  }

  if (error === 'load') {
    return (
      <div className="course-participants-page course-participants-page--error">
        <p>{t('coursePage.participantsLoadError')}</p>
        <Link to={`/courses/${courseId}`} className="course-participants-page__back-link">
          {t('testPage.backToCourse')}
        </Link>
      </div>
    )
  }

  const courseTitle = pickLocalized(course, 'title') || course.title || ''

  return (
    <div className="course-participants-page course-detail--v2">
      <header className="course-participants-page__header">
        <div className="course-participants-page__nav">
          <Link to={`/courses/${courseId}`} className="course-participants-page__back">
            <FiArrowLeft aria-hidden />
            {t('testPage.backToCourse')}
          </Link>
        </div>
        <h1 className="course-participants-page__title">{t('coursePage.participantsTitle')}</h1>
        <p className="course-participants-page__course-name">{courseTitle}</p>
        <p className="course-participants-page__desc">{t('coursePage.participantsSubtitle')}</p>
      </header>

      {participants && (
        <div className="course-participants-page__registry">
          <div className="course-participants-page__sheet">
            <h2 className="course-participants-page__sheet-title">{t('coursePage.participantsInstructor')}</h2>
            <div className="course-participants-page__table-wrap">
              <table className="course-participants-page__table">
                <thead>
                  <tr>
                    <th scope="col">{t('coursePage.participantsId')}</th>
                    <th scope="col">{t('coursePage.participantsLabel')}</th>
                    <th scope="col" className="course-participants-page__th-note">
                      {t('coursePage.participantsNote')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="course-participants-page__cell-id">{participants.instructor?.userId ?? '—'}</td>
                    <td className="course-participants-page__cell-label">
                      {participants.instructor?.displayLabel ?? '—'}
                    </td>
                    <td className="course-participants-page__cell-note">
                      {mySub && participants.instructor?.userId === mySub ? (
                        <span className="course-participants-page__badge">{t('coursePage.participantsYou')}</span>
                      ) : (
                        <span className="course-participants-page__dash">—</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="course-participants-page__sheet">
            <h2 className="course-participants-page__sheet-title">
              {t('coursePage.participantsStudents')}
              <span className="course-participants-page__sheet-count">
                {t('coursePage.participantsCount', { count: participants.studentCount ?? 0 })}
              </span>
            </h2>
            {(participants.students?.length ?? 0) === 0 ? (
              <p className="course-participants-page__empty">{t('coursePage.participantsEmptyStudents')}</p>
            ) : (
              <div className="course-participants-page__table-wrap">
                <table className="course-participants-page__table">
                  <thead>
                    <tr>
                      <th scope="col">{t('coursePage.participantsId')}</th>
                      <th scope="col">{t('coursePage.participantsLabel')}</th>
                      <th scope="col" className="course-participants-page__th-note">
                        {t('coursePage.participantsNote')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.students.map((s) => (
                      <tr key={s.userId}>
                        <td className="course-participants-page__cell-id">{s.userId}</td>
                        <td className="course-participants-page__cell-label">{s.displayLabel ?? '—'}</td>
                        <td className="course-participants-page__cell-note">
                          {mySub && s.userId === mySub ? (
                            <span className="course-participants-page__badge">{t('coursePage.participantsYou')}</span>
                          ) : (
                            <span className="course-participants-page__dash">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseParticipants
