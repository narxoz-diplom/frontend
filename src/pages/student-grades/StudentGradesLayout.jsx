import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiLock } from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { isTeacher, isAdmin } from '@/shared/lib/roles'
import '@/pages/courses/Courses.css'

export default function StudentGradesLayout() {
    const { t } = useTranslation()

    if (isTeacher(auth) || isAdmin(auth)) {
        return (
            <div className="courses-page">
                <div className="courses-grid">
                    <p className="courses-empty" role="alert">
                        <FiLock aria-hidden style={{ display: 'block', margin: '0 auto 12px', fontSize: '2rem' }} />
                        {t('studentGrades.accessDeniedBody')}
                    </p>
                </div>
                <Link to="/" className="course-card__btn course-card__btn--outline" style={{ marginTop: 16 }}>
                    {t('studentGrades.backHome')}
                </Link>
            </div>
        )
    }

    return (
        <div className="courses-page">
            <header className="courses-header">
                <h1>{t('nav.myGrades')}</h1>
            </header>
            <Outlet />
        </div>
    )
}
