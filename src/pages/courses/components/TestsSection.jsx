import React from 'react'
import { Link } from 'react-router-dom'
import { FiCheckSquare } from 'react-icons/fi'
import { pickLocalized } from '@/i18n/localize'
import { useTranslation } from 'react-i18next'

const TestsSection = ({ courseId, previewMode, tests, highlightedTestId, testRefs }) => {
  const { t } = useTranslation()

  return (
    <section className="tests-section course-panel">
      <div className="course-section-head__text course-section-head__text--tests">
        <span className="course-section-head__eyebrow">{t('coursePage.knowledgeCheck')}</span>
        <h2>{t('coursePage.tests')}</h2>
      </div>
      {previewMode ? (
        <div className="card empty-state course-page__preview-gate">
          <div className="empty-state-icon">
            <FiCheckSquare />
          </div>
          <p>{t('coursePage.previewTestsHint')}</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <FiCheckSquare />
          </div>
          <p>{t('coursePage.noTests')}</p>
        </div>
      ) : (
        <div className="tests-list">
          {tests.map((test) => (
            <Link
              key={test.id}
              ref={(node) => {
                if (node) {
                  testRefs.current[test.id] = node
                } else {
                  delete testRefs.current[test.id]
                }
              }}
              to={`/courses/${courseId}/tests/${test.id}`}
              className={`test-card-link${String(test.id) === highlightedTestId ? ' test-card-link--search-hit' : ''}`}
            >
              <FiCheckSquare className="test-icon" />
              <span>{pickLocalized(test, 'title')}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default TestsSection
