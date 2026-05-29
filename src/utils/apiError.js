/**
 * Текст ошибки API на языке интерфейса.
 * Сообщения бэкенда часто на английском — не показываем их напрямую.
 */
export function resolveApiError(error, t, fallbackKey) {
  if (!error?.response) {
    const networkKey = 'apiErrors.network'
    const networkMsg = t(networkKey)
    if (networkMsg !== networkKey) return networkMsg
    return t(fallbackKey)
  }

  const status = error.response.status
  const statusKey = `apiErrors.http${status}`
  const statusMsg = t(statusKey)
  if (statusMsg !== statusKey) return statusMsg

  return t(fallbackKey)
}
