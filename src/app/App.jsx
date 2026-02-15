import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import auth from '../config/auth'
import { getRoles } from '../utils/roles'
import AppRoutes from './routes'

const App = () => {
    const [authenticated, setAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userRoles, setUserRoles] = useState([])

    useEffect(() => {
        let mounted = true

        const init = async () => {
            const isAuth = await auth.initSafe()
            if (!mounted) return

            setAuthenticated(isAuth)
            setLoading(false)

            if (isAuth) {
                setUserRoles(getRoles(auth))
            }
        }

        init()
        return () => (mounted = false)
    }, [])

    if (loading) {
        return <div className="loading">Loading...</div>
    }

    return (
        <Router>
            <AppRoutes authenticated={authenticated} userRoles={userRoles} />
        </Router>
    )
}

export default App