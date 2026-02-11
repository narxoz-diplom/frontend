/**
 * Простая JWT-аутентификация (без Keycloak).
 * Совместимый объект с keycloak: token, tokenParsed, authenticated, initSafe, logout.
 */

const parseJwtPayload = (token) => {
  if (!token) return null
  try {
    let payload = token.split('.')[1]
    if (!payload) return null
    switch (payload.length % 4) {
      case 2: payload += '=='; break
      case 3: payload += '='; break
    }
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

const auth = {
  authenticated: false,
  token: null,
  refreshToken: null,
  idToken: null,
  tokenParsed: null,
  initialized: false,

  initSafe() {
    const token = localStorage.getItem('kc-access-token')
    const authenticated = localStorage.getItem('kc-authenticated') === 'true'
    if (token && authenticated) {
      this.authenticated = true
      this.token = token
      this.refreshToken = localStorage.getItem('kc-refresh-token')
      this.idToken = localStorage.getItem('kc-id-token')
      this.tokenParsed = parseJwtPayload(token)
      this.initialized = true
      if (typeof window !== 'undefined') window.keycloak = auth
      return Promise.resolve(true)
    }
    this.authenticated = false
    this.token = null
    this.tokenParsed = null
    this.initialized = true
    if (typeof window !== 'undefined') window.keycloak = auth
    return Promise.resolve(false)
  },

  logout() {
    localStorage.removeItem('kc-access-token')
    localStorage.removeItem('kc-refresh-token')
    localStorage.removeItem('kc-id-token')
    localStorage.removeItem('kc-authenticated')
    this.authenticated = false
    this.token = null
    this.refreshToken = null
    this.idToken = null
    this.tokenParsed = null
    if (typeof window !== 'undefined') window.keycloak = auth
    window.location.href = '/login'
  }
}

if (typeof window !== 'undefined') {
  window.keycloak = auth
}

export default auth
