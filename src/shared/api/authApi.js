import api from './client'
import { getAuthApiBase } from '@/shared/lib/authErrors'

const postPublic = async (path, payload) => {
  const response = await fetch(`${getAuthApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

export const login = (credentials) => postPublic('/auth/login', credentials)
export const register = (payload) => postPublic('/auth/register', payload)
export const getCurrentUser = () => api.get('/auth/user')
