import api from './client'

export const getAiModels = (capability = 'course-generation') =>
  api.get('/courses/ai/models', { params: { capability } })

export const getMyAiUsage = (params = {}) =>
  api.get('/courses/ai/usage/me', { params })

export const getAdminAiUsage = (params = {}) =>
  api.get('/courses/admin/ai/usage', { params })

export const getMyAiLimit = () => api.get('/courses/ai/usage/me/limit')

export const getAdminTeacherLimit = (userId) =>
  api.get(`/courses/admin/ai/teacher-limits/${encodeURIComponent(userId)}`)

export const updateAdminTeacherLimit = (userId, body) =>
  api.put(`/courses/admin/ai/teacher-limits/${encodeURIComponent(userId)}`, body)

export const resetAdminTeacherLimit = (userId) =>
  api.delete(`/courses/admin/ai/teacher-limits/${encodeURIComponent(userId)}`)
