import React from 'react'
import { useParams } from 'react-router-dom'
import { FiLoader } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import auth from '@/shared/config/auth'
import { canUpload } from '@/shared/lib/roles'
import { useCourseEdit } from './hooks/useCourseEdit'
import { useLessonGeneration } from './hooks/useLessonGeneration'
import { useAiModels } from './hooks/useAiModels'
import { useLocalizationBackfill } from './hooks/useLocalizationBackfill'
import { useAllowedEmails } from './hooks/useAllowedEmails'
import CourseEditHeader from './components/CourseEditHeader'
import CourseSourcesSidebar from './components/CourseSourcesSidebar'
import AllowedEmailsModal from './components/AllowedEmailsModal'
import GenerationJobBanner from './components/GenerationJobBanner'
import GenerationStepsTrack from './components/GenerationStepsTrack'
import LessonOutlinePlanner from './components/LessonOutlinePlanner'
import GenerationScenarios from './components/GenerationScenarios'
import AiModelPicker from './components/AiModelPicker'
import GenerationUsageSummary from './components/GenerationUsageSummary'
import TeacherAiLimitBanner from './components/TeacherAiLimitBanner'
import CourseContentOverview from './components/CourseContentOverview'
import './CourseEdit.css'

const CourseEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const aiModels = useAiModels()
  const edit = useCourseEdit(id, {
    buildGenerationExtras: aiModels.buildGenerationExtras,
    onUsageSummary: aiModels.setLastUsageSummary,
    canGenerate: aiModels.canGenerate
  })
  const generation = useLessonGeneration({
    courseId: id,
    onLessonsChanged: edit.loadData,
    setError: edit.setError,
    buildGenerationExtras: aiModels.buildGenerationExtras,
    onUsageSummary: aiModels.setLastUsageSummary,
    canGenerate: aiModels.canGenerate
  })
  const backfill = useLocalizationBackfill({
    courseId: id,
    onCompleted: edit.loadData,
    setError: edit.setError
  })
  const emails = useAllowedEmails({
    courseId: id,
    course: edit.course,
    setCourse: edit.setCourse
  })

  if (edit.loading) {
    return (
      <div className="course-edit-loading">
        <FiLoader className="spin" size={40} />
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
    generation.lessonsJobId || generation.quickGenLoading
      ? 4
      : generation.outlineLoading
        ? 3
        : generation.outlineDraft?.length
          ? 3
          : generation.selectedFileIds.size > 0
            ? 2
            : 1

  return (
    <div className="course-edit">
      <CourseEditHeader
        courseId={id}
        course={edit.course}
        backfillSummary={backfill.backfillSummary}
        backfillingLocales={backfill.backfillingLocales}
        backfillActiveLang={backfill.backfillActiveLang}
        backfillJobId={backfill.backfillJobId}
        backfillJob={backfill.backfillJob}
        onBackfill={backfill.handleBackfillLocalizations}
        deletingCourse={edit.deletingCourse}
        onDeleteCourse={edit.handleDeleteCourse}
      />

      {edit.error && <div className="course-edit-error-banner">{edit.error}</div>}

      <div className="course-edit-layout">
        <CourseSourcesSidebar
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
          allowedEmailsCount={edit.course?.allowedEmails?.length ?? 0}
          onOpenEmailsModal={emails.openEmailsModal}
        />

        {emails.showEmailsModal && (
          <AllowedEmailsModal
            allowedEmails={emails.allowedEmails}
            newEmailsText={emails.newEmailsText}
            onNewEmailsTextChange={emails.setNewEmailsText}
            error={emails.emailModalError}
            saving={emails.savingEmails}
            onAdd={emails.handleAddEmails}
            onRemove={emails.handleRemoveEmail}
            onSave={emails.handleSaveAllowedEmails}
            onClose={emails.closeEmailsModal}
          />
        )}

        <main className="course-edit-main gen-studio">
          {generation.lessonsJobId && (
            <GenerationJobBanner
              jobStatus={generation.jobStatus}
              jobProgress={generation.jobProgress}
            />
          )}

          <header className="gen-studio__intro">
            <p className="gen-studio__kicker">{t('courseEdit.contentGen')}</p>
            <h2 className="gen-studio__title">{t('courseEdit.buildCourse')}</h2>
            <p className="gen-studio__lead">
              {t('courseEdit.buildCourseDesc')}
            </p>
            <dl className="gen-studio__meta">
              <div>
                <dt>{t('courseEdit.materialsInContext')}</dt>
                <dd>{generation.selectedFileIds.size}</dd>
              </div>
              <div>
                <dt>{t('courseEdit.lessonsInCourse')}</dt>
                <dd>{edit.lessons.length}</dd>
              </div>
              <div>
                <dt>{t('courseEdit.outlineItems')}</dt>
                <dd>{generation.outlineDraft?.length ?? 0}</dd>
              </div>
            </dl>
          </header>

          <TeacherAiLimitBanner
            limit={aiModels.userLimit}
            loading={aiModels.loading}
          />

          {aiModels.modelSelectionEnabled && (
            <AiModelPicker
              models={aiModels.models}
              loading={aiModels.loading}
              loadError={aiModels.loadError}
              selectedModelId={aiModels.selectedModelId}
              onSelect={aiModels.setSelectedModelId}
              selectedModel={aiModels.selectedModel}
            />
          )}

          <GenerationUsageSummary
            summary={aiModels.lastUsageSummary}
            models={aiModels.models}
          />

          <GenerationStepsTrack
            activeStep={genActiveStep}
            hasFiles={generation.selectedFileIds.size > 0}
            hasOutline={!!generation.outlineDraft?.length}
            lessonsReady={edit.lessons.length > 0 && !generation.lessonsJobId}
          />

          <div className="gen-workspace">
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
              generatingLessons={generation.generatingLessons}
              jobActive={generation.lessonsJobId}
              onApprove={generation.handleApproveLessonsJob}
              canGenerate={aiModels.canGenerate}
            />

            <GenerationScenarios
              quickGenLoading={generation.quickGenLoading}
              selectedFilesCount={generation.selectedFileIds.size}
              onQuickGenerate={generation.handleQuickGenerateAllLessons}
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
          </div>

          <CourseContentOverview
            courseId={id}
            participants={edit.participants}
            lessons={edit.lessons}
            selectedLessonIds={edit.selectedLessonIds}
            onToggleLesson={edit.toggleLessonSelection}
            onDeleteLesson={edit.handleDeleteLesson}
            tests={edit.tests}
            testMaxAttemptsDraft={edit.testMaxAttemptsDraft}
            testDueAtDraft={edit.testDueAtDraft}
            savingTestSettings={edit.savingTestSettings}
            onMaxAttemptsChange={edit.updateTestMaxAttemptsDraft}
            onDueAtChange={edit.updateTestDueAtDraft}
            onSaveTestSettings={edit.saveTestSettings}
          />
        </main>
      </div>
    </div>
  )
}

export default CourseEdit
