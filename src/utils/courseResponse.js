/**
 * GET /api/courses/:id returns { preview, course } for enrolled vs catalog preview.
 * Older responses were a plain course object.
 */
export function normalizeCourseViewerResponse(data) {
  if (data && typeof data.preview === 'boolean' && data.course != null) {
    return { course: data.course, preview: data.preview }
  }
  return { course: data, preview: false }
}
