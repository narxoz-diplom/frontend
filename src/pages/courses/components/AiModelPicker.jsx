import React from 'react'
import { FiAlertCircle, FiLoader } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { formatMicrosToCurrency, formatTokenCount } from '@/shared/lib/aiUsageFormat'

const tierKey = (tier) => {
  if (tier === 'quality') return 'courseEdit.aiModelTierQuality'
  if (tier === 'fast') return 'courseEdit.aiModelTierFast'
  return null
}

const AiModelPicker = ({
  models,
  loading,
  loadError,
  selectedModelId,
  onSelect,
  selectedModel
}) => {
  const { t, i18n } = useTranslation()

  if (loading) {
    return (
      <div className="ai-model-picker ai-model-picker--loading" role="status">
        <FiLoader className="spin" aria-hidden />
        <span>{t('courseEdit.aiModelLoading')}</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="ai-model-picker ai-model-picker--error" role="alert">
        <FiAlertCircle aria-hidden />
        <span>{t('courseEdit.aiModelLoadError')}</span>
      </div>
    )
  }

  if (!models?.length) {
    return (
      <div className="ai-model-picker ai-model-picker--empty" role="status">
        <span>{t('courseEdit.aiModelEmpty')}</span>
      </div>
    )
  }

  const priceHint = selectedModel?.priceHint
  const inputPrice = priceHint
    ? formatMicrosToCurrency(priceHint.inputPer1MTokensMicros, priceHint.currency, i18n.language)
    : null
  const outputPrice = priceHint
    ? formatMicrosToCurrency(priceHint.outputPer1MTokensMicros, priceHint.currency, i18n.language)
    : null
  const tierLabelKey = tierKey(selectedModel?.tier)

  return (
    <div className="ai-model-picker">
      <label className="gen-field gen-field--full">
        <span className="gen-label">{t('courseEdit.aiModelLabel')}</span>
        <select
          className="gen-select"
          value={selectedModelId || ''}
          onChange={(e) => onSelect(e.target.value)}
        >
          {models.map((model) => {
            const disabled = !model.enabled
            const suffix = disabled && model.unavailableReason
              ? ` — ${model.unavailableReason}`
              : model.isDefault
                ? ` (${t('courseEdit.aiModelDefaultBadge')})`
                : ''
            return (
              <option key={model.id} value={model.id} disabled={disabled}>
                {model.displayName || model.id}
                {suffix}
              </option>
            )
          })}
        </select>
      </label>

      {selectedModel && (
        <div className="ai-model-picker__details">
          {selectedModel.description && (
            <p className="ai-model-picker__desc">{selectedModel.description}</p>
          )}
          <dl className="ai-model-picker__meta">
            {tierLabelKey && (
              <div>
                <dt>{t('courseEdit.aiModelTier')}</dt>
                <dd>{t(tierLabelKey)}</dd>
              </div>
            )}
            {selectedModel.contextWindowTokens != null && (
              <div>
                <dt>{t('courseEdit.aiModelContextWindow')}</dt>
                <dd>{selectedModel.contextWindowTokens.toLocaleString()}</dd>
              </div>
            )}
            {(inputPrice || outputPrice) && (
              <div>
                <dt>{t('courseEdit.aiModelPriceHint')}</dt>
                <dd>
                  {inputPrice && (
                    <span>
                      {t('courseEdit.aiModelPriceInput', { price: inputPrice })}
                    </span>
                  )}
                  {inputPrice && outputPrice ? ' · ' : null}
                  {outputPrice && (
                    <span>
                      {t('courseEdit.aiModelPriceOutput', { price: outputPrice })}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {selectedModel.quota?.remainingTokens != null && (
              <div>
                <dt>{t('courseEdit.aiModelQuotaMonthly')}</dt>
                <dd>
                  {formatTokenCount(selectedModel.quota.remainingTokens)} /{' '}
                  {formatTokenCount(selectedModel.quota.limitTokens)}{' '}
                  {t('courseEdit.aiModelQuotaRemaining')}
                </dd>
              </div>
            )}
            {selectedModel.quota?.daily?.remainingTokens != null && (
              <div>
                <dt>{t('courseEdit.aiModelQuotaDaily')}</dt>
                <dd>
                  {formatTokenCount(selectedModel.quota.daily.remainingTokens)} /{' '}
                  {formatTokenCount(selectedModel.quota.daily.limitTokens)}{' '}
                  {t('courseEdit.aiModelQuotaRemaining')}
                </dd>
              </div>
            )}
          </dl>
          {!selectedModel.enabled && selectedModel.unavailableReason && (
            <p className="ai-model-picker__unavailable" role="alert">
              {t('courseEdit.aiModelUnavailable')}: {selectedModel.unavailableReason}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default AiModelPicker
