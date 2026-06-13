import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiLock } from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { isTeacher, isAdmin } from '@/shared/lib/roles'
import { PageHeader } from '@/shared/ui/academis'
import '@/pages/courses/Courses.css'
import '../secondary-academis.css'

export default function StudentGradesLayout() {
  const { t } = useTranslation()

  if (isTeacher(auth) || isAdmin(auth)) {
    return (
      <div className="page page-wide">
        <div className="card card-pad" style={{ textAlign: 'center', maxWidth: 420, margin: '40px auto' }}>
          <FiLock aria-hidden style={{ fontSize: '2rem', marginBottom: 12, color: 'var(--brand)' }} />
          <p className="muted" role="alert">{t('studentGrades.accessDeniedBody')}</p>
          <Link to="/" className="btn btn-outline" style={{ marginTop: 16 }}>
            {t('studentGrades.backHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      <PageHeader title={t('nav.myGrades')} subtitle={t('studentGrades.subtitle')} />
      <Outlet />
    </div>
  )
}
