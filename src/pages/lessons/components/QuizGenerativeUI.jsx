import React, { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

function QuizGenerativeUI({ result, theme = {}, onClose }) {
  const { t } = useTranslation()
  const questions = result?.questions || []
  const primary = theme.primary || '#e41616'
  const accent = theme.accent || '#dc8a95'
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(null)
  const [hintsVisible, setHintsVisible] = useState({})

  const handleAnswer = (i, key) => {
    if (checked) return
    setAnswers(prev => ({ ...prev, [i]: key }))
  }

  const toggleHint = (i) => {
    setHintsVisible(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const handleFinish = () => {
    if (!questions.length) return
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++
    })
    setScore({ correct, total: questions.length, pct: Math.round((correct / questions.length) * 100) })
    setChecked(true)
  }

  if (result?.status === 'error') {
    return <div className="quiz-gen-error">{result.message || t('ragPage.generationError')}</div>
  }

  if (!questions.length) return null

  return (
    <div className="quiz-generative-ui" style={{ '--theme-primary': primary, '--theme-accent': accent }}>
      <div className="quiz-gen-header">
        <div className="quiz-gen-header-text">
          <h3>{t('lessonChat.lessonQuiz')}</h3>
          {result?.lesson_title && <span>{result.lesson_title}</span>}
        </div>
        {onClose && (
          <button type="button" className="quiz-gen-header-close" onClick={onClose} title={t('lessonChat.hideQuiz')} aria-label={t('lessonChat.hideQuiz')}>
            <FiX />
          </button>
        )}
      </div>
      {questions.map((q, i) => (
        <div key={i} className={`quiz-gen-item ${checked ? (answers[i] === q.correct ? 'correct' : 'incorrect') : ''}`}>
          <p className="quiz-gen-question">{i + 1}. {q.question}</p>
          {q.hint != null && q.hint !== '' && (
            <div className="quiz-gen-hint-block">
              {!hintsVisible[i] ? (
                <button type="button" className="quiz-gen-hint-btn" onClick={() => toggleHint(i)}>
                  {t('lessonChat.showHint')}
                </button>
              ) : (
                <p className="quiz-gen-hint-text">{q.hint}</p>
              )}
            </div>
          )}
          <div className="quiz-gen-options">
            {['A', 'B', 'C', 'D'].filter(k => q.options?.[k]).map(k => (
              <label key={k}>
                <input
                  type="radio"
                  name={`q${i}`}
                  value={k}
                  checked={answers[i] === k}
                  onChange={() => handleAnswer(i, k)}
                  disabled={checked}
                />
                {q.options[k]}
              </label>
            ))}
          </div>
          {checked && (
            <div className="quiz-gen-feedback">
              {answers[i] === q.correct ? (
                <span className="correct">{t('lessonChat.right')}</span>
              ) : (
                <span className="incorrect">{t('lessonChat.correctAnswer', { answer: q.options?.[q.correct] })}</span>
              )}
              {q.explanation && <p className="quiz-gen-explanation">{q.explanation}</p>}
            </div>
          )}
        </div>
      ))}
      {!checked && (
        <button className="quiz-gen-finish" onClick={handleFinish}>
          {t('lessonChat.finishTest')}
        </button>
      )}
      {score != null && (
        <div className="quiz-gen-result-row">
          <div className={`quiz-gen-score ${score.pct >= 60 ? 'good' : 'bad'}`}>
            {t('ragPage.result', { correct: score.correct, total: score.total, pct: score.pct })}
          </div>
          {onClose && (
            <button type="button" className="quiz-gen-close" onClick={onClose}>
              {t('lessonChat.hideQuiz')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default QuizGenerativeUI
