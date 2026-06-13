import { getLessonVideos } from '@/shared/api/lessonsApi'

export async function enrichLessonsWithVideos(lessons = []) {
  if (!Array.isArray(lessons) || lessons.length === 0) return []

  return Promise.all(
    lessons.map(async (lesson) => {
      if (Array.isArray(lesson.videos) && lesson.videos.length > 0) {
        return lesson
      }
      try {
        const response = await getLessonVideos(lesson.id)
        const videos = response.data || []
        if (videos.length === 0) return lesson
        return { ...lesson, videos }
      } catch {
        return lesson
      }
    }),
  )
}
