import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiLock } from 'react-icons/fi'
import auth from '../../config/auth'
import { isTeacher } from '../../utils/roles'
import '../Courses.css'
import './TeacherGrades.css'

export default function TeacherGradesLayout() {
    const { t } = useTranslation()
    const kc = typeof window !== 'undefined' ? window.keycloak || auth : auth

    if (!isTeacher(kc)) {
        return (
            <div className="teacher-grades teacher-grades--center">
                <div className="tg-access-card" role="alert">
                    <div className="tg-access-icon" aria-hidden>
                        <FiLock />
                    </div>
                    <h2 className="tg-access-title">{t('teacherGrades.accessDeniedTitle')}</h2>
                    <p className="tg-access-text">{t('teacherGrades.accessDeniedBody')}</p>
                    <Link to="/" className="btn btn-primary">
                        {t('teacherGrades.backHome')}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="teacher-grades">
            <div className="courses-page">
                <header className="courses-header">
                    <h1>{t('nav.gradeJournal')}</h1>
                </header>
                <Outlet />
            </div>
        </div>
    )
}
