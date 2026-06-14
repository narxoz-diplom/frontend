export const resolveStudentEmail = (row) => {
  if (!row) return '—'
  if (row.studentEmail) return row.studentEmail
  if (row.studentDisplayLabel && String(row.studentDisplayLabel).includes('@')) {
    return row.studentDisplayLabel
  }
  return row.studentName || row.studentId || '—'
}

export const studentResultSearchText = (row) => {
  return [
    row?.studentEmail,
    row?.studentName,
    row?.studentDisplayLabel,
    row?.studentId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
