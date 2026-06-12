import { useState, useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  generateLessonsOutline,
  getLessonsGenerationJob,
  generateLessonsFromOutline,
  generateLessonsFromFiles
} from '@/shared/api/coursesApi'
import { resolveAiApiErrorMessage } from '@/shared/lib/aiUsageFormat'

const newOutlineRowId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `ol-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

const mapApiOutlineItem = (o, i) => {
  const summary =
    (typeof o.summary === 'string' && o.summary) ||
    (typeof o.description === 'string' && o.description) ||
    (typeof o.goal === 'string' && o.goal) ||
    (typeof o.objectives === 'string' && o.objectives) ||
    ''
  return {
    id: newOutlineRowId(),
    title: o.title || `Урок ${i + 1}`,
    summary,
    order: o.order != null ? o.order : i + 1,
    include: o.include !== false
  }
}

const courseEditGenSessionKey = (courseId) => `courseEditGen:${courseId}`

export const useLessonGeneration = ({
  courseId,
  onLessonsChanged,
  setError,
  buildGenerationExtras,
  onUsageSummary,
  canGenerate = true
}) => {
  const { t } = useTranslation()
  const [selectedFileIds, setSelectedFileIds] = useState(new Set())
  const [genParams, setGenParams] = useState({
    teacherBrief: '',
    targetAudience: 'bachelor',
    minLessons: 5,
    maxLessons: 10,
    depth: 'medium',
    retrievalMode: 'full_collection',
    retrievalQuery: ''
  })
  const [outlineDraft, setOutlineDraft] = useState(null)
  const [outlineLoading, setOutlineLoading] = useState(false)
  const [lessonsJobId, setLessonsJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [jobProgress, setJobProgress] = useState(null)
  const [generatingLessons, setGeneratingLessons] = useState(false)
  const [quickGenLoading, setQuickGenLoading] = useState(false)

  useLayoutEffect(() => {
    if (!courseId) return
    try {
      const raw = sessionStorage.getItem(courseEditGenSessionKey(courseId))
      if (!raw) return
      const s = JSON.parse(raw)
      if (Array.isArray(s.selectedFileIds) && s.selectedFileIds.length > 0) {
        setSelectedFileIds(new Set(s.selectedFileIds))
      }
      if (s.outlineDraft && Array.isArray(s.outlineDraft) && s.outlineDraft.length > 0) {
        setOutlineDraft(s.outlineDraft)
      }
      if (s.genParams && typeof s.genParams === 'object') {
        setGenParams((prev) => ({ ...prev, ...s.genParams }))
      }
      if (s.lessonsJobId) {
        setLessonsJobId(s.lessonsJobId)
        setJobStatus(s.jobStatus || 'PENDING')
      }
    } catch {}
  }, [courseId])

  useEffect(() => {
    if (!courseId) return
    const hasDraft = outlineDraft && outlineDraft.length > 0
    const hasJob = !!lessonsJobId
    const hasFiles = selectedFileIds.size > 0
    if (!hasDraft && !hasJob && !hasFiles) {
      sessionStorage.removeItem(courseEditGenSessionKey(courseId))
      return
    }
    try {
      sessionStorage.setItem(
        courseEditGenSessionKey(courseId),
        JSON.stringify({
          selectedFileIds: Array.from(selectedFileIds),
          outlineDraft,
          genParams,
          lessonsJobId,
          jobStatus
        })
      )
    } catch {}
  }, [courseId, selectedFileIds, outlineDraft, genParams, lessonsJobId, jobStatus])

  useEffect(() => {
    if (!lessonsJobId) return undefined
    let timerId
    const tick = async () => {
      try {
        const { data } = await getLessonsGenerationJob(courseId, lessonsJobId)
        setJobStatus(data.status)
        setJobProgress({
          total: data.totalLessons ?? null,
          completed: data.completedLessons ?? null,
          currentTitle: data.currentLessonTitle ?? null
        })
        if (data.status === 'COMPLETED') {
          clearInterval(timerId)
          setLessonsJobId(null)
          setJobStatus(null)
          setJobProgress(null)
          setOutlineDraft(null)
          if (data.usageSummary) {
            onUsageSummary?.(data.usageSummary)
          }
          try {
            sessionStorage.removeItem(courseEditGenSessionKey(courseId))
          } catch {}
          onLessonsChanged()
        }
        if (data.status === 'FAILED') {
          clearInterval(timerId)
          setLessonsJobId(null)
          setJobProgress(null)
          const partial =
            data.completedLessons != null &&
            data.totalLessons != null &&
            data.completedLessons > 0 ? ` ${t('courseEdit.lessons')}: ${data.completedLessons}/${data.totalLessons}.`
              : ''
          setError(
            (data.errorMessage || t('courseEdit.generateLessonsError')) + partial
          )
          onLessonsChanged()
        }
      } catch {}
    }
    timerId = setInterval(tick, 2000)
    tick()
    return () => clearInterval(timerId)
  }, [lessonsJobId, courseId])

  const toggleFileSelection = (fileId) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) next.delete(fileId)
      else next.add(fileId)
      return next
    })
  }

  const updateGenParam = (field, value) => {
    setGenParams((prev) => ({ ...prev, [field]: value }))
  }

  const buildLessonParamsPayload = () => {
    const p = {}
    if (genParams.teacherBrief?.trim()) p.teacherBrief = genParams.teacherBrief.trim()
    if (genParams.targetAudience) p.targetAudience = genParams.targetAudience
    if (genParams.minLessons != null) p.minLessons = Number(genParams.minLessons)
    if (genParams.maxLessons != null) p.maxLessons = Number(genParams.maxLessons)
    if (genParams.depth) p.depth = genParams.depth
    if (genParams.retrievalMode) p.retrievalMode = genParams.retrievalMode
    if (genParams.retrievalQuery?.trim()) p.retrievalQuery = genParams.retrievalQuery.trim()
    return Object.keys(p).length ? p : undefined
  }

  const handleGenerateOutline = async () => {
    if (!canGenerate) {
      setError(t('courseEdit.aiModelUnavailable'))
      return
    }
    if (selectedFileIds.size === 0) {
      setError(t('courseEdit.selectFile'))
      return
    }
    setOutlineLoading(true)
    setError(null)
    try {
      const { data } = await generateLessonsOutline(courseId, {
        fileIds: Array.from(selectedFileIds),
        topK: 200,
        params: buildLessonParamsPayload(),
        ...(buildGenerationExtras?.() ?? {})
      })
      if (data.usageSummary) {
        onUsageSummary?.(data.usageSummary)
      }
      const rows = (data.outline || []).map((o, i) => mapApiOutlineItem(o, i))
      setOutlineDraft(rows.length > 0 ? rows : null)
    } catch (err) {
      setError(resolveAiApiErrorMessage(err, t, 'courseEdit.outlineError'))
    } finally {
      setOutlineLoading(false)
    }
  }

  const updateOutlineRow = (index, field, value) => {
    setOutlineDraft((prev) => {
      if (!prev) return prev
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const moveOutlineRow = (index, dir) => {
    setOutlineDraft((prev) => {
      if (!prev) return prev
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next.map((r, i) => ({ ...r, order: i + 1 }))
    })
  }

  const addOutlineRow = () => {
    setOutlineDraft((prev) => {
      const base = prev ?? []
      const row = {
        id: newOutlineRowId(),
        title: `${t('common.lesson')} ${base.length + 1}`,
        summary: '',
        include: true,
        order: base.length + 1
      }
      return [...base, row].map((r, i) => ({ ...r, order: i + 1 }))
    })
  }

  const removeOutlineRow = (index) => {
    setOutlineDraft((prev) => {
      if (!prev || prev.length <= 1) return prev
      const next = prev.filter((_, i) => i !== index)
      return next.map((r, i) => ({ ...r, order: i + 1 }))
    })
  }

  const handleApproveLessonsJob = async () => {
    if (!canGenerate) {
      setError(t('courseEdit.aiModelUnavailable'))
      return
    }
    if (!outlineDraft?.length) {
      setError(t('courseEdit.editOutlineFirst'))
      return
    }
    const outline = outlineDraft
      .filter((r) => r.include !== false)
      .map((r, i) => ({
        title: r.title,
        summary: r.summary || '',
        order: i + 1
      }))
    if (outline.length === 0) {
      setError(t('courseEdit.selectOutlineLesson'))
      return
    }
    setGeneratingLessons(true)
    setError(null)
    try {
      const { data } = await generateLessonsFromOutline(courseId, {
        fileIds: Array.from(selectedFileIds),
        outline,
        params: buildLessonParamsPayload(),
        ...(buildGenerationExtras?.() ?? {})
      })
      setLessonsJobId(data.jobId)
      setJobStatus('PENDING')
      setJobProgress({ total: null, completed: 0, currentTitle: null })
    } catch (err) {
      setError(resolveAiApiErrorMessage(err, t, 'courseEdit.startLessonsError'))
    } finally {
      setGeneratingLessons(false)
    }
  }

  const handleQuickGenerateAllLessons = async () => {
    if (!canGenerate) {
      setError(t('courseEdit.aiModelUnavailable'))
      return
    }
    if (selectedFileIds.size === 0) {
      setError(t('courseEdit.selectFile'))
      return
    }
    setQuickGenLoading(true)
    setError(null)
    try {
      const { data } = await generateLessonsFromFiles(courseId, {
        fileIds: Array.from(selectedFileIds),
        topK: 200,
        params: buildLessonParamsPayload(),
        ...(buildGenerationExtras?.() ?? {})
      })
      if (data?.usageSummary) {
        onUsageSummary?.(data.usageSummary)
      }
      onLessonsChanged()
      setSelectedFileIds(new Set())
    } catch (err) {
      setError(resolveAiApiErrorMessage(err, t, 'courseEdit.generateLessonsError'))
    } finally {
      setQuickGenLoading(false)
    }
  }

  return {
    selectedFileIds,
    toggleFileSelection,
    genParams,
    updateGenParam,
    outlineDraft,
    outlineLoading,
    handleGenerateOutline,
    updateOutlineRow,
    moveOutlineRow,
    addOutlineRow,
    removeOutlineRow,
    lessonsJobId,
    jobStatus,
    jobProgress,
    generatingLessons,
    handleApproveLessonsJob,
    quickGenLoading,
    handleQuickGenerateAllLessons
  }
}
