import React, { useState, useMemo, useEffect } from 'react'
import { FiUpload, FiFileText, FiMessageSquare, FiHelpCircle, FiEdit3 } from 'react-icons/fi'
import auth from '@/shared/config/auth'
import { isTeacher } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import IngestSection from './components/IngestSection'
import ModuleSection from './components/ModuleSection'
import SummarySection from './components/SummarySection'
import QuizSection from './components/QuizSection'
import ExamSection from './components/ExamSection'
import { useRagGeneration } from './hooks/useRagGeneration'
import { useQuiz } from './hooks/useQuiz'
import './RAG.css'

const RAG = () => {
  const { t } = useTranslation()
  const isTeacherRole = useMemo(() => isTeacher(auth), [auth.token])
  const TEACHER_FUNCTIONS = useMemo(() => [
    { value: 'ingest', label: t('ragPage.ingest'), icon: FiUpload },
    { value: 'module', label: t('ragPage.generateModule'), icon: FiFileText },
    { value: 'summary', label: t('ragPage.createSummary'), icon: FiMessageSquare },
    { value: 'quiz', label: t('ragPage.quiz'), icon: FiHelpCircle },
    { value: 'exam', label: t('ragPage.examQuestions'), icon: FiEdit3 }
  ], [t])
  const STUDENT_FUNCTIONS = useMemo(() => [
    { value: 'summary', label: t('ragPage.getSummary'), icon: FiMessageSquare },
    { value: 'quiz', label: t('ragPage.takeQuiz'), icon: FiHelpCircle }
  ], [t])
  const functions = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
  const [selectedFunction, setSelectedFunction] = useState(functions[0]?.value ?? 'ingest')
  useEffect(() => {
    const allowed = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
    const valid = allowed.some(f => f.value === selectedFunction)
    if (!valid && allowed.length) setSelectedFunction(allowed[0].value)
  }, [isTeacherRole, selectedFunction])

  const [ingestFile, setIngestFile] = useState(null)
  const [ingestCollection, setIngestCollection] = useState('')
  const [ingestMetadata, setIngestMetadata] = useState('')
  const ingest = useRagGeneration('/ingest', 'ragPage.uploadError')

  const [prompt, setPrompt] = useState('')
  const [genCollection, setGenCollection] = useState('')
  const [topK, setTopK] = useState(8)
  const moduleGen = useRagGeneration('/generate-module', 'ragPage.generationError')

  const [summaryCollection, setSummaryCollection] = useState('')
  const summary = useRagGeneration('/generate-summary', 'ragPage.genericError')

  const [quizCollection, setQuizCollection] = useState('')
  const quiz = useQuiz()

  const [examCollection, setExamCollection] = useState('')
  const exam = useRagGeneration('/generate-exam-questions', 'ragPage.genericError')

  const handleIngest = (e) => {
    e.preventDefault()
    if (!ingestFile) {
      ingest.setResult({ error: t('ragPage.selectFile') })
      return
    }
    const formData = new FormData()
    formData.append('file', ingestFile)
    if (ingestCollection.trim()) formData.append('collection_name', ingestCollection.trim())
    if (ingestMetadata.trim()) formData.append('metadata', ingestMetadata.trim())
    ingest.generate(formData, { headers: { 'Content-Type': undefined } })
  }

  const handleGenerateModule = (e) => {
    e.preventDefault()
    moduleGen.generate({
      prompt: prompt.trim() || 'Создай обучающий модуль по загруженным материалам.',
      collection_name: genCollection.trim() || undefined,
      top_k: topK
    })
  }

  const handleSummary = (e) => {
    e.preventDefault()
    summary.generate({
      prompt: 'Сгенерируй по загруженным материалам.',
      collection_name: summaryCollection.trim() || undefined,
      top_k: 8
    })
  }

  const handleQuiz = (e) => {
    e.preventDefault()
    quiz.generate(quizCollection)
  }

  const handleExam = (e) => {
    e.preventDefault()
    exam.generate({
      prompt: 'Сгенерируй по загруженным материалам.',
      collection_name: examCollection.trim() || undefined,
      top_k: 8
    })
  }

  return (
    <div className="rag-page">
      <header className="rag-header">
        <h1>{t('ragPage.title')}</h1>
        <p className="rag-subtitle">
          {isTeacherRole
            ? t('ragPage.teacherSubtitle')
            : t('ragPage.studentSubtitle')}
        </p>
      </header>

      <div className="rag-toolbar">
        <span className={`rag-role-badge ${isTeacherRole ? 'teacher' : 'student'}`}>
          {isTeacherRole ? t('ragPage.teacher') : t('ragPage.student')}
        </span>
        <label className="rag-toolbar-label">{t('ragPage.function')}:</label>
        <select
          className="rag-function-select"
          value={selectedFunction}
          onChange={(e) => setSelectedFunction(e.target.value)}
          aria-label={t('ragPage.chooseFunction')}
        >
          {functions.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {selectedFunction === 'ingest' && (
        <IngestSection
          file={ingestFile}
          collection={ingestCollection}
          metadata={ingestMetadata}
          result={ingest.result}
          loading={ingest.loading}
          onFileSelect={setIngestFile}
          onCollectionChange={setIngestCollection}
          onMetadataChange={setIngestMetadata}
          onSubmit={handleIngest}
        />
      )}

      {selectedFunction === 'module' && (
        <ModuleSection
          prompt={prompt}
          collection={genCollection}
          topK={topK}
          result={moduleGen.result}
          loading={moduleGen.loading}
          onPromptChange={setPrompt}
          onCollectionChange={setGenCollection}
          onTopKChange={setTopK}
          onSubmit={handleGenerateModule}
        />
      )}

      {selectedFunction === 'summary' && (
        <SummarySection
          collection={summaryCollection}
          result={summary.result}
          loading={summary.loading}
          onCollectionChange={setSummaryCollection}
          onSubmit={handleSummary}
        />
      )}

      {selectedFunction === 'quiz' && (
        <QuizSection
          isTeacherRole={isTeacherRole}
          collection={quizCollection}
          onCollectionChange={setQuizCollection}
          onSubmit={handleQuiz}
          quiz={quiz}
        />
      )}

      {selectedFunction === 'exam' && (
        <ExamSection
          collection={examCollection}
          result={exam.result}
          loading={exam.loading}
          onCollectionChange={setExamCollection}
          onSubmit={handleExam}
        />
      )}
    </div>
  )
}

export default RAG
