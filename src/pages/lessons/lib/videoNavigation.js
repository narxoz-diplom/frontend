export function getNextVideo(lessons, lessonId, videoId) {
  const currentLessonIndex = lessons.findIndex(l => l.id === parseInt(lessonId))
  if (currentLessonIndex === -1) return null

  const currentLesson = lessons[currentLessonIndex]
  const currentVideoIndex = currentLesson.videos?.findIndex(v => v.id === parseInt(videoId)) || -1

  if (currentLesson.videos && currentVideoIndex < currentLesson.videos.length - 1) {
    return {
      lessonId: currentLesson.id,
      videoId: currentLesson.videos[currentVideoIndex + 1].id
    }
  }

  if (currentLessonIndex < lessons.length - 1) {
    const nextLesson = lessons[currentLessonIndex + 1]
    if (nextLesson.videos && nextLesson.videos.length > 0) {
      return {
        lessonId: nextLesson.id,
        videoId: nextLesson.videos[0].id
      }
    }
  }

  return null
}

export function getPrevVideo(lessons, lessonId, videoId) {
  const currentLessonIndex = lessons.findIndex(l => l.id === parseInt(lessonId))
  if (currentLessonIndex === -1) return null

  const currentLesson = lessons[currentLessonIndex]
  const currentVideoIndex = currentLesson.videos?.findIndex(v => v.id === parseInt(videoId)) || -1

  if (currentVideoIndex > 0) {
    return {
      lessonId: currentLesson.id,
      videoId: currentLesson.videos[currentVideoIndex - 1].id
    }
  }

  if (currentLessonIndex > 0) {
    const prevLesson = lessons[currentLessonIndex - 1]
    if (prevLesson.videos && prevLesson.videos.length > 0) {
      return {
        lessonId: prevLesson.id,
        videoId: prevLesson.videos[prevLesson.videos.length - 1].id
      }
    }
  }

  return null
}
