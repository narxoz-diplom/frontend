import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { isTeacher, isAdmin } from '@/shared/lib/roles'
import { PageHeader } from '@/shared/ui/academis'
import GradesAccessDenied from '@/pages/grades/GradesAccessDenied'
import '@/pages/grades/Grades.css'
import '../secondary-academis.css'

export default function StudentGradesLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const isIndex = location.pathname === '/my/grades' || location.pathname === '/my/grades/'

  if (isTeacher(auth) || isAdmin(auth)) {
    return (
      <GradesAccessDenied
        body={t('studentGrades.accessDeniedBody')}
        backLabel={t('studentGrades.backHome')}
      />
    )
  }

  return (
    <div className="page page-wide grades-page">
      {isIndex && (
        <PageHeader title={t('nav.myGrades')} subtitle={t('studentGrades.subtitle')} />
      )}
      <Outlet />
    </div>
  )
}
