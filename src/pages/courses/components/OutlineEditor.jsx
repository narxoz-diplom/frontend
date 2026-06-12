import React from 'react'
import { FiPlus, FiTrash2, FiZap, FiLoader } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const OutlineEditor = ({
  outline,
  onUpdateRow,
  onMoveRow,
  onRemoveRow,
  onAddRow,
  approving,
  jobActive,
  onApprove,
  canGenerate = true
}) => {
  const { t } = useTranslation()

  return (
    <div className="outline-editor">
      <div className="outline-editor__head">
        <h5>{t('courseEdit.coursePlan')}</h5>
        <p className="outline-editor__hint">
          {t('courseEdit.coursePlanHint')}
        </p>
      </div>
      <ul className="outline-list">
        {outline.map((row, idx) => (
          <li key={row.id ?? `outline-${idx}`} className="outline-row">
            <div className="outline-row__toolbar">
              <label className="outline-row__check">
                <input
                  type="checkbox"
                  checked={row.include !== false}
                  onChange={(e) => onUpdateRow(idx, 'include', e.target.checked)}
                />
                <span>{t('courseEdit.include')}</span>
              </label>
              <span className="outline-row__idx">#{idx + 1}</span>
              <div className="outline-row__move">
                <button
                  type="button"
                  className="btn btn-outline outline-move-btn"
                  onClick={() => onMoveRow(idx, -1)}
                  disabled={idx === 0}
                  aria-label={t('courseEdit.moveUp')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-outline outline-move-btn"
                  onClick={() => onMoveRow(idx, 1)}
                  disabled={idx === outline.length - 1}
                  aria-label={t('courseEdit.moveDown')}
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                className="btn-icon danger outline-row__remove"
                onClick={() => onRemoveRow(idx)}
                disabled={outline.length <= 1}
                title={
                  outline.length <= 1
                    ? t('courseEdit.cannotDeleteLast')
                    : t('courseEdit.deletePlanItem')
                }
                aria-label={t('courseEdit.deletePlanItem')}
              >
                <FiTrash2 aria-hidden />
              </button>
            </div>
            <input
              className="gen-input outline-title-input"
              value={row.title ?? ''}
              onChange={(e) => onUpdateRow(idx, 'title', e.target.value)}
              aria-label={t('courseEdit.lessonTitleAria', { index: idx + 1 })}
            />
            <textarea
              className="gen-textarea outline-summary-input"
              rows={4}
              value={row.summary ?? ''}
              onChange={(e) => onUpdateRow(idx, 'summary', e.target.value)}
              placeholder={t('courseEdit.lessonGoalsPlaceholder')}
              aria-label={t('courseEdit.lessonGoalsAria', { index: idx + 1 })}
            />
          </li>
        ))}
      </ul>
      <div className="outline-editor__footer-actions">
        <button
          type="button"
          className="btn btn-outline gen-cta"
          onClick={onAddRow}
        >
          <FiPlus aria-hidden /> {t('courseEdit.addLessonToPlan')}
        </button>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-lg gen-cta gen-cta--wide"
        onClick={onApprove}
        disabled={approving || jobActive || !canGenerate}
      >
        {approving ? (
          <>
            <FiLoader className="spin" /> {t('courseEdit.startingBackground')}
          </>
        ) : (
          <>
            <FiZap /> {t('courseEdit.approvePlan')}
          </>
        )}
      </button>
      <p className="gen-footnote">
        {t('courseEdit.backgroundHint')}
      </p>
    </div>
  )
}

export default OutlineEditor
