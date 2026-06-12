import axios from 'axios'
import auth from '@/shared/config/auth'

const apiUrl = import.meta.env.VITE_API_URL || ''
const apiOrigin = apiUrl.startsWith('http') ? apiUrl.replace(/\/$/, '') : ''

const api = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

const refreshSession = async () => {
  const { data } = await axios.post(`${apiOrigin}/api/auth/refresh`, {
    refreshToken: auth.refreshToken
  })
  auth.applyTokens(data)
  return data.accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error
    if (response?.status !== 401 || !auth.refreshToken || config._retried) {
      return Promise.reject(error)
    }
    try {
      const accessToken = await refreshSession()
      config._retried = true
      config.headers.Authorization = `Bearer ${accessToken}`
      return api.request(config)
    } catch (refreshError) {
      auth.clearSession()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  }
)

export default api
