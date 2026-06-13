import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { isTeacher } from '@/shared/lib/roles'
import { PageHeader } from '@/shared/ui/academis'
import GradesAccessDenied from '@/pages/grades/GradesAccessDenied'
import '@/pages/grades/Grades.css'
import '../secondary-academis.css'

export default function TeacherGradesLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const isIndex =
    location.pathname === '/teacher/grades' || location.pathname === '/teacher/grades/'

  if (!isTeacher(auth)) {
    return (
      <GradesAccessDenied
        title={t('teacherGrades.accessDeniedTitle')}
        body={t('teacherGrades.accessDeniedBody')}
        backLabel={t('teacherGrades.backHome')}
      />
    )
  }

  return (
    <div className="page page-wide grades-page">
      {isIndex && (
        <PageHeader title={t('nav.gradeJournal')} subtitle={t('teacherGrades.openJournal')} />
      )}
      <Outlet />
    </div>
  )
}
