import Keycloak from 'keycloak-js'

// Функция для сохранения токенов в localStorage
const saveTokens = (kc) => {
  if (kc.authenticated && kc.token) {
    localStorage.setItem('kc-access-token', kc.token)
    if (kc.refreshToken) {
      localStorage.setItem('kc-refresh-token', kc.refreshToken)
    }
    if (kc.idToken) {
      localStorage.setItem('kc-id-token', kc.idToken)
    }
    localStorage.setItem('kc-authenticated', 'true')
  }
}

// Функция для очистки токенов из localStorage
const clearTokens = () => {
  localStorage.removeItem('kc-access-token')
  localStorage.removeItem('kc-refresh-token')
  localStorage.removeItem('kc-id-token')
  localStorage.removeItem('kc-authenticated')
}

// Создаем единственный экземпляр Keycloak
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'microservices-realm',
  clientId: 'microservices-client'
})

// Устанавливаем обработчики событий для сохранения токенов
keycloak.onAuthSuccess = function() {
  console.log('Keycloak authentication successful')
  saveTokens(this)
}

keycloak.onAuthError = function() {
  console.error('Keycloak authentication error')
  clearTokens()
}

keycloak.onTokenExpired = function() {
  console.log('Keycloak token expired, refreshing...')
  this.updateToken(30).then((refreshed) => {
    if (refreshed) {
      saveTokens(this)
    }
  }).catch(() => {
    console.error('Failed to refresh token')
    clearTokens()
  })
}

keycloak.onAuthLogout = function() {
  console.log('Keycloak logout')
  clearTokens()
}

// Флаг для отслеживания инициализации
let initPromise = null

// Обертка для безопасной инициализации
keycloak.initSafe = function(options) {
  if (initPromise) {
    return initPromise
  }
  
  // Проверяем, есть ли сохраненные токены в localStorage
  const savedToken = localStorage.getItem('kc-access-token')
  const savedRefreshToken = localStorage.getItem('kc-refresh-token')
  const savedIdToken = localStorage.getItem('kc-id-token')
  const isAuthenticated = localStorage.getItem('kc-authenticated') === 'true'
  
  if (savedToken && isAuthenticated) {
    // Восстанавливаем токены из localStorage
    keycloak.authenticated = true
    keycloak.token = savedToken
    keycloak.refreshToken = savedRefreshToken
    keycloak.idToken = savedIdToken
    
    // Парсим токен
    try {
      const payload = JSON.parse(atob(savedToken.split('.')[1]))
      keycloak.tokenParsed = payload
    } catch (e) {
      console.error('Error parsing saved token', e)
    }
    
    // Убеждаемся, что keycloak доступен в window
    if (typeof window !== 'undefined') {
      window.keycloak = keycloak
    }
    
    // Возвращаем resolved promise с authenticated = true
    initPromise = Promise.resolve(true)
    return initPromise
  }
  
  // Иначе инициализируем как обычно
  initPromise = this.init(options || { onLoad: 'check-sso', checkLoginIframe: false })
    .then((authenticated) => {
      // Сохраняем токены после успешной инициализации
      if (authenticated) {
        saveTokens(this)
      }
      
      // Убеждаемся, что keycloak доступен в window после инициализации
      if (typeof window !== 'undefined') {
        window.keycloak = keycloak
      }
      return authenticated
    })
    .catch((error) => {
      console.error('Keycloak initialization error:', error)
      // Убеждаемся, что keycloak доступен в window даже при ошибке
      if (typeof window !== 'undefined') {
        window.keycloak = keycloak
      }
      throw error
    })
  
  return initPromise
}

// Сохраняем в window для глобального доступа
if (typeof window !== 'undefined') {
  window.keycloak = keycloak
}

export default keycloak

