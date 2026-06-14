import React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { Icon, Spinner } from '@/shared/ui/academis'
import { useCourseEdit } from './hooks/useCourseEdit'
import { useLessonGeneration } from './hooks/useLessonGeneration'
import { useAiModels } from './hooks/useAiModels'
import { useLocalizationBackfill } from './hooks/useLocalizationBackfill'
import CourseEditHeader from './components/CourseEditHeader'
import CourseSourcesSidebar from './components/CourseSourcesSidebar'
import GenerationStepsTrack from './components/GenerationStepsTrack'
import LessonOutlinePlanner from './components/LessonOutlinePlanner'
import GenerationScenarios from './components/GenerationScenarios'
import GenerationJobBanner from './components/GenerationJobBanner'
import AiModelPicker from './components/AiModelPicker'
import GenerationUsageSummary from './components/GenerationUsageSummary'
import TeacherAiLimitBanner from './components/TeacherAiLimitBanner'
import CourseContentOverview from './components/CourseContentOverview'
import './CourseEdit.css'

const STUDIO_STAT_COLORS = {
  files: 'var(--blue-500, #3b82f6)',
  list: 'var(--violet-500, #8b5cf6)',
  book: 'var(--brand)',
  target: 'var(--green-500, #22c55e)',
}

const CourseEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const aiModels = useAiModels()
  const edit = useCourseEdit(id, {
    buildGenerationExtras: aiModels.buildGenerationExtras,
    onUsageSummary: aiModels.setLastUsageSummary,
    canGenerate: aiModels.canGenerate,
  })
  const generation = useLessonGeneration({
    courseId: id,
    onLessonsChanged: edit.loadData,
    setError: edit.setError,
    buildGenerationExtras: aiModels.buildGenerationExtras,
    onUsageSummary: aiModels.setLastUsageSummary,
    canGenerate: aiModels.canGenerate,
  })
  const backfill = useLocalizationBackfill({
    courseId: id,
    onCompleted: edit.loadData,
    setError: edit.setError,
  })
  if (edit.loading) {
    return (
      <div className="course-edit-loading">
        <Spinner size={32} />
        <p>{t('courseEdit.loading')}</p>
      </div>
    )
  }

  if (!edit.course) {
    return <div className="course-edit-error">{t('courseEdit.notFound')}</div>
  }

  if (!canUpload(auth)) {
    return <div className="course-edit-error">{t('courseEdit.forbidden')}</div>
  }

  const genActiveStep =
    generation.lessonsJobId
      ? 4
      : generation.outlineLoading
        ? 3
        : generation.outlineDraft?.length
          ? 3
          : generation.selectedFileIds.size > 0
            ? 2
            : 1

  const studioStats = [
    ['files', t('studio.materials'), generation.selectedFileIds.size],
    ['list', t('studio.plan'), generation.outlineDraft?.length ?? 0],
    ['book', t('coursePage.lessons'), edit.lessons.length],
    ['target', t('coursePage.tests'), edit.tests.length],
  ]

  return (
    <div className="studio course-edit">
      <CourseSourcesSidebar
        courseId={id}
        course={edit.course}
        urlInput={edit.urlInput}
        onUrlInputChange={edit.setUrlInput}
        ingestingUrl={edit.ingestingUrl}
        onIngestUrl={edit.handleIngestUrl}
        uploading={edit.uploading}
        onFileUpload={edit.handleFileUpload}
        courseFiles={edit.courseFiles}
        selectedFileIds={generation.selectedFileIds}
        onToggleFile={generation.toggleFileSelection}
        onDeleteFile={edit.handleDeleteFile}
      />

      <div className="studio-main course-edit-main">
        <div className="studio-main-inner">
          <CourseEditHeader
            courseId={id}
            backfillSummary={backfill.backfillSummary}
            backfillingLocales={backfill.backfillingLocales}
            backfillActiveLang={backfill.backfillActiveLang}
            backfillJobId={backfill.backfillJobId}
            backfillJob={backfill.backfillJob}
            onBackfill={backfill.handleBackfillLocalizations}
            deletingCourse={edit.deletingCourse}
            onDeleteCourse={edit.handleDeleteCourse}
          />

          {edit.error && (
            <div className="course-edit-error-banner courses-flash courses-flash--error">
              {edit.error}
            </div>
          )}

          <div className="studio-stats">
            {studioStats.map(([iconName, label, value]) => (
              <div key={label} className="studio-stat">
                <span
                  className="ss-ic"
                  style={{
                    background: `color-mix(in srgb, ${STUDIO_STAT_COLORS[iconName]} 12%, var(--surface))`,
                    color: STUDIO_STAT_COLORS[iconName],
                  }}
                >
                  <Icon name={iconName} size={17} />
                </span>
                <div>
                  <div className="mono" style={{ fontWeight: 800, fontSize: 18 }}>
                    {value}
                  </div>
                  <div className="dim" style={{ fontSize: 11 }}>
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <TeacherAiLimitBanner limit={aiModels.userLimit} loading={aiModels.loading} />

          {generation.lessonsJobId && (
            <GenerationJobBanner
              jobStatus={generation.jobStatus}
              jobProgress={generation.jobProgress}
            />
          )}

          <div className="row between wrap gap12" style={{ marginTop: 4 }}>
            <GenerationStepsTrack
              activeStep={genActiveStep}
              hasFiles={generation.selectedFileIds.size > 0}
              hasOutline={!!generation.outlineDraft?.length}
              lessonsReady={edit.lessons.length > 0 && !generation.lessonsJobId}
            />
            {aiModels.modelSelectionEnabled && (
              <AiModelPicker
                compact
                models={aiModels.models}
                loading={aiModels.loading}
                loadError={aiModels.loadError}
                selectedModelId={aiModels.selectedModelId}
                onSelect={aiModels.setSelectedModelId}
                selectedModel={aiModels.selectedModel}
              />
            )}
          </div>

          <LessonOutlinePlanner
            genParams={generation.genParams}
            onParamChange={generation.updateGenParam}
            selectedFilesCount={generation.selectedFileIds.size}
            outlineDraft={generation.outlineDraft}
            outlineLoading={generation.outlineLoading}
            onGenerateOutline={generation.handleGenerateOutline}
            onUpdateRow={generation.updateOutlineRow}
            onMoveRow={generation.moveOutlineRow}
            onRemoveRow={generation.removeOutlineRow}
            onAddRow={generation.addOutlineRow}
            approving={generation.generatingLessons}
            jobActive={generation.lessonsJobId}
            onApprove={generation.handleApproveLessonsJob}
            canGenerate={aiModels.canGenerate}
          />

          <GenerationScenarios
            testTitle={edit.testTitle}
            onTestTitleChange={edit.setTestTitle}
            questionCount={edit.questionCount}
            onQuestionCountChange={edit.setQuestionCount}
            testDifficulty={edit.testDifficulty}
            onTestDifficultyChange={edit.setTestDifficulty}
            generatingTest={edit.generatingTest}
            selectedLessonsCount={edit.selectedLessonIds.size}
            onGenerateTest={edit.handleGenerateTest}
            canGenerate={aiModels.canGenerate}
          />

          <GenerationUsageSummary
            summary={aiModels.lastUsageSummary}
            models={aiModels.models}
          />

          <CourseContentOverview
            courseId={id}
            course={edit.course}
            lessons={edit.lessons}
            selectedLessonIds={edit.selectedLessonIds}
            onToggleLesson={edit.toggleLessonSelection}
            tests={edit.tests}
            testMaxAttemptsDraft={edit.testMaxAttemptsDraft}
            testDueAtDraft={edit.testDueAtDraft}
            savingTestSettings={edit.savingTestSettings}
            onMaxAttemptsChange={edit.updateTestMaxAttemptsDraft}
            onDueAtChange={edit.updateTestDueAtDraft}
            onSaveTestSettings={edit.saveTestSettings}
          />
        </div>
      </div>
    </div>
  )
}

export default CourseEdit
