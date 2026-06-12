import React from 'react'
import { FiHelpCircle } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const QuizSection = ({ isTeacherRole, collection, onCollectionChange, onSubmit, quiz }) => {
  const { t } = useTranslation()
  const { data, loading, answers, answeredQuestions, hintsVisible, checked, score } = quiz

  return (
    <section className="rag-card">
      <h2><FiHelpCircle /> {isTeacherRole ? t('ragPage.createQuiz') : t('ragPage.quiz')}</h2>
      <form onSubmit={onSubmit}>
        <label>{t('ragPage.collection')}</label>
        <input
          type="text"
          value={collection}
          onChange={(e) => onCollectionChange(e.target.value)}
          placeholder="default"
        />
        <button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('ragPage.generateQuiz')}
        </button>
      </form>
      {data && (
        <div className="rag-out text">
          {data.error ? (
            data.error
          ) : (
            <>
              {(data.questions || []).map((q, i) => {
                const answered = answeredQuestions.has(i)
                const userAnswer = answers['q' + i]
                const isCorrect = userAnswer === q.correct
                return (
                  <div
                    key={i}
                    className={`quiz-item ${answered ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                  >
                    <p><strong>{i + 1}. {q.question}</strong></p>
                    {(q.hint != null && q.hint !== '') && (
                      <div className="quiz-hint-block">
                        {!hintsVisible.has(i) ? (
                          <button
                            type="button"
                            className="btn-quiz-hint"
                            onClick={() => quiz.showHint(i)}
                          >
                            {t('ragPage.hint')}
                          </button>
                        ) : (
                          <p className="quiz-hint-text">{q.hint}</p>
                        )}
                      </div>
                    )}
                    {['A', 'B', 'C', 'D'].filter(k => q.options?.[k]).map(k => (
                      <label key={k}>
                        <input
                          type="radio"
                          name={'q' + i}
                          value={k}
                          checked={userAnswer === k}
                          onChange={() => quiz.answerQuestion(i, k)}
                          disabled={answered}
                        />
                        {q.options[k]}
                      </label>
                    ))}
                    {answered && (
                      <div className="quiz-feedback">
                        {isCorrect ? (
                          <>
                            <p className="quiz-feedback-correct">{t('ragPage.correct')}</p>
                            <p className="correct-answer">{t('ragPage.rightAnswer', { answer: q.options?.[q.correct] ?? q.correct })}</p>
                            {q.explanation && <p className="quiz-explanation">{q.explanation}</p>}
                          </>
                        ) : (
                          <>
                            <p className="quiz-feedback-incorrect">{t('ragPage.incorrect')}</p>
                            <p className="quiz-your-answer">{t('ragPage.yourAnswer', { answer: userAnswer ? (q.options?.[userAnswer] ?? userAnswer) : '—' })}</p>
                            <p className="correct-answer">{t('ragPage.rightAnswer', { answer: q.options?.[q.correct] ?? q.correct })}</p>
                            {q.explanation && <p className="quiz-explanation">{q.explanation}</p>}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {data.questions?.length && !checked && (
                <button type="button" className="btn-finish-quiz" onClick={quiz.finish}>
                  {t('ragPage.finishQuiz')}
                </button>
              )}
              {score != null && (
                <div className={`quiz-result ${score.pct >= 60 ? 'good' : 'bad'}`}>
                  {t('ragPage.result', { correct: score.correct, total: score.total, pct: score.pct })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default QuizSection
