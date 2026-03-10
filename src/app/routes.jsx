import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute'
import AppLayout from './AppLayout'
import Login from '../auth/Login'
import Register from '../auth/Register'

const AppRoutes = ({ authenticated, userRoles, isDarkMode, setIsDarkMode }) => {
    if (!authenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        )
    }

    return (
        <Routes>
            <Route
                path="*"
                element={
                    <ProtectedRoute authenticated={authenticated}>
                        {/* ТЕПЕРЬ ПЕРЕДАЕМ ТЕМУ В LAYOUT */}
                        <AppLayout
                            userRoles={userRoles}
                            isDarkMode={isDarkMode}
                            setIsDarkMode={setIsDarkMode}
                        />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}

export default AppRoutes