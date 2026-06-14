import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'

const QuizSection = ({ isTeacherRole, collection, onCollectionChange, onSubmit, quiz }) => {
  const { t } = useTranslation()
  const { data, loading, answers, answeredQuestions, hintsVisible, checked, score } = quiz

  return (
    <div className="col gap12">
      <div className="sec-head" style={{ padding: 0, border: 'none', marginBottom: 4 }}>
        <h3 className="h3 row gap8">
          <Icon name="target" size={16} />
          {isTeacherRole ? t('ragPage.createQuiz') : t('ragPage.quiz')}
        </h3>
      </div>
      <form onSubmit={onSubmit} className="col gap12">
        <div className="field">
          <label className="label" htmlFor="rag-quiz-collection">{t('ragPage.collection')}</label>
          <input
            id="rag-quiz-collection"
            className="input"
            type="text"
            value={collection}
            onChange={(e) => onCollectionChange(e.target.value)}
            placeholder=""
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Spinner size={16} color="#fff" /> : <Icon name="sparkles" size={16} />}
          {loading ? t('common.loading') : t('ragPage.generateQuiz')}
        </button>
      </form>

      {data && (
        <div className="rag-out-academis">
          {data.error ? (
            <div className="error">{data.error}</div>
          ) : (
            <>
              {(data.questions || []).map((q, i) => {
                const answered = answeredQuestions.has(i)
                const userAnswer = answers['q' + i]
                const isCorrect = userAnswer === q.correct
                return (
                  <div
                    key={i}
                    className={`rag-quiz-item${answered ? (isCorrect ? ' correct' : ' incorrect') : ''}`}
                  >
                    <p style={{ fontWeight: 650, marginBottom: 8 }}>
                      {i + 1}. {q.question}
                    </p>
                    {q.hint != null && q.hint !== '' && (
                      <div style={{ marginBottom: 8 }}>
                        {!hintsVisible.has(i) ? (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => quiz.showHint(i)}>
                            {t('ragPage.hint')}
                          </button>
                        ) : (
                          <p className="muted" style={{ fontSize: 13 }}>{q.hint}</p>
                        )}
                      </div>
                    )}
                    <div className="col gap8">
                      {['A', 'B', 'C', 'D'].filter((k) => q.options?.[k]).map((k) => (
                        <label key={k} className={`quiz-opt${userAnswer === k ? ' sel' : ''}`}>
                          <input
                            type="radio"
                            name={`q${i}`}
                            value={k}
                            checked={userAnswer === k}
                            onChange={() => quiz.answerQuestion(i, k)}
                            disabled={answered}
                          />
                          <span>{q.options[k]}</span>
                        </label>
                      ))}
                    </div>
                    {answered && (
                      <div style={{ marginTop: 10, fontSize: 13 }}>
                        {isCorrect ? (
                          <span style={{ color: 'var(--green-600)', fontWeight: 700 }}>{t('ragPage.correct')}</span>
                        ) : (
                          <span style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('ragPage.incorrect')}</span>
                        )}
                        <p className="muted" style={{ marginTop: 4 }}>
                          {t('ragPage.rightAnswer', { answer: q.options?.[q.correct] ?? q.correct })}
                        </p>
                        {q.explanation && <p className="muted">{q.explanation}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
              {data.questions?.length && !checked && (
                <button type="button" className="btn btn-primary btn-block" onClick={quiz.finish}>
                  {t('ragPage.finishQuiz')}
                </button>
              )}
              {score != null && (
                <div
                  className="card card-pad"
                  style={{
                    marginTop: 12,
                    textAlign: 'center',
                    background: score.pct >= 60 ? 'color-mix(in srgb, var(--green-500) 10%, var(--surface))' : 'var(--brand-tint)',
                  }}
                >
                  <strong>
                    {t('ragPage.result', { correct: score.correct, total: score.total, pct: score.pct })}
                  </strong>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default QuizSection
