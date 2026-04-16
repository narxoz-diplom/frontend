import i18n from './index'

/**
 * Picks localized field from backend entities that expose:
 * - base field: title, description, content, text, ...
 * - optional variants: titleKz/titleEn (or title_kz/title_en)
 *
 * Fallback order: current language -> ru(base) -> any existing -> ''.
 */
export function pickLocalized(obj, baseField) {
  if (!obj || !baseField) return ''
  const lang = (i18n.language || 'ru').toLowerCase()

  const base = obj?.[baseField]
  if (lang === 'ru') return base ?? ''

  const suffix = lang === 'kz' ? 'Kz' : lang === 'en' ? 'En' : ''
  const camelKey = suffix ? `${baseField}${suffix}` : null
  const snakeKey = suffix ? `${baseField}_${lang}` : null

  const v =
    (camelKey && obj?.[camelKey]) ??
    (snakeKey && obj?.[snakeKey]) ??
    base ??
    ''

  return v ?? ''
}

