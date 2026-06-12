import { useState, useEffect, useRef } from 'react'

export const useCourseHighlight = ({ selectedLessonId, selectedTestId, lessons, tests }) => {
  const [highlightedLessonId, setHighlightedLessonId] = useState(null)
  const [highlightedTestId, setHighlightedTestId] = useState(null)
  const lessonRefs = useRef({})
  const testRefs = useRef({})

  useEffect(() => {
    let timeoutId

    if (selectedLessonId && lessons.some((lesson) => String(lesson.id) === String(selectedLessonId))) {
      setHighlightedLessonId(String(selectedLessonId))
      setHighlightedTestId(null)
      const node = lessonRefs.current[selectedLessonId]
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      timeoutId = window.setTimeout(() => setHighlightedLessonId(null), 2200)
      return () => window.clearTimeout(timeoutId)
    }

    if (selectedTestId && tests.some((test) => String(test.id) === String(selectedTestId))) {
      setHighlightedTestId(String(selectedTestId))
      setHighlightedLessonId(null)
      const node = testRefs.current[selectedTestId]
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      timeoutId = window.setTimeout(() => setHighlightedTestId(null), 2200)
      return () => window.clearTimeout(timeoutId)
    }

    setHighlightedLessonId(null)
    setHighlightedTestId(null)
    return undefined
  }, [selectedLessonId, selectedTestId, lessons, tests])

  return { highlightedLessonId, highlightedTestId, lessonRefs, testRefs }
}
