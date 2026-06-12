export function parseOptions(optionsStr) {
  if (!optionsStr) return []

  try {
    const parsed = JSON.parse(optionsStr)

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, value]) => ({
        key: String(key),
        label: String(value)
      }))
    }

    if (Array.isArray(parsed)) {
      return parsed
        .map((text, idx) => ({
          key: String.fromCharCode(65 + idx),
          label: String(text)
        }))
    }
  } catch {}

  return optionsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text, idx) => ({
      key: String.fromCharCode(65 + idx),
      label: text
    }))
}
