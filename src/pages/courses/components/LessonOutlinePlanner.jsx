import React from 'react'
import { FiEdit3, FiPlus, FiLoader } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import OutlineEditor from './OutlineEditor'

const LessonOutlinePlanner = ({
  genParams,
  onParamChange,
  selectedFilesCount,
  outlineDraft,
  outlineLoading,
  onGenerateOutline,
  onUpdateRow,
  onMoveRow,
  onRemoveRow,
  onAddRow,
  generatingLessons,
  jobActive,
  onApprove
}) => {
  const { t } = useTranslation()

  return (
    <section className="generate-card gen-pipeline-card">
      <div className="gen-pipeline-card__head">
        <p className="gen-pipeline-card__eyebrow">{t('courseEdit.mainFlow')}</p>
        <h4 className="gen-pipeline-card__title">{t('courseEdit.mainFlowTitle')}</h4>
        <p className="gen-pipeline-card__subtitle">
          {t('courseEdit.mainFlowDesc')}
        </p>
      </div>

      <div className="gen-form-section">
        <span className="gen-form-section__label">{t('courseEdit.requestToModel')}</span>
        <div className="gen-params-grid gen-params-grid--primary">
        <label className="gen-field gen-field--full">
          <span className="gen-label">{t('courseEdit.courseWishes')}</span>
          <textarea
            className="gen-textarea"
            rows={3}
            value={genParams.teacherBrief}
            onChange={(e) => onParamChange('teacherBrief', e.target.value)}
            placeholder={t('courseEdit.courseWishesPlaceholder')}
          />
        </label>
      </div>
      </div>

      <div className="gen-form-section">
        <span className="gen-form-section__label">{t('courseEdit.courseParams')}</span>
        <div className="gen-params-grid">
        <label className="gen-field">
          <span className="gen-label">{t('courseEdit.audience')}</span>
          <select
            className="gen-select"
            value={genParams.targetAudience}
            onChange={(e) => onParamChange('targetAudience', e.target.value)}
          >
            <option value="school">{t('courseEdit.audienceSchool')}</option>
            <option value="bachelor">{t('courseEdit.audienceBachelor')}</option>
            <option value="pro">{t('courseEdit.audiencePro')}</option>
          </select>
        </label>
        <label className="gen-field">
          <span className="gen-label">{t('courseEdit.minLessons')}</span>
          <input
            type="number"
            min={1}
            max={30}
            className="gen-input"
            value={genParams.minLessons}
            onChange={(e) => onParamChange('minLessons', e.target.value)}
          />
        </label>
        <label className="gen-field">
          <span className="gen-label">{t('courseEdit.maxLessons')}</span>
          <input
            type="number"
            min={1}
            max={30}
            className="gen-input"
            value={genParams.maxLessons}
            onChange={(e) => onParamChange('maxLessons', e.target.value)}
          />
        </label>
        <label className="gen-field">
          <span className="gen-label">{t('courseEdit.depth')}</span>
          <select
            className="gen-select"
            value={genParams.depth}
            onChange={(e) => onParamChange('depth', e.target.value)}
          >
            <option value="shallow">{t('courseEdit.depthShallow')}</option>
            <option value="medium">{t('courseEdit.depthMedium')}</option>
            <option value="deep">{t('courseEdit.depthDeep')}</option>
          </select>
        </label>
        <label className="gen-field">
          <span className="gen-label">{t('courseEdit.contextSource')}</span>
          <select
            className="gen-select"
            value={genParams.retrievalMode}
            onChange={(e) => onParamChange('retrievalMode', e.target.value)}
          >
            <option value="full_collection">{t('courseEdit.contextAll')}</option>
            <option value="semantic">{t('courseEdit.contextSemantic')}</option>
          </select>
        </label>
        {genParams.retrievalMode === 'semantic' && (
          <label className="gen-field gen-field--full">
            <span className="gen-label">{t('courseEdit.retrievalQuery')}</span>
            <input
              className="gen-input"
              value={genParams.retrievalQuery}
              onChange={(e) => onParamChange('retrievalQuery', e.target.value)}
              placeholder={t('courseEdit.retrievalQueryPlaceholder')}
            />
          </label>
        )}
        </div>
      </div>

      <div className="gen-actions-row">
        <button
          type="button"
          className="btn btn-primary gen-cta"
          onClick={onGenerateOutline}
          disabled={outlineLoading || selectedFilesCount === 0}
        >
          {outlineLoading ? (
            <>
              <FiLoader className="spin" /> {t('courseEdit.buildOutline')}
            </>
          ) : (
            <>
              <FiEdit3 /> {t('courseEdit.generateOutline')}
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-outline gen-cta"
          onClick={onAddRow}
          disabled={outlineLoading}
          title={t('courseEdit.addManualItemTitle')}
        >
          <FiPlus aria-hidden /> {t('courseEdit.addManualItem')}
        </button>
        {selectedFilesCount === 0 && (
          <span className="gen-actions-hint">{t('courseEdit.selectFilesHint')}</span>
        )}
      </div>

      {outlineDraft && outlineDraft.length > 0 && (
        <OutlineEditor
          outline={outlineDraft}
          onUpdateRow={onUpdateRow}
          onMoveRow={onMoveRow}
          onRemoveRow={onRemoveRow}
          onAddRow={onAddRow}
          approving={generatingLessons}
          jobActive={jobActive}
          onApprove={onApprove}
        />
      )}
    </section>
  )
}

export default LessonOutlinePlanner
