import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'

const OutlineEditor = ({
  outline,
  onUpdateRow,
  onMoveRow,
  onRemoveRow,
  onAddRow,
}) => {
  const { t } = useTranslation()

  return (
    <div className="outline-table">
      {outline.map((row, idx) => (
        <div
          key={row.id ?? `outline-${idx}`}
          className="outline-row fade-up"
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          <button
            type="button"
            className={`ctx-check${row.include !== false ? ' on' : ''}`}
            onClick={() => onUpdateRow(idx, 'include', row.include === false)}
            title={t('courseEdit.include')}
            aria-pressed={row.include !== false}
          >
            {row.include !== false && <Icon name="check" size={12} />}
          </button>
          <span className="ol-num">{idx + 1}</span>
          <input
            className="ol-input"
            value={row.title ?? ''}
            onChange={(e) => onUpdateRow(idx, 'title', e.target.value)}
            aria-label={t('courseEdit.lessonTitleAria', { index: idx + 1 })}
          />
          <div className="outline-row__actions">
            <button
              type="button"
              className="mat-del"
              onClick={() => onMoveRow(idx, -1)}
              disabled={idx === 0}
              aria-label={t('courseEdit.moveUp')}
              title={t('courseEdit.moveUp')}
            >
              ↑
            </button>
            <button
              type="button"
              className="mat-del"
              onClick={() => onMoveRow(idx, 1)}
              disabled={idx === outline.length - 1}
              aria-label={t('courseEdit.moveDown')}
              title={t('courseEdit.moveDown')}
            >
              ↓
            </button>
            <button
              type="button"
              className="mat-del"
              onClick={() => onRemoveRow(idx)}
              disabled={outline.length <= 1}
              title={
                outline.length <= 1
                  ? t('courseEdit.cannotDeleteLast')
                  : t('courseEdit.deletePlanItem')
              }
              aria-label={t('courseEdit.deletePlanItem')}
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        style={{ marginTop: 8 }}
        onClick={onAddRow}
      >
        <Icon name="plus" size={14} />
        {t('courseEdit.addLessonToPlan')}
      </button>
    </div>
  )
}

export default OutlineEditor
