import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import auth from '../config/auth'
import { getRoles } from '../utils/roles'
import AppRoutes from './routes'

const App = () => {
    const [authenticated, setAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userRoles, setUserRoles] = useState([])

    // Состояние темной темы
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    })

    useEffect(() => {
        let mounted = true
        const init = async () => {
            const isAuth = await auth.initSafe()
            if (!mounted) return
            setAuthenticated(isAuth)
            setLoading(false)
            if (isAuth) setUserRoles(getRoles(auth))
        }
        init()
        return () => (mounted = false)
    }, [])

    // Управление классом на body
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    if (loading) return <div className="loading">Loading...</div>

    return (
        <Router>
            {/* Передаем тему в роуты */}
            <AppRoutes
                authenticated={authenticated}
                userRoles={userRoles}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
            />
        </Router>
    )
}

export default App