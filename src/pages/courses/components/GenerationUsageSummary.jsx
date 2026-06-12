import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatMicrosToCurrency, formatTokenCount } from '@/shared/lib/aiUsageFormat'

const GenerationUsageSummary = ({ summary, models }) => {
  const { t, i18n } = useTranslation()

  if (!summary) return null

  const modelName =
    models?.find((m) => m.id === summary.modelId)?.displayName || summary.modelId
  const totalTokens = formatTokenCount(summary.totalTokens)
  const inputTokens = formatTokenCount(summary.inputTokens)
  const outputTokens = formatTokenCount(summary.outputTokens)
  const cost = formatMicrosToCurrency(summary.costMicros, summary.currency, i18n.language)

  if (!totalTokens && !inputTokens && !cost) return null

  return (
    <aside className="generation-usage-summary" aria-live="polite">
      <p className="generation-usage-summary__title">{t('courseEdit.generationUsageTitle')}</p>
      <dl className="generation-usage-summary__grid">
        {modelName && (
          <div>
            <dt>{t('courseEdit.generationUsageModel')}</dt>
            <dd>{modelName}</dd>
          </div>
        )}
        {(inputTokens || outputTokens || totalTokens) && (
          <div>
            <dt>{t('courseEdit.generationUsageTokens')}</dt>
            <dd>
              {inputTokens != null && outputTokens != null
                ? `${inputTokens} / ${outputTokens}`
                : totalTokens || inputTokens || outputTokens}
            </dd>
          </div>
        )}
        {cost && (
          <div>
            <dt>{t('courseEdit.generationUsageCost')}</dt>
            <dd>{cost}</dd>
          </div>
        )}
      </dl>
    </aside>
  )
}

export default GenerationUsageSummary
