import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAiModels } from '@/shared/api/aiModelsApi'

const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

export const useAiModels = () => {
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [lastUsageSummary, setLastUsageSummaryState] = useState(null)

  const loadCatalog = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setLoadError(null)
    }
    try {
      const { data } = await getAiModels('course-generation')
      setCatalog(data)
      setSelectedModelId((prev) => {
        if (prev && data?.models?.some((m) => m.id === prev)) return prev
        return (
          data?.defaultModelId ||
          data?.models?.find((m) => m.isDefault && m.enabled)?.id ||
          data?.models?.find((m) => m.enabled)?.id ||
          data?.models?.[0]?.id ||
          null
        )
      })
      return data
    } catch (err) {
      if (!silent) {
        setLoadError(err.response?.data?.message || err.message || 'load_failed')
        setCatalog(null)
      }
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const setLastUsageSummary = useCallback(
    (summary) => {
      setLastUsageSummaryState(summary)
      if (summary) loadCatalog({ silent: true })
    },
    [loadCatalog]
  )

  const models = catalog?.models ?? []
  const modelSelectionEnabled = catalog?.modelSelectionEnabled !== false

  const selectedModel = useMemo(() => {
    if (!models.length) return null
    return (
      models.find((m) => m.id === selectedModelId) ||
      models.find((m) => m.id === catalog?.defaultModelId) ||
      models.find((m) => m.enabled) ||
      models[0]
    )
  }, [models, selectedModelId, catalog?.defaultModelId])

  const buildGenerationExtras = useCallback(() => {
    if (!selectedModel?.enabled) {
      return { idempotencyKey: newIdempotencyKey() }
    }
    return {
      modelId: selectedModel.id,
      idempotencyKey: newIdempotencyKey()
    }
  }, [selectedModel])

  const userLimit = catalog?.userLimit ?? null
  const userLimitBlocked = userLimit?.blocked === true

  const canGenerate = Boolean(
    !loading && !loadError && selectedModel?.enabled && !userLimitBlocked
  )

  return {
    models,
    modelSelectionEnabled,
    loading,
    loadError,
    selectedModelId: selectedModel?.id ?? selectedModelId,
    setSelectedModelId,
    selectedModel,
    buildGenerationExtras,
    canGenerate,
    userLimit,
    userLimitBlocked,
    lastUsageSummary,
    setLastUsageSummary,
    refreshCatalog: () => loadCatalog({ silent: true })
  }
}
