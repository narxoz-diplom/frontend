import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiDownload, FiSearch, FiLoader } from 'react-icons/fi'
import api from '../services/api'
import { pickLocalized } from '../i18n/localize'
import { canUpload } from '../utils/roles'
import { normalizeCourseViewerResponse } from '../utils/courseResponse'
import { useTranslation } from 'react-i18next'
import './CourseTestResults.css'

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
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/tests`)
        ])
        setCourse(normalizeCourseViewerResponse(courseRes.data).course)
        setTests(Array.isArray(testsRes.data) ? testsRes.data : [])
        try {
          const tr = await api.get(`/courses/${courseId}/test-results`)
          setTestResults(Array.isArray(tr.data) ? tr.data : [])
        } catch (trErr) {
          setTestResults([])
          if (trErr?.response?.status && trErr.response.status !== 403) {
            console.warn('Course test results:', trErr)
          }
        }
        setError(null)
      } catch (err) {
        console.error('CourseTestResults load:', err)
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
      rows = rows.filter((r) => String(r.testId) === String(testResultFilterTestId))
    }
    const q = testResultSearch.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r) => (r.studentId || '').toLowerCase().includes(q))
    }
    return rows
  }, [testResults, testResultFilterTestId, testResultSearch])

  const csvEscape = (v) => {
    const s = v == null ? '' : String(v)
    if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const exportTestResultsCsv = useCallback(() => {
    const headers = [
      t('courseEdit.testResultsColDate'),
      t('courseEdit.testResultsColStudent'),
      t('courseEdit.testResultsColTest'),
      t('courseEdit.testResultsColScore'),
      t('courseEdit.testResultsColPercent'),
      t('courseEdit.testResultsColFlag')
    ]
    const rows = filteredTestResults.map((r) => {
      const title = pickLocalized(
        { title: r.testTitle, titleKz: r.testTitleKz, titleEn: r.testTitleEn },
        'title'
      )
      const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0
      return [
        r.completedAt || '',
        r.studentId || '',
        title,
        `${r.score ?? ''}/${r.maxScore ?? ''}`,
        String(pct),
        r.suspiciousFlag ? '1' : '0'
      ]
    })
    const sep = ';'
    const lines = [headers.join(sep), ...rows.map((line) => line.map(csvEscape).join(sep))]
    const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `course-${courseId}-test-results.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [filteredTestResults, courseId, t])

  const formatAttemptDate = (iso) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return iso
      return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <div className="course-test-results-loading">
        <FiLoader className="spin" size={40} />
        <p>{t('courseEdit.loading')}</p>
      </div>
    )
  }

  if (!canUpload(window.keycloak)) {
    return <div className="course-test-results-error">{t('courseEdit.forbidden')}</div>
  }

  if (!course) {
    return <div className="course-test-results-error">{t('courseEdit.notFound')}</div>
  }

  const courseTitle = pickLocalized(course, 'title') || course.title || ''

  return (
    <div className="course-test-results">
      <header className="course-test-results__header">
        <div className="course-test-results__nav">
          <Link to={`/courses/${courseId}`} className="course-test-results__back">
            <FiArrowLeft aria-hidden /> {t('courseEdit.backToCourse')}
          </Link>
          <Link to={`/courses/${courseId}/edit`} className="course-test-results__back course-test-results__back--secondary">
            {t('courseTestResults.backToEdit')}
          </Link>
        </div>
        <h1 className="course-test-results__title">{t('courseEdit.testResultsTitle')}</h1>
        <p className="course-test-results__course-name">{courseTitle}</p>
        <p className="course-test-results__desc">{t('courseEdit.testResultsDesc')}</p>
      </header>

      {error && <div className="course-test-results__banner">{error}</div>}

      <section className="course-test-results__section">
        <div className="test-results-head">
          <div className="test-results-toolbar">
            <div className="test-results-filters">
              <select
                id="test-result-filter"
                className="test-results-select"
                value={testResultFilterTestId}
                onChange={(e) => setTestResultFilterTestId(e.target.value)}
                aria-label={t('courseEdit.testResultsFilterTest')}
              >
                <option value="all">{t('courseEdit.testResultsAllTests')}</option>
                {tests.map((tst) => (
                  <option key={tst.id} value={String(tst.id)}>
                    {pickLocalized(tst, 'title') || tst.title || `#${tst.id}`}
                  </option>
                ))}
              </select>
              <div className="test-results-search-wrap">
                <FiSearch className="test-results-search-icon" aria-hidden />
                <input
                  type="search"
                  className="test-results-search"
                  placeholder={t('courseEdit.testResultsSearchPlaceholder')}
                  value={testResultSearch}
                  onChange={(e) => setTestResultSearch(e.target.value)}
                  aria-label={t('courseEdit.testResultsSearchPlaceholder')}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline test-results-export"
              onClick={exportTestResultsCsv}
              disabled={filteredTestResults.length === 0}
            >
              <FiDownload /> {t('courseEdit.testResultsExport')}
            </button>
          </div>
        </div>
        {testResults.length === 0 ? (
          <p className="empty-hint">{t('courseEdit.testResultsEmpty')}</p>
        ) : filteredTestResults.length === 0 ? (
          <p className="empty-hint">{t('courseEdit.testResultsNoMatch')}</p>
        ) : (
          <div className="test-results-table-wrap">
            <table className="test-results-table">
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
                {filteredTestResults.map((r) => {
                  const title = pickLocalized(
                    { title: r.testTitle, titleKz: r.testTitleKz, titleEn: r.testTitleEn },
                    'title'
                  )
                  const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0
                  return (
                    <tr key={r.attemptId}>
                      <td className="test-results-date">{formatAttemptDate(r.completedAt)}</td>
                      <td className="test-results-student">
                        <code>{r.studentId}</code>
                      </td>
                      <td>{title || `—`}</td>
                      <td>
                        {r.score} / {r.maxScore}
                      </td>
                      <td>
                        <span className={`test-results-pct ${pct < 50 ? 'is-low' : ''}`}>{pct}%</span>
                      </td>
                      <td>
                        {r.suspiciousFlag ? (
                          <span className="test-results-flag" title={t('courseEdit.testResultsFlagYes')}>
                            {t('courseEdit.testResultsFlagYes')}
                          </span>
                        ) : (
                          <span className="test-results-flag-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default CourseTestResults
