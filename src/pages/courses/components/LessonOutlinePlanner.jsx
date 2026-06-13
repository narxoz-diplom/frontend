import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'
import StudioMiniField from './StudioMiniField'
import OutlineEditor from './OutlineEditor'

const LANGUAGE_OPTIONS = [
  { value: 'ru', labelKey: 'studio.languageRu' },
  { value: 'en', labelKey: 'studio.languageEn' },
  { value: 'kz', labelKey: 'studio.languageKz' },
]

const DEPTH_OPTIONS = [
  { value: 'shallow', labelKey: 'studio.difficultyBeginner' },
  { value: 'medium', labelKey: 'studio.difficultyIntermediate' },
  { value: 'deep', labelKey: 'studio.difficultyAdvanced' },
]

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
  approving,
  jobActive,
  onApprove,
  canGenerate = true,
}) => {
  const { t } = useTranslation()
  const lessonCount = Number(genParams.minLessons) || 5
  const hasOutline = outlineDraft?.length > 0
  const contentLanguage = genParams.contentLanguage || 'ru'

  const setLessonCount = (next) => {
    const value = Math.min(12, Math.max(1, next))
    onParamChange('minLessons', value)
    onParamChange('maxLessons', Math.min(30, value + 3))
  }

  return (
    <div className="card" style={{ marginTop: 4 }}>
      <div className="sec-head">
        <div className="row gap8" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--violet-500)' }}>
            <Icon name="list" size={18} />
          </span>
          <h3 className="h3">{t('studio.outlinePlanner')}</h3>
        </div>
        {hasOutline && (
          <span className="badge badge-violet">
            {t('studio.lessonCountBadge', { count: outlineDraft.length })}
          </span>
        )}
      </div>

      <div style={{ padding: '4px 18px 18px' }}>
        <div className="outline-params">
          <StudioMiniField label={t('studio.language')}>
            <select
              className="select"
              style={{ height: 38 }}
              value={contentLanguage}
              onChange={(e) => onParamChange('contentLanguage', e.target.value)}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </StudioMiniField>

          <StudioMiniField label={t('studio.lessonCount')}>
            <div className="stepper">
              <button type="button" onClick={() => setLessonCount(lessonCount - 1)}>
                −
              </button>
              <span className="mono">{lessonCount}</span>
              <button type="button" onClick={() => setLessonCount(lessonCount + 1)}>
                +
              </button>
            </div>
          </StudioMiniField>

          <StudioMiniField label={t('studio.difficulty')}>
            <select
              className="select"
              style={{ height: 38 }}
              value={genParams.depth}
              onChange={(e) => onParamChange('depth', e.target.value)}
            >
              {DEPTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </StudioMiniField>

          <button
            type="button"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-end', height: 38 }}
            onClick={onGenerateOutline}
            disabled={outlineLoading || selectedFilesCount === 0 || !canGenerate}
          >
            {outlineLoading ? (
              <Spinner color="#fff" size={16} />
            ) : (
              <Icon name="sparkles" size={16} />
            )}
            {t('studio.genOutline')}
          </button>
        </div>

        <details className="studio-advanced-params">
          <summary>{t('studio.advancedParams')}</summary>
          <div className="col gap10" style={{ marginTop: 10 }}>
            <label className="field">
              <span className="label">{t('courseEdit.courseWishes')}</span>
              <textarea
                className="textarea"
                rows={2}
                value={genParams.teacherBrief}
                onChange={(e) => onParamChange('teacherBrief', e.target.value)}
                placeholder={t('courseEdit.courseWishesPlaceholder')}
              />
            </label>
            <div className="row gap10 wrap">
              <StudioMiniField label={t('courseEdit.audience')} style={{ minWidth: 140 }}>
                <select
                  className="select"
                  style={{ height: 38 }}
                  value={genParams.targetAudience}
                  onChange={(e) => onParamChange('targetAudience', e.target.value)}
                >
                  <option value="school">{t('courseEdit.audienceSchool')}</option>
                  <option value="bachelor">{t('courseEdit.audienceBachelor')}</option>
                  <option value="pro">{t('courseEdit.audiencePro')}</option>
                </select>
              </StudioMiniField>
              <StudioMiniField label={t('courseEdit.contextSource')} style={{ minWidth: 180 }}>
                <select
                  className="select"
                  style={{ height: 38 }}
                  value={genParams.retrievalMode}
                  onChange={(e) => onParamChange('retrievalMode', e.target.value)}
                >
                  <option value="full_collection">{t('courseEdit.contextAll')}</option>
                  <option value="semantic">{t('courseEdit.contextSemantic')}</option>
                </select>
              </StudioMiniField>
            </div>
            {genParams.retrievalMode === 'semantic' && (
              <label className="field">
                <span className="label">{t('courseEdit.retrievalQuery')}</span>
                <input
                  className="input"
                  style={{ height: 38 }}
                  value={genParams.retrievalQuery}
                  onChange={(e) => onParamChange('retrievalQuery', e.target.value)}
                  placeholder={t('courseEdit.retrievalQueryPlaceholder')}
                />
              </label>
            )}
          </div>
        </details>

        {outlineLoading && (
          <div className="outline-loading">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 40, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {!outlineLoading && !hasOutline && (
          <div className="outline-empty">
            <Icon name="list" size={26} style={{ color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginTop: 6 }}>{t('studio.outlineEmptyTitle')}</div>
            <div className="dim" style={{ fontSize: 12.5 }}>
              {selectedFilesCount === 0
                ? t('studio.outlineEmptyNoFiles')
                : t('studio.outlineEmptyHint')}
            </div>
          </div>
        )}

        {hasOutline && !outlineLoading && (
          <>
            <OutlineEditor
              outline={outlineDraft}
              onUpdateRow={onUpdateRow}
              onMoveRow={onMoveRow}
              onRemoveRow={onRemoveRow}
              onAddRow={onAddRow}
            />
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 12 }}
              onClick={onApprove}
              disabled={approving || jobActive || !canGenerate}
            >
              {approving ? (
                <Spinner size={17} color="#fff" />
              ) : (
                <Icon name="sparkles" size={17} />
              )}
              {approving ? t('courseEdit.startingBackground') : t('studio.startGen')}
            </button>
            <p className="dim" style={{ fontSize: 12, marginTop: 8 }}>
              {t('courseEdit.backgroundHint')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default LessonOutlinePlanner
