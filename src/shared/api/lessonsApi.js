import api from './client'

export const getLessons = (courseId) => api.get(`/courses/${courseId}/lessons`)
export const getLesson = (lessonId) => api.get(`/courses/lessons/${lessonId}`)
export const createLesson = (courseId, payload) => api.post(`/courses/${courseId}/lessons`, payload)
export const updateLesson = (lessonId, payload) => api.put(`/courses/lessons/${lessonId}`, payload)
export const deleteLesson = (lessonId) => api.delete(`/courses/lessons/${lessonId}`)

export const getLessonVideos = (lessonId) => api.get(`/courses/lessons/${lessonId}/videos`)
export const addLessonVideo = (lessonId, metadata) =>
  api.post(`/courses/lessons/${lessonId}/videos`, metadata)
export const deleteLessonVideo = (lessonId, videoId) =>
  api.delete(`/courses/lessons/${lessonId}/videos/${videoId}`)
