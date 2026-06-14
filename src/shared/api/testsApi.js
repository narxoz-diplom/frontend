import api from './client'

export const getCourseTests = (courseId) => api.get(`/courses/${courseId}/tests`)
export const getTest = (testId) => api.get(`/courses/tests/${testId}`)
export const updateTest = (testId, payload) => api.put(`/courses/tests/${testId}`, payload)
export const submitTest = (testId, payload) => api.post(`/courses/tests/${testId}/submit`, payload)
export const updateTestSettings = (testId, payload) =>
  api.patch(`/courses/tests/${testId}/settings`, payload)
export const generateTests = (courseId, payload) =>
  api.post(`/courses/${courseId}/tests/generate`, payload)

export const getMyTestAttempts = () => api.get('/courses/my/test-attempts')
export const getUpcomingTestDeadlines = () => api.get('/courses/my/upcoming-test-deadlines')
export const getCourseTestResults = (courseId) => api.get(`/courses/${courseId}/test-results`)
