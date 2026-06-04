import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Navigation from '../components/Navigation'
import Dashboard from '../components/dashboard/Dashboard'
import Courses from '../components/Courses'
import CourseDetail from '../components/CourseDetail'
import CourseEdit from '../components/CourseEdit'
import CourseTestResults from '../components/CourseTestResults'
import CourseParticipants from '../components/CourseParticipants'
import LessonDetail from '../components/LessonDetail'
import TestDetail from '../components/TestDetail'
import VideoPlayer from '../components/VideoPlayer'
import Files from '../components/Files'
import Notifications from '../components/Notifications'
import AdminNews from '../components/AdminNews'
import NewsDetail from '../components/NewsDetail'
import Profile from '../components/Profile'
import RAG from '../components/RAG'
import TeacherGradesLayout from '../components/teacher-grades/TeacherGradesLayout'
import TeacherGradesCourses from '../components/teacher-grades/TeacherGradesCourses'
import TeacherGradesLessons from '../components/teacher-grades/TeacherGradesLessons'
import TeacherGradesTable from '../components/teacher-grades/TeacherGradesTable'
import StudentGradesLayout from '../components/student-grades/StudentGradesLayout'
import StudentGradesCourses from '../components/student-grades/StudentGradesCourses'
import StudentGradesCourseDetail from '../components/student-grades/StudentGradesCourseDetail'

const AppLayout = ({ userRoles, isDarkMode, setIsDarkMode }) => {
    return (
        <div className="app-container">
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
                    <Route path="/courses/:courseId/participants" element={<CourseParticipants />} />
                    <Route path="/courses/:courseId/test-results" element={<CourseTestResults />} />
                    <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
                    <Route path="/courses/:courseId/tests/:testId" element={<TestDetail />} />
                    <Route path="/courses/:courseId/lessons/:lessonId/videos/:videoId" element={<VideoPlayer />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/rag" element={<RAG />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                    <Route path="/admin/news" element={<AdminNews />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/teacher/grades" element={<TeacherGradesLayout />}>
                        <Route index element={<TeacherGradesCourses />} />
                        <Route path=":courseId" element={<TeacherGradesLessons />} />
                        <Route path=":courseId/lessons/:lessonId" element={<TeacherGradesTable />} />
                    </Route>
                    <Route path="/my/grades" element={<StudentGradesLayout />}>
                        <Route index element={<StudentGradesCourses />} />
                        <Route path=":courseId" element={<StudentGradesCourseDetail />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </div>
    )
}

export default AppLayout