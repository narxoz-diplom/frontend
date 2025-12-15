import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    if (window.keycloak && window.keycloak.token) {
      config.headers.Authorization = `Bearer ${window.keycloak.token}`
      console.log('DEBUG: Sending request with token to:', config.url)
      console.log('DEBUG: Token exists:', !!window.keycloak.token)
      console.log('DEBUG: Token preview:', window.keycloak.token?.substring(0, 50) + '...')
    } else {
      console.warn('DEBUG: No token available for request to:', config.url)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('DEBUG: API Error:', error.response?.status, error.response?.data)
    if (error.response?.status === 401 && window.keycloak) {
      try {
        await window.keycloak.updateToken(30)
        error.config.headers.Authorization = `Bearer ${window.keycloak.token}`
        return api.request(error.config)
      } catch (refreshError) {
        window.keycloak.logout()
        return Promise.reject(refreshError)
      }
    }
    if (error.response?.status === 403) {
      console.error('DEBUG: 403 Forbidden - Token may be invalid or user lacks permissions')
      console.error('DEBUG: Current roles:', window.keycloak?.tokenParsed?.realm_access?.roles)
    }
    return Promise.reject(error)
  }
)

export default api



