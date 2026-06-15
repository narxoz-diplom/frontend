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

/** Teacher account quota from usage report `userLimit` (not per-model policy rows). */
export function computeUserQuotaPct(userLimit) {
  if (!userLimit) {
    return { pct: 0, unlimited: false, monthlyUsed: 0, monthlyLimit: 0 }
  }
  const monthlyUsed = userLimit.monthlyUsed ?? 0
  const monthlyLimit = userLimit.monthlyLimit ?? 0
  if (userLimit.unlimited) {
    return { pct: 0, unlimited: true, monthlyUsed, monthlyLimit: 0 }
  }
  const pct = monthlyLimit > 0
    ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100))
    : 0
  return { pct, unlimited: false, monthlyUsed, monthlyLimit }
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
