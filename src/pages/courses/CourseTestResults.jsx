import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { pickLocalized } from '@/i18n/localize'
import { canUpload } from '@/shared/lib/roles'
import { normalizeCourseViewerResponse } from '@/shared/lib/courseResponse'
import { getCourse } from '@/shared/api/coursesApi'
import { getCourseTests, getCourseTestResults } from '@/shared/api/testsApi'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner } from '@/shared/ui/academis'
import './CourseTestResults.css'

const csvEscape = (v) => {
  const s = v == null ? '' : String(v)
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const formatAttemptDate = (iso) => {
  if (!iso) return '—'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

const CourseTestResults = () => {
  const { t } = useTranslation()
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [tests, setTests] = useState([])
  const [testResults, setTestResults] = useState([])
  const [testResultFilterTestId, setTestResultFilterTestId] = useState('all')
  const [testResultSearch, setTestResultSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseId) return
    const load = async () => {
      try {
        setLoading(true)
        const [courseRes, testsRes] = await Promise.all([
          getCourse(courseId),
          getCourseTests(courseId),
        ])
        setCourse(normalizeCourseViewerResponse(courseRes.data).course)
        setTests(Array.isArray(testsRes.data) ? testsRes.data : [])
        try {
          const tr = await getCourseTestResults(courseId)
          setTestResults(Array.isArray(tr.data) ? tr.data : [])
        } catch {
          setTestResults([])
        }
        setError(null)
      } catch {
        setError(t('courseTestResults.loadError'))
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, t])

  const filteredTestResults = useMemo(() => {
    let rows = testResults
    if (testResultFilterTestId && testResultFilterTestId !== 'all') {
      rows = rows.filter((row) => String(row.testId) === String(testResultFilterTestId))
    }
    const query = testResultSearch.trim().toLowerCase()
    if (query) {
      rows = rows.filter((row) => (row.studentId || '').toLowerCase().includes(query))
    }
    return rows
  }, [testResults, testResultFilterTestId, testResultSearch])

  const averageScore = useMemo(() => {
    if (filteredTestResults.length === 0) return null
    const sum = filteredTestResults.reduce((acc, row) => {
      const percent = row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0
      return acc + percent
    }, 0)
    return Math.round(sum / filteredTestResults.length)
  }, [filteredTestResults])

  const exportTestResultsCsv = useCallback(() => {
    const headers = [
      t('courseEdit.testResultsColDate'),
      t('courseEdit.testResultsColStudent'),
      t('courseEdit.testResultsColTest'),
      t('courseEdit.testResultsColScore'),
      t('courseEdit.testResultsColPercent'),
      t('courseEdit.testResultsColFlag'),
    ]
    const rows = filteredTestResults.map((row) => {
      const title = pickLocalized(
        { title: row.testTitle, titleKz: row.testTitleKz, titleEn: row.testTitleEn },
        'title',
      )
      const percent = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0
      return [
        row.completedAt || '',
        row.studentId || '',
        title,
        `${row.score ?? ''}/${row.maxScore ?? ''}`,
        String(percent),
        row.suspiciousFlag ? '1' : '0',
      ]
    })
    const sep = ';'
    const lines = [headers.join(sep), ...rows.map((line) => line.map(csvEscape).join(sep))]
    const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = `course-${courseId}-test-results.csv`
    anchor.click()
    URL.revokeObjectURL(anchor.href)
  }, [filteredTestResults, courseId, t])

  if (loading) {
    return (
      <div className="page page-wide course-test-results-loading">
        <Spinner size={28} />
        <span className="muted">{t('courseEdit.loading')}</span>
      </div>
    )
  }

  if (!canUpload(auth)) {
    return (
      <div className="page page-wide">
        <div className="courses-flash courses-flash--error">{t('courseEdit.forbidden')}</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="page page-wide">
        <div className="courses-flash courses-flash--error">{t('courseEdit.notFound')}</div>
      </div>
    )
  }

  const courseTitle = pickLocalized(course, 'title') || course.title || ''

  return (
    <div className="page page-wide course-test-results-page">
      <PageHeader
        title={t('courseEdit.testResultsTitle')}
        subtitle={t('courseEdit.testResultsDesc')}
        back={`/courses/${courseId}`}
        breadcrumb={[
          { label: t('coursesPage.title'), to: '/courses' },
          { label: courseTitle, to: `/courses/${courseId}` },
          { label: t('courseEdit.testResultsTitle') },
        ]}
        actions={(
          <Link to={`/courses/${courseId}/edit`} className="btn btn-outline">
            {t('courseTestResults.backToEdit')}
          </Link>
        )}
      />

      {error && <div className="courses-flash courses-flash--error">{error}</div>}

      {averageScore != null && (
        <div className="card course-test-results-avg" style={{ marginBottom: 16, padding: '16px 18px' }}>
          <div className="row between" style={{ alignItems: 'center' }}>
            <span className="muted" style={{ fontWeight: 600 }}>
              {t('courseEdit.testResultsAvg', { defaultValue: 'Средний балл' })}
            </span>
            <span className="h2" style={{ color: 'var(--brand)', fontSize: 28 }}>
              {averageScore}%
            </span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="sec-head">
          <h3 className="h3">{t('courseTestResults.navLink')}</h3>
        </div>

        <div style={{ padding: '0 18px 18px' }}>
          <div className="row between wrap gap12" style={{ marginBottom: 14 }}>
            <div className="row gap10 wrap">
              <select
                className="input"
                style={{ minWidth: 180 }}
                value={testResultFilterTestId}
                onChange={(event) => setTestResultFilterTestId(event.target.value)}
                aria-label={t('courseEdit.testResultsFilterTest')}
              >
                <option value="all">{t('courseEdit.testResultsAllTests')}</option>
                {tests.map((test) => (
                  <option key={test.id} value={String(test.id)}>
                    {pickLocalized(test, 'title') || test.title || `#${test.id}`}
                  </option>
                ))}
              </select>

              <div className="input-icon" style={{ width: 240 }}>
                <Icon name="search" size={16} />
                <input
                  type="search"
                  className="input"
                  placeholder={t('courseEdit.testResultsSearchPlaceholder')}
                  value={testResultSearch}
                  onChange={(event) => setTestResultSearch(event.target.value)}
                  aria-label={t('courseEdit.testResultsSearchPlaceholder')}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={exportTestResultsCsv}
              disabled={filteredTestResults.length === 0}
            >
              <Icon name="download" size={16} />
              {t('courseEdit.testResultsExport')}
            </button>
          </div>

          {testResults.length === 0 ? (
            <p className="muted">{t('courseEdit.testResultsEmpty')}</p>
          ) : filteredTestResults.length === 0 ? (
            <p className="muted">{t('courseEdit.testResultsNoMatch')}</p>
          ) : (
            <div className="course-test-results-page__table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t('courseEdit.testResultsColDate')}</th>
                    <th>{t('courseEdit.testResultsColStudent')}</th>
                    <th>{t('courseEdit.testResultsColTest')}</th>
                    <th>{t('courseEdit.testResultsColScore')}</th>
                    <th>{t('courseEdit.testResultsColPercent')}</th>
                    <th>{t('courseEdit.testResultsColFlag')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestResults.map((row) => {
                    const title = pickLocalized(
                      { title: row.testTitle, titleKz: row.testTitleKz, titleEn: row.testTitleEn },
                      'title',
                    )
                    const percent = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0
                    return (
                      <tr key={row.attemptId}>
                        <td>{formatAttemptDate(row.completedAt)}</td>
                        <td><code>{row.studentId}</code></td>
                        <td>{title || '—'}</td>
                        <td>{row.score} / {row.maxScore}</td>
                        <td>
                          <span className={`badge ${percent < 50 ? 'badge-draft' : 'badge-published'}`}>
                            {percent}%
                          </span>
                        </td>
                        <td>
                          {row.suspiciousFlag ? t('courseEdit.testResultsFlagYes') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseTestResults
