import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8083'

const api = axios.create({
  baseURL: apiUrl.startsWith('http') ? `${apiUrl}/api` : '/api',
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
    if (error.response?.status === 401 && window.keycloak && window.keycloak.refreshToken) {
      try {
        // Используем auth-service для обновления токена
        const refreshUrl = `${apiUrl}/api/auth/refresh`
        
        const refreshResponse = await axios.post(refreshUrl, {
          refreshToken: window.keycloak.refreshToken
        })
        
        const tokenData = refreshResponse.data
        
        // Обновляем токены
        window.keycloak.token = tokenData.accessToken
        window.keycloak.refreshToken = tokenData.refreshToken
        if (tokenData.idToken) {
          window.keycloak.idToken = tokenData.idToken
        }
        
        // Обновляем localStorage
        localStorage.setItem('kc-access-token', tokenData.accessToken)
        localStorage.setItem('kc-refresh-token', tokenData.refreshToken)
        if (tokenData.idToken) {
          localStorage.setItem('kc-id-token', tokenData.idToken)
        }
        
        // Парсим новый токен
        if (tokenData.accessToken) {
          try {
            let payload = tokenData.accessToken.split('.')[1]
            switch (payload.length % 4) {
              case 2: payload += '=='; break
              case 3: payload += '='; break
            }
            window.keycloak.tokenParsed = JSON.parse(atob(payload))
          } catch (e) {
            console.error('Error parsing refreshed token', e)
          }
        }
        
        // Повторяем запрос с новым токеном
        error.config.headers.Authorization = `Bearer ${tokenData.accessToken}`
        return api.request(error.config)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // Очищаем localStorage и перенаправляем на логин
        localStorage.removeItem('kc-access-token')
        localStorage.removeItem('kc-refresh-token')
        localStorage.removeItem('kc-id-token')
        localStorage.removeItem('kc-authenticated')
        if (window.keycloak) {
          window.keycloak.authenticated = false
          window.keycloak.token = null
          window.keycloak.refreshToken = null
        }
        window.location.href = '/login'
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



