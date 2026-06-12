const STORAGE_KEYS = {
  accessToken: 'kc-access-token',
  refreshToken: 'kc-refresh-token',
  idToken: 'kc-id-token',
  authenticated: 'kc-authenticated'
}

export const parseJwtPayload = (token) => {
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
    const token = localStorage.getItem(STORAGE_KEYS.accessToken)
    const authenticated = localStorage.getItem(STORAGE_KEYS.authenticated) === 'true'
    if (token && authenticated) {
      this.authenticated = true
      this.token = token
      this.refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
      this.idToken = localStorage.getItem(STORAGE_KEYS.idToken)
      this.tokenParsed = parseJwtPayload(token)
    } else {
      this.authenticated = false
      this.token = null
      this.tokenParsed = null
    }
    this.initialized = true
    return Promise.resolve(this.authenticated)
  },

  applyTokens({ accessToken, refreshToken, idToken }) {
    this.authenticated = true
    this.token = accessToken
    this.refreshToken = refreshToken || null
    this.tokenParsed = parseJwtPayload(accessToken)

    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken)
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken || '')
    localStorage.setItem(STORAGE_KEYS.authenticated, 'true')
    if (idToken) {
      this.idToken = idToken
      localStorage.setItem(STORAGE_KEYS.idToken, idToken)
    }
  },

  clearSession() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    this.authenticated = false
    this.token = null
    this.refreshToken = null
    this.idToken = null
    this.tokenParsed = null
  },

  logout() {
    this.clearSession()
    window.location.href = '/login'
  }
}

export default auth
