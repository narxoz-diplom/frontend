import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ragPost } from '@/shared/api/ragApi'

export const useRagGeneration = (path, fallbackKey) => {
  const { t } = useTranslation()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async (payload, config) => {
    setLoading(true)
    setResult(null)
    try {
      const response = await ragPost(path, payload, config)
      setResult(response.data)
    } catch (err) {
      setResult({
        error: err.response?.data?.detail || err.message || t(fallbackKey)
      })
    } finally {
      setLoading(false)
    }
  }

  return { result, setResult, loading, generate }
}
