export const THEME_STORAGE_KEY = 'theme'

export function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'system'
}

export function isDarkTheme(theme = getStoredTheme()) {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme = getStoredTheme()) {
  const dark = isDarkTheme(theme)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  document.body.classList.toggle('dark-mode', dark)
}
