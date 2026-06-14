import api from './client'

export const getFiles = () => api.get('/files')
export const getCourseFiles = (courseId) => api.get(`/files/course/${courseId}`)
export const getLessonFiles = (lessonId) => api.get(`/files/lesson/${lessonId}`)

export const uploadVideo = (formData, config = {}) =>
  api.post('/files/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  })

export const uploadToLesson = (formData, config = {}) =>
  api.post('/files/upload-to-lesson', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  })

export const uploadToCourse = (formData, config = {}) =>
  api.post('/files/upload-to-course', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  })

export const uploadNewsImage = (formData, config = {}) =>
  api.post('/files/upload-news-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  })

export const uploadAvatar = (formData, config = {}) =>
  api.post('/files/upload-avatar', formData, config)

export const ingestUrlToCourse = (courseId, url) =>
  api.post(`/files/course/${courseId}/ingest-url`, { url })

export const renameFile = (fileId, originalFileName) =>
  api.put(`/files/${fileId}`, { originalFileName })

export const deleteFile = (fileId) => api.delete(`/files/${fileId}`)

export const downloadFile = (fileId) =>
  api.get(`/files/${fileId}/download`, { responseType: 'blob' })
