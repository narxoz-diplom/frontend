import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { startBackfill, getBackfillSummary, getBackfillJob } from '@/shared/api/coursesApi'

export const useLocalizationBackfill = ({ courseId, onCompleted, setError }) => {
  const { t } = useTranslation()
  const [backfillingLocales, setBackfillingLocales] = useState(false)
  const [backfillActiveLang, setBackfillActiveLang] = useState(null)
  const [backfillJobId, setBackfillJobId] = useState(null)
  const [backfillJob, setBackfillJob] = useState(null)
  const [backfillSummary, setBackfillSummary] = useState({ kz: null, en: null })

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    ;(async () => {
      try {
        const [kzRes, enRes] = await Promise.all([
          getBackfillSummary(courseId, 'kz'),
          getBackfillSummary(courseId, 'en')
        ])
        if (!cancelled) {
          setBackfillSummary({ kz: kzRes.data || null, en: enRes.data || null })
        }
      } catch {
        if (!cancelled) setBackfillSummary({ kz: null, en: null })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [courseId])

  const handleBackfillLocalizations = async (lang) => {
    setBackfillingLocales(true)
    setBackfillActiveLang(lang === 'kz' || lang === 'en' ? lang : null)
    setError(null)
    try {
      const res = await startBackfill(courseId, lang)
      const jobId = res?.data?.jobId
      if (!jobId) {
        throw new Error('No jobId returned')
      }
      setBackfillJobId(jobId)
    } catch (err) {
      setError(err.response?.data?.message || t('courseEdit.backfillError'))
      setBackfillActiveLang(null)
    } finally {
      setBackfillingLocales(false)
    }
  }

  useEffect(() => {
    if (!backfillJobId) return
    let cancelled = false
    const poll = async () => {
      try {
        const res = await getBackfillJob(courseId, backfillJobId)
        if (!cancelled) setBackfillJob(res.data || null)
        const st = res?.data?.status
        if (st === 'COMPLETED') {
          if (!cancelled) {
            setBackfillJobId(null)
            setBackfillActiveLang(null)
            await onCompleted()
          }
          return true
        }
        if (st === 'FAILED') {
          if (!cancelled) {
            setError(res?.data?.message || t('courseEdit.backfillError'))
            setBackfillJobId(null)
            setBackfillActiveLang(null)
          }
          return true
        }
        return false
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || t('courseEdit.backfillError'))
          setBackfillJobId(null)
          setBackfillActiveLang(null)
        }
        return true
      }
    }

    const tick = async () => {
      const done = await poll()
      if (done) return
      timer = window.setTimeout(tick, 1500)
    }

    let timer = window.setTimeout(tick, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [backfillJobId, courseId])

  return {
    backfillSummary,
    backfillingLocales,
    backfillActiveLang,
    backfillJobId,
    backfillJob,
    handleBackfillLocalizations
  }
}
