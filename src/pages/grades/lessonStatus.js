export function lessonGradeStatusLabel(lesson, t) {
  const graded = lesson.gradedCount ?? 0
  const total = lesson.totalStudents ?? 0
  if (total === 0) return t('teacherGrades.statusUnknown')
  if ((lesson.status === 'complete' || (total > 0 && graded >= total)) && total > 0) {
    return t('teacherGrades.statusComplete', { graded, total })
  }
  if (graded > 0 && total > 0) {
    return t('teacherGrades.statusProgress', { graded, total })
  }
  return t('teacherGrades.statusReview')
}

export function lessonGradeStatusBadge(status) {
  if (status === 'complete') return 'badge badge-published'
  if (status === 'in_progress') return 'badge badge-draft'
  return 'badge'
}
