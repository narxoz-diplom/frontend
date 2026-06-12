import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { getRoles } from '@/shared/lib/roles'
import { AlertProvider } from '@/app/providers/AlertProvider'
import AppRoutes from './routes'

const App = () => {
    const [authenticated, setAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userRoles, setUserRoles] = useState([])

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
            <AlertProvider>
                <AppRoutes
                    authenticated={authenticated}
                    userRoles={userRoles}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                />
            </AlertProvider>
        </Router>
    )
}

export default App