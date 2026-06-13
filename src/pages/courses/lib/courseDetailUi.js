import { pickLocalized } from '@/i18n/localize'

export const avatarInitials = (name) => {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return parts
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return String(name).slice(0, 2).toUpperCase()
}

export const formatAboutDate = (iso) => {
  if (!iso) return null
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
  } catch {
    return null
  }
}

export const estimateLessonMinutes = (lesson) => {
  if (lesson?.duration) {
    const match = String(lesson.duration).match(/(\d+)/)
    if (match) return Number(match[1])
  }
  const content = pickLocalized(lesson, 'content') || ''
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(5, Math.min(60, Math.round(words / 180) || 5))
}

export const lessonHasVideo = (lesson) => {
  if (!lesson) return false
  if (lesson.hasVideo === true) return true
  if (typeof lesson.videoCount === 'number' && lesson.videoCount > 0) return true
  if (lesson.videoUrl) return true
  return Array.isArray(lesson.videos) && lesson.videos.length > 0
}

export const resolveTestQuestionCount = (test) => {
  if (!test) return null
  const direct = test.questionCount ?? test.questionsCount
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct
  if (Array.isArray(test.questions)) return test.questions.length
  return null
}

export const formatTestDueDateInput = (value) => {
  if (!value) return ''
  const str = String(value).trim()
  if (!str) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  try {
    const date = new Date(str)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export const statusI18nKey = (status) => `status.${String(status || '').toLowerCase()}`

export const looksLikeEmail = (value) => /@/.test(String(value || '').trim())

const humanizeLocalPart = (email) => {
  if (!email) return null
  const local = String(email).split('@')[0]
  if (!local) return null
  return local.replace(/[._-]+/g, ' ').trim()
}

export const participantDisplayName = (row) => {
  if (row?.fullName?.trim()) return row.fullName.trim()
  const label = row?.displayLabel?.trim()
  if (label && !looksLikeEmail(label)) return label
  if (row?.email?.trim()) return humanizeLocalPart(row.email) || row.email.trim()
  if (label && looksLikeEmail(label)) return humanizeLocalPart(label) || label
  return null
}

export const participantDisplayEmail = (row) => {
  if (row?.email?.trim()) return row.email.trim()
  const label = row?.displayLabel?.trim()
  if (looksLikeEmail(label)) return label
  return null
}

export const formatParticipantEnrolledDate = (iso) => {
  if (!iso) return null
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

export const participantProgressPercent = (row) => {
  const value = row?.progressPercent ?? row?.progress
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return Math.min(100, Math.max(0, Math.round(value)))
}

export const averageParticipantProgress = (students = []) => {
  const values = students
    .map((student) => participantProgressPercent(student))
    .filter((value) => value != null)
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}
