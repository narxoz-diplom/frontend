const CREDENTIAL_HINTS = [
  /invalid\s+(user(name)?|credentials|grant|password|login)/i,
  /wrong\s+(user(name)?|password|credentials)/i,
  /bad\s+credentials/i,
  /incorrect\s+(user(name)?|password|credentials)/i,
  /неверн/i,
  /қате\s+құпия/i,
  /пайдаланушы\s+аты/i,
  /unauthorized/i,
  /authentication\s+failed/i,
  /error_description/i,
]

const SERVER_PREFIX = /^internal\s+server\s+error:\s*/i

export function extractErrorText(data) {
  if (!data) return ''
  if (typeof data === 'string') return data.trim()
  if (typeof data !== 'object') return ''

  const raw =
    data.message ??
    data.error ??
    data.detail ??
    data.error_description ??
    data.errorMessage ??
    ''

  return typeof raw === 'string' ? raw.trim() : ''
}

export function isCredentialError(status, text) {
  if (status === 401 || status === 403) return true
  const normalized = String(text || '').replace(SERVER_PREFIX, '').trim()
  if (!normalized) return false
  return CREDENTIAL_HINTS.some((pattern) => pattern.test(normalized))
}

export function normalizeAuthMessage(text) {
  if (!text) return ''
  return String(text).replace(SERVER_PREFIX, '').trim()
}

function pickCredentialMessage(text, t) {
  const normalized = normalizeAuthMessage(text)
  if (!normalized) return t('auth.invalidCredentials')
  if (isCredentialError(null, normalized)) return t('auth.invalidCredentials')
  return normalized
}

export function resolveLoginError({ status, data }, networkError, t) {
  const text = extractErrorText(data)

  if (!status) {
    if (networkError?.message === 'Failed to fetch') {
      return { kind: 'network', message: t('auth.networkError'), title: null }
    }
    return { kind: 'network', message: t('auth.networkError'), title: null }
  }

  if (isCredentialError(status, text)) {
    return {
      kind: 'credentials',
      message: pickCredentialMessage(text, t),
      title: null,
    }
  }

  if (status === 429) {
    return { kind: 'rateLimit', message: t('auth.tooManyAttempts'), title: t('auth.loginError') }
  }

  const normalized = normalizeAuthMessage(text)

  if (status >= 500) {
    if (normalized) {
      return { kind: 'server', message: normalized, title: t('auth.loginError') }
    }
    return { kind: 'server', message: t('auth.serviceUnavailable'), title: t('auth.loginError') }
  }

  if (status === 404) {
    return { kind: 'server', message: t('auth.serviceUnavailable'), title: t('auth.loginError') }
  }

  if (normalized) {
    return { kind: 'other', message: normalized, title: t('auth.loginError') }
  }

  return { kind: 'other', message: t('auth.loginDefaultError'), title: t('auth.loginError') }
}

export function resolveRegisterError({ status, data }, networkError, t) {
  const text = extractErrorText(data)
  const normalized = normalizeAuthMessage(text)

  if (!status) {
    return { kind: 'network', message: t('auth.networkError'), title: null }
  }

  if (status === 409) {
    return { kind: 'conflict', message: t('auth.userExists'), title: null }
  }

  if (status === 400 && normalized) {
    return { kind: 'validation', message: normalized, title: null }
  }

  if (normalized) {
    return { kind: 'other', message: normalized, title: t('auth.registerError') }
  }

  if (status >= 500) {
    return { kind: 'server', message: t('auth.registerServerError'), title: t('auth.registerError') }
  }

  return { kind: 'other', message: t('auth.registerDefaultError'), title: t('auth.registerError') }
}

export function getAuthApiBase() {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  if (apiUrl && apiUrl.startsWith('http')) {
    return `${apiUrl.replace(/\/$/, '')}/api`
  }
  return '/api'
}
