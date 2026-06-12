import React from 'react'
import { FiBook, FiCheckSquare, FiLayers, FiLoader } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const GenerationScenarios = ({
  quickGenLoading,
  selectedFilesCount,
  onQuickGenerate,
  testTitle,
  onTestTitleChange,
  questionCount,
  onQuestionCountChange,
  testDifficulty,
  onTestDifficultyChange,
  generatingTest,
  selectedLessonsCount,
  onGenerateTest,
  canGenerate = true
}) => {
  const { t } = useTranslation()

  return (
    <aside className="gen-side-rail" aria-label="Дополнительные сценарии">
      <p className="gen-side-rail__title">{t('courseEdit.otherScenarios')}</p>
      <p className="gen-side-rail__hint">
        {t('courseEdit.otherScenariosHint')}
      </p>
    <div className="generate-card gen-alt-card">
      <div className="gen-alt-card__icon">
        <FiBook aria-hidden />
      </div>
      <h4>{t('courseEdit.quickAllLessonsTitle')}</h4>
      <p>
        {t('courseEdit.quickAllLessonsDesc')}
      </p>
      <button
        type="button"
        className="btn btn-outline btn-lg gen-cta gen-cta--wide"
        onClick={onQuickGenerate}
        disabled={quickGenLoading || selectedFilesCount === 0 || !canGenerate}
      >
        {quickGenLoading ? (
          <>
            <FiLoader className="spin" /> {t('courseEdit.generating')}
          </>
        ) : (
          <>
            <FiLayers /> {t('courseEdit.generateAllLessons')}
          </>
        )}
      </button>
    </div>

    <div className="generate-card gen-test-card">
      <div className="gen-alt-card__icon gen-alt-card__icon--quiz">
        <FiCheckSquare aria-hidden />
      </div>
      <h4>{t('courseEdit.testByLessons')}</h4>
      <p>{t('courseEdit.testByLessonsDesc')}</p>
      <input
        type="text"
        placeholder={t('courseEdit.testTitlePlaceholder')}
        value={testTitle}
        onChange={(e) => onTestTitleChange(e.target.value)}
        className="gen-input"
      />
      <div className="gen-test-row">
        <label className="gen-field">
          <span className="gen-label">{t('courseEdit.questionCount')}</span>
          <input
            type="number"
            min={3}
            max={25}
            className="gen-input"
            value={questionCount}
            onChange={(e) => onQuestionCountChange(Number(e.target.value))}
          />
        </label>
        <label className="gen-field">
          <span className="gen-label">{t('courseEdit.difficulty')}</span>
          <select
            className="gen-select"
            value={testDifficulty}
            onChange={(e) => onTestDifficultyChange(e.target.value)}
          >
            <option value="easy">{t('courseEdit.difficultyEasy')}</option>
            <option value="medium">{t('courseEdit.difficultyMedium')}</option>
            <option value="hard">{t('courseEdit.difficultyHard')}</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-lg gen-cta gen-cta--wide"
        onClick={onGenerateTest}
        disabled={generatingTest || selectedLessonsCount === 0 || !canGenerate}
      >
        {generatingTest ? (
          <>
            <FiLoader className="spin" /> {t('courseEdit.generatingTest')}
          </>
        ) : (
          <>
            <FiCheckSquare /> {t('courseEdit.generateTest')}
          </>
        )}
      </button>
    </div>
    </aside>
  )
}

export default GenerationScenarios
