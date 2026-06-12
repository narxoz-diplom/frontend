export function normalizeCourseViewerResponse(data) {
  if (data && typeof data.preview === 'boolean' && data.course != null) {
    return { course: data.course, preview: data.preview }
  }
  return { course: data, preview: false }
}
