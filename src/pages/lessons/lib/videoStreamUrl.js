/** Build stream path for lesson video playback. */
export function buildVideoStreamPath(video, lessonId, videoId) {
  if (lessonId != null && videoId != null) {
    return `/api/courses/lessons/${lessonId}/videos/${videoId}/stream`
  }

  if (!video) return ''

  if (video.objectName) {
    return `/api/files/videos/stream?objectName=${encodeURIComponent(video.objectName)}`
  }

  let path = (video.videoUrl || '').trim()
  if (!path) return ''

  path = path.replace('/api/courses/videos/', '/api/files/videos/')

  const queryMatch = path.match(/[?&]objectName=([^&]+)/)
  if (queryMatch) {
    return `/api/files/videos/stream?objectName=${queryMatch[1]}`
  }

  const pathMatch = path.match(/\/api\/files\/videos\/([^/?]+)\/stream/)
  if (pathMatch) {
    return `/api/files/videos/stream?objectName=${encodeURIComponent(decodeURIComponent(pathMatch[1]))}`
  }

  if (path.startsWith('/api/')) {
    return path
  }

  return `/api/files/videos/stream?objectName=${encodeURIComponent(path)}`
}
