import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { isTeacher } from '@/shared/lib/roles'
import { PageHeader, Icon } from '@/shared/ui/academis'
import '@/pages/courses/Courses.css'
import './TeacherGrades.css'
import '../secondary-academis.css'

export default function TeacherGradesLayout() {
  const { t } = useTranslation()

  if (!isTeacher(auth)) {
    return (
      <div className="page page-wide teacher-grades teacher-grades--center">
        <div className="card card-pad tg-access-card" role="alert" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="tg-access-icon" aria-hidden style={{ margin: '0 auto 12px' }}>
            <Icon name="lock" size={28} />
          </div>
          <h2 className="h2">{t('teacherGrades.accessDeniedTitle')}</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            {t('teacherGrades.accessDeniedBody')}
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            {t('teacherGrades.backHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-wide teacher-grades">
      <PageHeader title={t('nav.gradeJournal')} subtitle={t('teacherGrades.openJournal')} />
      <Outlet />
    </div>
  )
}
