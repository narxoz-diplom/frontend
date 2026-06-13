import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'
import StudioMiniField from './StudioMiniField'

const TEST_COUNTS = [5, 8, 10, 15]

const GenerationScenarios = ({
  testTitle,
  onTestTitleChange,
  questionCount,
  onQuestionCountChange,
  testDifficulty,
  onTestDifficultyChange,
  generatingTest,
  selectedLessonsCount,
  onGenerateTest,
  canGenerate = true,
}) => {
  const { t } = useTranslation()

  return (
    <div className="card">
      <div className="sec-head">
        <div className="row gap10" style={{ alignItems: 'center' }}>
          <span
            className="gen-ic"
            style={{ background: 'var(--violet-50)', color: 'var(--violet-500)' }}
          >
            <Icon name="target" size={18} />
          </span>
          <h3 className="h3">{t('studio.testGen')}</h3>
        </div>
      </div>

      <div style={{ padding: '4px 18px 18px' }}>
        <div className="studio-test-gen-fields">
          <StudioMiniField label={t('studio.testTitle')}>
            <input
              className="input"
              style={{ height: 38 }}
              placeholder={t('courseEdit.testTitlePlaceholder')}
              value={testTitle}
              onChange={(e) => onTestTitleChange(e.target.value)}
            />
          </StudioMiniField>

          <StudioMiniField label={t('studio.testQuestions')}>
            <select
              className="select"
              style={{ height: 38 }}
              value={questionCount}
              onChange={(e) => onQuestionCountChange(Number(e.target.value))}
            >
              {TEST_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </StudioMiniField>

          <StudioMiniField label={t('studio.difficulty')}>
            <select
              className="select"
              style={{ height: 38 }}
              value={testDifficulty}
              onChange={(e) => onTestDifficultyChange(e.target.value)}
            >
              <option value="easy">{t('studio.testDifficultyEasy')}</option>
              <option value="medium">{t('studio.testDifficultyMedium')}</option>
              <option value="hard">{t('studio.testDifficultyHard')}</option>
            </select>
          </StudioMiniField>

          <button
            type="button"
            className="btn btn-outline studio-test-gen-submit"
            onClick={onGenerateTest}
            disabled={generatingTest || selectedLessonsCount === 0 || !canGenerate}
          >
            {generatingTest ? (
              <Spinner size={16} />
            ) : (
              <Icon name="sparkles" size={16} />
            )}
            {generatingTest ? t('courseEdit.generatingTest') : t('studio.generateTest')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GenerationScenarios
