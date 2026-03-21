import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Navigation from '../components/Navigation'
import Dashboard from '../components/dashboard/Dashboard'
import Courses from '../components/Courses'
import CourseDetail from '../components/CourseDetail'
import CourseEdit from '../components/CourseEdit'
import LessonDetail from '../components/LessonDetail'
import TestDetail from '../components/TestDetail'
import VideoPlayer from '../components/VideoPlayer'
import Files from '../components/Files'
import Notifications from '../components/Notifications'
import Profile from '../components/Profile'
import RAG from '../components/RAG'

// Добавляем пропсы для управления темой
const AppLayout = ({ userRoles, isDarkMode, setIsDarkMode }) => {
    return (
        <div className="app-container">
            {/* Передаем состояние темы в Navigation для кнопки переключения */}
            <Navigation
                userRoles={userRoles}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
            />

            <div className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/stats" element={<Dashboard />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:id" element={<CourseDetail />} />
                    <Route path="/courses/:id/edit" element={<CourseEdit />} />
                    <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
                    <Route path="/courses/:courseId/tests/:testId" element={<TestDetail />} />
                    <Route path="/courses/:courseId/lessons/:lessonId/videos/:videoId" element={<VideoPlayer />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/rag" element={<RAG />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </div>
    )
}

export default AppLayout