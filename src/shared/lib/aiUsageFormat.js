export function formatMicrosToCurrency(micros, currency = 'USD', locale) {
  if (micros == null || !Number.isFinite(Number(micros))) return null
  const amount = Number(micros) / 1_000_000
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: amount < 0.01 ? 4 : 2
    }).format(amount)
  } catch {
    return `${amount.toFixed(4)} ${currency || 'USD'}`
  }
}

export function formatTokenCount(value) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return new Intl.NumberFormat().format(Number(value))
}

export function resolveAiApiErrorMessage(err, t, fallbackKey = 'courseEdit.outlineError') {
  const data = err?.response?.data
  if (data?.code === 'QUOTA_EXCEEDED') {
    return data.message || t('courseEdit.aiQuotaExceeded')
  }
  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message
  return err?.message || t(fallbackKey)
}
