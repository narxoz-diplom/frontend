import React, { useState, useMemo, useEffect } from 'react'
import auth from '@/shared/config/auth'
import { isTeacher } from '@/shared/lib/roles'
import { useTranslation } from 'react-i18next'
import { PageHeader, Icon, Spinner, EmptyState } from '@/shared/ui/academis'
import IngestSection from './components/IngestSection'
import ModuleSection from './components/ModuleSection'
import SummarySection from './components/SummarySection'
import QuizSection from './components/QuizSection'
import ExamSection from './components/ExamSection'
import { useRagGeneration } from './hooks/useRagGeneration'
import { useQuiz } from './hooks/useQuiz'
import './RAG.css'

const TAB_ICONS = {
  ingest: 'upload',
  module: 'doc',
  summary: 'message',
  quiz: 'target',
  exam: 'edit',
}

function RagResultPanel({ loading, result, quiz, selectedFunction, t }) {
  if (selectedFunction === 'quiz') {
    if (quiz.loading) {
      return (
        <div className="col gap8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      )
    }
    if (!quiz.data) {
      return (
        <EmptyState
          icon="sparkles"
          title={t('ragPage.resultPlaceholder')}
          desc={t('ragPage.resultHint')}
        />
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="col gap8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    )
  }

  if (!result) {
    return (
      <EmptyState
        icon="sparkles"
        title={t('ragPage.resultPlaceholder')}
        desc={t('ragPage.resultHint')}
      />
    )
  }

  if (result.error) {
    return <div className="rag-out-academis error">{result.error}</div>
  }

  if (selectedFunction === 'ingest') {
    return (
      <div className="rag-out-academis success fade-up">
        {t('ragPage.uploadedChunks', {
          chunks: result.chunks_count,
          document: result.document_id,
          collection: result.collection_name,
        })}
      </div>
    )
  }

  if (selectedFunction === 'module') {
    return (
      <div className="rag-out-academis fade-up markdown">
        <p>{result.module_text}</p>
        {result.chunks_used != null && (
          <p className="rag-meta-line">
            {t('ragPage.chunksUsed', { chunks: result.chunks_used, collection: result.collection_name })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rag-out-academis fade-up markdown">
      <p style={{ whiteSpace: 'pre-wrap' }}>{result.text}</p>
      {result.chunks_used != null && (
        <p className="rag-meta-line">
          {t('ragPage.chunksShort', { chunks: result.chunks_used, collection: result.collection_name })}
        </p>
      )}
    </div>
  )
}

const RAG = () => {
  const { t } = useTranslation()
  const isTeacherRole = useMemo(() => isTeacher(auth), [auth.token])
  const TEACHER_FUNCTIONS = useMemo(
    () => [
      { value: 'ingest', label: t('ragPage.ingest') },
      { value: 'module', label: t('ragPage.generateModule') },
      { value: 'summary', label: t('ragPage.createSummary') },
      { value: 'quiz', label: t('ragPage.quiz') },
      { value: 'exam', label: t('ragPage.examQuestions') },
    ],
    [t],
  )
  const STUDENT_FUNCTIONS = useMemo(
    () => [
      { value: 'summary', label: t('ragPage.getSummary') },
      { value: 'quiz', label: t('ragPage.takeQuiz') },
    ],
    [t],
  )
  const functions = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
  const [selectedFunction, setSelectedFunction] = useState(functions[0]?.value ?? 'ingest')

  useEffect(() => {
    const allowed = isTeacherRole ? TEACHER_FUNCTIONS : STUDENT_FUNCTIONS
    const valid = allowed.some((f) => f.value === selectedFunction)
    if (!valid && allowed.length) setSelectedFunction(allowed[0].value)
  }, [isTeacherRole, selectedFunction, TEACHER_FUNCTIONS, STUDENT_FUNCTIONS])

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
      prompt: prompt.trim() || t('ragPage.defaultModulePrompt'),
      collection_name: genCollection.trim() || undefined,
      top_k: topK,
    })
  }

  const handleSummary = (e) => {
    e.preventDefault()
    summary.generate({
      prompt: t('ragPage.defaultGeneratePrompt'),
      collection_name: summaryCollection.trim() || undefined,
      top_k: 8,
    })
  }

  const handleQuiz = (e) => {
    e.preventDefault()
    quiz.generate(quizCollection)
  }

  const handleExam = (e) => {
    e.preventDefault()
    exam.generate({
      prompt: t('ragPage.defaultGeneratePrompt'),
      collection_name: examCollection.trim() || undefined,
      top_k: 8,
    })
  }

  const activeResult = useMemo(() => {
    switch (selectedFunction) {
      case 'ingest':
        return { result: ingest.result, loading: ingest.loading }
      case 'module':
        return { result: moduleGen.result, loading: moduleGen.loading }
      case 'summary':
        return { result: summary.result, loading: summary.loading }
      case 'exam':
        return { result: exam.result, loading: exam.loading }
      default:
        return { result: null, loading: false }
    }
  }, [selectedFunction, ingest, moduleGen, summary, exam])

  const isQuizTab = selectedFunction === 'quiz'

  const renderForm = () => {
    const common = { hideResult: true }
    switch (selectedFunction) {
      case 'ingest':
        return (
          <IngestSection
            {...common}
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
        )
      case 'module':
        return (
          <ModuleSection
            {...common}
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
        )
      case 'summary':
        return (
          <SummarySection
            {...common}
            collection={summaryCollection}
            result={summary.result}
            loading={summary.loading}
            onCollectionChange={setSummaryCollection}
            onSubmit={handleSummary}
          />
        )
      case 'quiz':
        return (
          <QuizSection
            isTeacherRole={isTeacherRole}
            collection={quizCollection}
            onCollectionChange={setQuizCollection}
            onSubmit={handleQuiz}
            quiz={quiz}
          />
        )
      case 'exam':
        return (
          <ExamSection
            {...common}
            collection={examCollection}
            result={exam.result}
            loading={exam.loading}
            onCollectionChange={setExamCollection}
            onSubmit={handleExam}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="page page-wide rag-page-academis">
      <PageHeader
        title={t('ragPage.title')}
        subtitle={isTeacherRole ? t('ragPage.teacherSubtitle') : t('ragPage.studentSubtitle')}
        actions={(
          <span className={`badge ${isTeacherRole ? 'badge-red' : 'badge-draft'}`}>
            <Icon name={isTeacherRole ? 'sparkles' : 'book'} size={12} />
            {isTeacherRole ? t('ragPage.teacher') : t('ragPage.student')}
          </span>
        )}
      />

      <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {functions.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`tab${selectedFunction === f.value ? ' active' : ''}`}
            onClick={() => setSelectedFunction(f.value)}
          >
            <Icon name={TAB_ICONS[f.value] || 'sparkles'} size={15} />
            {f.label}
          </button>
        ))}
      </div>

      {isQuizTab ? (
        <div className="card card-pad">{renderForm()}</div>
      ) : (
        <div className="grid-2-1">
          <div className="card card-pad">{renderForm()}</div>
          <div className="card card-pad rag-result-panel">
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              {t('ragPage.resultTitle')}
            </div>
            <RagResultPanel
              loading={activeResult.loading}
              result={activeResult.result}
              quiz={quiz}
              selectedFunction={selectedFunction}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default RAG
