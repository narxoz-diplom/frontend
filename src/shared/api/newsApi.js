import api from './client'

export const getNews = () => api.get('/news')
export const getNewsItem = (newsId) => api.get(`/news/${newsId}`)
export const createNews = (payload) => api.post('/news', payload)
export const updateNews = (newsId, payload) => api.put(`/news/${newsId}`, payload)
export const deleteNews = (newsId) => api.delete(`/news/${newsId}`)
