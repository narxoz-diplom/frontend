import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/app/ProtectedRoute'
import AppLayout from './AppLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

const AppRoutes = ({ authenticated, userRoles }) => {
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
                        <AppLayout userRoles={userRoles} />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}

export default AppRoutes
