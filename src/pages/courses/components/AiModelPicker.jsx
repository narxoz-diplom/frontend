import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner, Dropdown } from '@/shared/ui/academis'

const tierBadgeClass = (tier) => {
  if (tier === 'quality') return 'badge-violet'
  return 'badge-published'
}

const AiModelPicker = ({
  models,
  loading,
  loadError,
  selectedModelId,
  onSelect,
  selectedModel,
  compact = false,
}) => {
  const { t } = useTranslation()

  if (loading) {
    return (
      <button type="button" className="model-picker model-picker--loading" disabled>
        <span className="mp-ic">
          <Spinner size={16} />
        </span>
        <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
          <div className="dim" style={{ fontSize: 10 }}>{t('studio.aiModel')}</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{t('courseEdit.aiModelLoading')}</div>
        </div>
      </button>
    )
  }

  if (loadError) {
    return (
      <div className="model-picker model-picker--error" role="alert">
        <span className="mp-ic">
          <Icon name="warn" size={16} />
        </span>
        <div style={{ fontSize: 12 }}>{t('courseEdit.aiModelLoadError')}</div>
      </div>
    )
  }

  if (!models?.length) {
    return (
      <div className="model-picker model-picker--empty" role="status">
        <span className="mp-ic">
          <Icon name="robot" size={16} />
        </span>
        <div style={{ fontSize: 12 }}>{t('courseEdit.aiModelEmpty')}</div>
      </div>
    )
  }

  const active = selectedModel || models.find((m) => m.id === selectedModelId) || models[0]

  if (!compact) {
    return (
      <div className="ai-model-picker ai-model-picker--legacy">
        <label className="field">
          <span className="label">{t('studio.aiModel')}</span>
          <select
            className="select"
            value={selectedModelId || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id} disabled={!model.enabled}>
                {model.displayName || model.id}
              </option>
            ))}
          </select>
        </label>
      </div>
    )
  }

  return (
    <Dropdown
      align="right"
      width={300}
      trigger={(
        <button type="button" className="model-picker">
          <span className="mp-ic">
            <Icon name="robot" size={16} />
          </span>
          <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
            <div className="dim" style={{ fontSize: 10 }}>{t('studio.aiModel')}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {active?.displayName || active?.id}
            </div>
          </div>
          <Icon name="chevDown" size={15} style={{ color: 'var(--text-3)' }} />
        </button>
      )}
    >
      <div className="menu-label">{t('studio.aiModel')}</div>
      {models.map((model) => {
        const selected = model.id === (selectedModelId || active?.id)
        return (
          <button
            key={model.id}
            type="button"
            className="menu-item"
            style={{ height: 'auto', padding: 9, width: '100%', textAlign: 'left' }}
            onClick={() => onSelect(model.id)}
            disabled={!model.enabled}
          >
            <span
              className="mp-ic"
              style={{
                background: selected ? 'var(--brand)' : 'var(--surface-3)',
                color: selected ? '#fff' : 'var(--text-2)',
              }}
            >
              <Icon name="robot" size={15} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="row gap6" style={{ alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{model.displayName || model.id}</span>
                {model.tier && (
                  <span className={`badge ${tierBadgeClass(model.tier)}`} style={{ height: 17, fontSize: 9.5 }}>
                    {model.tier === 'quality' ? 'Pro' : 'Fast'}
                  </span>
                )}
              </div>
              {model.description && (
                <div className="dim" style={{ fontSize: 11 }}>{model.description}</div>
              )}
            </div>
            {selected && <Icon name="check" size={16} style={{ color: 'var(--brand)' }} />}
          </button>
        )
      })}
    </Dropdown>
  )
}

export default AiModelPicker
