import { parseOptions } from '@/pages/lessons/lib/testOptions'
import { pickLocalized } from '@/i18n/localize'

const nextOptionKey = (options) => {
  const used = new Set((options || []).map((opt) => String(opt.key).toUpperCase()))
  for (let code = 65; code <= 90; code += 1) {
    const key = String.fromCharCode(code)
    if (!used.has(key)) return key
  }
  return String((options?.length ?? 0) + 1)
}

export const createEmptyQuestionDraft = (orderNumber = 1) => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  id: null,
  type: 'MULTIPLE_CHOICE',
  text: '',
  options: [
    { key: 'A', label: '' },
    { key: 'B', label: '' },
    { key: 'C', label: '' },
    { key: 'D', label: '' },
  ],
  correctAnswer: 'A',
  explanation: '',
  hint: '',
  orderNumber,
})

export const questionToDraft = (question, index = 0) => {
  const parsedOptions = parseOptions(pickLocalized(question, 'options') || question.options)
  const options = parsedOptions.length > 0
    ? parsedOptions
    : createEmptyQuestionDraft(index + 1).options

  return {
    localId: question.id != null ? String(question.id) : `new-${index}`,
    id: question.id ?? null,
    type: question.type || 'MULTIPLE_CHOICE',
    text: question.text || pickLocalized(question, 'text') || '',
    options,
    correctAnswer: question.correctAnswer || options[0]?.key || 'A',
    explanation: question.explanation || '',
    hint: question.hint || '',
    orderNumber: question.orderNumber ?? index + 1,
  }
}

export const testToDraft = (test) => {
  const sortedQuestions = [...(test?.questions || [])].sort(
    (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0),
  )

  return {
    title: test?.title || '',
    maxAttempts: test?.maxAttempts == null ? '' : String(test.maxAttempts),
    dueAt: test?.dueAt ? String(test.dueAt).slice(0, 10) : '',
    questions: sortedQuestions.length > 0
      ? sortedQuestions.map((q, idx) => questionToDraft(q, idx))
      : [createEmptyQuestionDraft()],
  }
}

export const optionsToJson = (options) => {
  const obj = {}
  for (const opt of options || []) {
    const key = String(opt.key || '').trim()
    const label = String(opt.label || '').trim()
    if (key && label) {
      obj[key] = label
    }
  }
  return JSON.stringify(obj)
}

export const draftToUpdatePayload = (draft) => {
  const maxAttemptsRaw = draft.maxAttempts == null ? '' : String(draft.maxAttempts).trim()
  const maxAttempts = maxAttemptsRaw === '' ? null : Number(maxAttemptsRaw)
  const dueAt = draft.dueAt == null || String(draft.dueAt).trim() === ''
    ? null
    : `${String(draft.dueAt).trim()}T23:59`

  return {
    title: String(draft.title || '').trim(),
    maxAttempts: Number.isFinite(maxAttempts) ? maxAttempts : null,
    dueAt,
    questions: (draft.questions || []).map((q, idx) => ({
      id: q.id ?? undefined,
      type: q.type || 'MULTIPLE_CHOICE',
      text: String(q.text || '').trim(),
      options: optionsToJson(q.options),
      correctAnswer: String(q.correctAnswer || '').trim(),
      explanation: String(q.explanation || '').trim() || null,
      hint: String(q.hint || '').trim() || null,
      orderNumber: idx + 1,
    })),
  }
}

export const addOptionToQuestion = (question) => {
  const key = nextOptionKey(question.options)
  return {
    ...question,
    options: [...(question.options || []), { key, label: '' }],
  }
}

export const removeOptionFromQuestion = (question, optionKey) => {
  const nextOptions = (question.options || []).filter((opt) => opt.key !== optionKey)
  const nextCorrect = question.correctAnswer === optionKey
    ? (nextOptions[0]?.key || '')
    : question.correctAnswer

  return {
    ...question,
    options: nextOptions,
    correctAnswer: nextCorrect,
  }
}

export const validateTestDraft = (draft, t) => {
  if (!String(draft.title || '').trim()) {
    return t('testEditPage.titleRequired')
  }

  const questions = draft.questions || []
  if (questions.length === 0) {
    return t('testEditPage.questionsRequired')
  }

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i]
    if (!String(q.text || '').trim()) {
      return t('testEditPage.questionTextRequired', { number: i + 1 })
    }
    if (String(q.text || '').trim().length < 10) {
      return t('testEditPage.questionTextTooShort', { number: i + 1 })
    }
    const filledOptions = (q.options || []).filter((opt) => String(opt.label || '').trim())
    if (filledOptions.length < 2) {
      return t('testEditPage.optionsRequired', { number: i + 1 })
    }
    if (!String(q.correctAnswer || '').trim()) {
      return t('testEditPage.correctRequired', { number: i + 1 })
    }
    const hasCorrect = filledOptions.some((opt) => opt.key === q.correctAnswer)
    if (!hasCorrect) {
      return t('testEditPage.correctInvalid', { number: i + 1 })
    }
  }

  const maxAttemptsRaw = draft.maxAttempts == null ? '' : String(draft.maxAttempts).trim()
  if (maxAttemptsRaw !== '') {
    const maxAttempts = Number(maxAttemptsRaw)
    if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
      return t('courseEdit.testMaxAttemptsInvalid')
    }
  }

  return null
}
