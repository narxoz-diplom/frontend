import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ragPost } from '@/shared/api/ragApi'

export const useQuiz = () => {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set())
  const [hintsVisible, setHintsVisible] = useState(new Set())
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(null)

  const computeScore = (currentAnswers) => {
    let correct = 0
    data.questions.forEach((q, i) => {
      if (currentAnswers['q' + i] === q.correct) correct++
    })
    const total = data.questions.length
    setScore({ correct, total, pct: total ? Math.round((correct / total) * 100) : 0 })
    setChecked(true)
  }

  const generate = async (collection) => {
    setLoading(true)
    setData(null)
    setChecked(false)
    setScore(null)
    setAnswers({})
    setAnsweredQuestions(new Set())
    setHintsVisible(new Set())
    try {
      const response = await ragPost('/generate-quiz-interactive', {
        prompt: 'Создай тест.',
        collection_name: collection.trim() || undefined,
        top_k: 8
      })
      setData(response.data)
    } catch (err) {
      setData({
        error: err.response?.data?.detail || err.message || t('ragPage.genericError')
      })
    } finally {
      setLoading(false)
    }
  }

  const answerQuestion = (questionIndex, optionKey) => {
    if (!data?.questions) return
    const nextAnswers = { ...answers, ['q' + questionIndex]: optionKey }
    setAnswers(nextAnswers)
    setAnsweredQuestions(prev => {
      const next = new Set([...prev, questionIndex])
      if (next.size === data.questions.length) {
        computeScore(nextAnswers)
      }
      return next
    })
  }

  const finish = () => {
    if (!data?.questions) return
    computeScore(answers)
  }

  const showHint = (questionIndex) => {
    setHintsVisible(prev => new Set([...prev, questionIndex]))
  }

  return {
    data,
    loading,
    answers,
    answeredQuestions,
    hintsVisible,
    checked,
    score,
    generate,
    answerQuestion,
    finish,
    showHint
  }
}
