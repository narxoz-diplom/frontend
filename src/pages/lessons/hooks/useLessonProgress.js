import { useState, useEffect } from 'react'
import { readVideoProgress, buildProgressKey } from '../lib/videoStorage'

export function useLessonProgress(courseId, lessonId, videos) {
  const [lessonProgress, setLessonProgress] = useState({ completed: false, progress: 0 })

  useEffect(() => {
    const progress = readVideoProgress()
    const total = videos.length
    let completed = 0
    videos.forEach(video => {
      if (progress[buildProgressKey(courseId, lessonId, video.id)]?.completed) {
        completed++
      }
    })
    setLessonProgress({
      completed: completed === total && total > 0,
      progress: total > 0 ? (completed / total) * 100 : 0
    })
  }, [courseId, lessonId, videos.length])

  return lessonProgress
}
