import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Navigation from '@/widgets/navigation/Navigation'
import Dashboard from '@/pages/dashboard/Dashboard'
import Courses from '@/pages/courses/Courses'
import CourseDetail from '@/pages/courses/CourseDetail'
import CourseEdit from '@/pages/courses/CourseEdit'
import CourseTestResults from '@/pages/courses/CourseTestResults'
import CourseParticipants from '@/pages/courses/CourseParticipants'
import LessonDetail from '@/pages/lessons/LessonDetail'
import TestDetail from '@/pages/lessons/TestDetail'
import VideoPlayer from '@/pages/lessons/VideoPlayer'
import Files from '@/pages/files/Files'
import Notifications from '@/pages/notifications/Notifications'
import AdminNews from '@/pages/news/AdminNews'
import NewsDetail from '@/pages/news/NewsDetail'
import Profile from '@/pages/profile/Profile'
import RAG from '@/pages/rag/RAG'
import TeacherGradesLayout from '@/pages/teacher-grades/TeacherGradesLayout'
import TeacherGradesCourses from '@/pages/teacher-grades/TeacherGradesCourses'
import TeacherGradesLessons from '@/pages/teacher-grades/TeacherGradesLessons'
import TeacherGradesTable from '@/pages/teacher-grades/TeacherGradesTable'
import StudentGradesLayout from '@/pages/student-grades/StudentGradesLayout'
import StudentGradesCourses from '@/pages/student-grades/StudentGradesCourses'
import StudentGradesCourseDetail from '@/pages/student-grades/StudentGradesCourseDetail'
import './AppLayout.css'

const AppLayout = ({ userRoles }) => {
  return (
    <Navigation userRoles={userRoles}>
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
    </Navigation>
  )
}

export default AppLayout
