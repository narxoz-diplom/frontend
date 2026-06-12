import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import StudentDashboard from './StudentDashboard'
import TeacherDashboard from './TeacherDashboard'
import AdminDashboard from './AdminDashboard'
import auth from '@/shared/config/auth'
import { isAdmin, isTeacher } from '@/shared/lib/roles'

const Dashboard = () => {
    const { t } = useTranslation()
    const location = useLocation()
    const view = location.pathname === '/stats' ? 'stats' : 'home'

    const [userRole, setUserRole] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (isAdmin(auth)) {
            setUserRole('admin')
        } else if (isTeacher(auth)) {
            setUserRole('teacher')
        } else {
            const savedUser = JSON.parse(localStorage.getItem('user') || 'null')
            if (savedUser?.role === 'teacher') setUserRole('teacher')
            else setUserRole('student')
        }
        setIsLoading(false)
    }, [])

    if (isLoading) {
        return <div className="dashboard-loading">{t('dashboard.loading')}</div>
    }

    if (userRole === 'admin') {
        return <AdminDashboard view={view} />
    }
    if (userRole === 'teacher') {
        return <TeacherDashboard view={view} />
    }
    return <StudentDashboard view={view} />
}

export default Dashboard
