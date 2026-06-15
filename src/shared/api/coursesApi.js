import api from './client'

export const getCourses = () => api.get('/courses')
export const getPublishedCourses = () => api.get('/courses/published')
export const getEnrolledCourses = () => api.get('/courses/enrolled')
export const getCourse = (courseId) => api.get(`/courses/${courseId}`)
export const createCourse = (payload) => api.post('/courses', payload)
export const deleteCourse = (courseId) => api.delete(`/courses/${courseId}`)
export const updateCourseStatus = (courseId, status) =>
  api.patch(`/courses/${courseId}/status`, { status })

export const enrollInCourse = (courseId) => api.post(`/courses/${courseId}/enroll`)
export const getCourseParticipants = (courseId) => api.get(`/courses/${courseId}/participants`)
export const getCourseProgress = (courseId) => api.get(`/courses/${courseId}/progress`)
export const markLessonComplete = (lessonId) => api.post(`/courses/lessons/${lessonId}/complete`)
export const getCourseViews = (courseId) => api.get(`/courses/${courseId}/views`)
export const updateAllowedEmails = (courseId, emails) =>
  api.put(`/courses/${courseId}/allowed-emails`, emails)

export const getPlatformStats = () => api.get('/courses/admin/platform-stats')

export const startBackfill = (courseId, lang) => {
  const suffix = lang === 'kz' ? '/kz' : lang === 'en' ? '/en' : ''
  return api.post(`/courses/${courseId}/backfill-localizations${suffix}`)
}
export const getBackfillSummary = (courseId, lang) =>
  api.get(`/courses/${courseId}/backfill-localizations/summary?lang=${lang}`)
export const getBackfillJob = (courseId, jobId) =>
  api.get(`/courses/${courseId}/backfill-localizations/jobs/${jobId}`)

export const generateLessonsOutline = (courseId, payload) =>
  api.post(`/courses/${courseId}/lessons/generate-outline`, payload)
export const getLessonsGenerationJob = (courseId, jobId) =>
  api.get(`/courses/${courseId}/lessons/generation-jobs/${jobId}`)
export const generateLessonsFromOutline = (courseId, payload) =>
  api.post(`/courses/${courseId}/lessons/generation-jobs/from-outline`, payload)
export const generateLessonsFromFiles = (courseId, payload) =>
  api.post(`/courses/${courseId}/lessons/generate-from-files`, payload)
