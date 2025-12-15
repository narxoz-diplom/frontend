import Keycloak from 'keycloak-js'

// Создаем единственный экземпляр Keycloak
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'microservices-realm',
  clientId: 'microservices-client'
})

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

