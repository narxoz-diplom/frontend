import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdminAiUsage, getMyAiUsage } from '@/shared/api/aiModelsApi'

const defaultTo = () => new Date().toISOString().slice(0, 10)

const defaultFrom = () => {
  const d = new Date()
  d.setDate(d.getDate() - 29)
  return d.toISOString().slice(0, 10)
}

const buildQueryParams = (filters, mode) => {
  const params = { from: filters.from, to: filters.to }
  if (mode === 'admin') {
    if (filters.userId?.trim()) params.userId = filters.userId.trim()
    if (filters.courseId) params.courseId = Number(filters.courseId)
    if (filters.modelId?.trim()) params.modelId = filters.modelId.trim()
    if (filters.provider?.trim()) params.provider = filters.provider.trim()
    if (filters.generationType?.trim()) params.generationType = filters.generationType.trim()
    if (filters.status?.trim()) params.status = filters.status.trim()
  }
  return params
}

export const useAiUsageReport = ({ mode = 'teacher', initialFilters = {} } = {}) => {
  const initial = {
    from: defaultFrom(),
    to: defaultTo(),
    userId: '',
    courseId: '',
    modelId: '',
    provider: '',
    generationType: '',
    status: '',
    ...initialFilters
  }
  const [filters, setFilters] = useState(initial)
  const [appliedFilters, setAppliedFilters] = useState(initial)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const queryParams = useMemo(
    () => buildQueryParams(mode === 'admin' ? appliedFilters : filters, mode),
    [appliedFilters, filters, mode]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetcher = mode === 'admin' ? getAdminAiUsage : getMyAiUsage
      const { data } = await fetcher(queryParams)
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(err.response?.data?.message || err.message || 'load_failed')
    } finally {
      setLoading(false)
    }
  }, [mode, queryParams])

  useEffect(() => {
    load()
  }, [load])

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters(filters)
  }

  return {
    report,
    loading,
    error,
    filters,
    updateFilter,
    applyFilters,
    reload: load
  }
}
