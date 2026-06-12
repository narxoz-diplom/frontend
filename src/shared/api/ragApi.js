import axios from 'axios'
import api from './client'

const RAG_DIRECT_URL = String(import.meta.env.VITE_RAG_URL || '').trim().replace(/\/$/, '')

export const AG_UI_URL = String(import.meta.env.VITE_AG_UI_URL || '/api/ag-ui')
  .trim()
  .replace(/\/$/, '')

export const ragPost = (path, body, config = {}) => {
  const normalizedPath = path.replace(/^\//, '')
  if (RAG_DIRECT_URL) {
    return axios.post(`${RAG_DIRECT_URL}/api/v1/${normalizedPath}`, body, {
      headers: { 'Content-Type': 'application/json' },
      ...config
    })
  }
  return api.post(`/rag/${normalizedPath}`, body, config)
}
