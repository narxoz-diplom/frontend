const PROGRESS_KEY = 'videoProgress'
const NOTES_KEY = 'videoNotes'
const BOOKMARKS_KEY = 'videoBookmarks'
const PLAYBACK_RATE_KEY = 'videoPlaybackRate'

const readMap = (storageKey) => {
  if (typeof Storage === 'undefined') return null
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writeEntry = (storageKey, entryKey, value) => {
  if (typeof Storage === 'undefined') return
  const raw = localStorage.getItem(storageKey) || '{}'
  try {
    const map = JSON.parse(raw)
    map[entryKey] = value
    localStorage.setItem(storageKey, JSON.stringify(map))
  } catch {}
}

export const buildProgressKey = (courseId, lessonId, videoId) => `${courseId}-${lessonId}-${videoId}`

export const readVideoProgress = () => readMap(PROGRESS_KEY) || {}

export const isVideoCompleted = (progressKey) => Boolean(readVideoProgress()[progressKey]?.completed)

export const saveVideoProgress = (progressKey, entry) => writeEntry(PROGRESS_KEY, progressKey, entry)

export const readVideoNotes = (progressKey) => (readMap(NOTES_KEY) || {})[progressKey] || []

export const saveVideoNotes = (progressKey, notes) => writeEntry(NOTES_KEY, progressKey, notes)

export const readVideoBookmarks = (progressKey) => (readMap(BOOKMARKS_KEY) || {})[progressKey] || []

export const saveVideoBookmarks = (progressKey, bookmarks) => writeEntry(BOOKMARKS_KEY, progressKey, bookmarks)

export const readPlaybackRate = () => {
  if (typeof Storage === 'undefined') return null
  const raw = localStorage.getItem(PLAYBACK_RATE_KEY)
  return raw ? parseFloat(raw) : null
}

export const savePlaybackRate = (rate) => {
  localStorage.setItem(PLAYBACK_RATE_KEY, rate.toString())
}
