import { useCallback, useState } from 'react'
import {
  getAdminTeacherLimit,
  resetAdminTeacherLimit,
  updateAdminTeacherLimit
} from '@/shared/api/aiModelsApi'

const emptyForm = () => ({
  unlimitedAccess: false,
  monthlyTokenLimit: '',
  dailyTokenLimit: '',
  note: ''
})

export const useAdminTeacherLimit = () => {
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const applyStatusToForm = useCallback((data) => {
    setForm({
      unlimitedAccess: data?.unlimited === true,
      monthlyTokenLimit:
        data?.monthlyLimit != null ? String(data.monthlyLimit) : '',
      dailyTokenLimit: data?.dailyLimit != null ? String(data.dailyLimit) : '',
      note: data?.note || ''
    })
  }, [])

  const load = useCallback(async () => {
    const trimmed = userId.trim()
    if (!trimmed) {
      setError('user_id_required')
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { data } = await getAdminTeacherLimit(trimmed)
      setStatus(data)
      applyStatusToForm(data)
    } catch (err) {
      setStatus(null)
      setError(err.response?.data?.message || err.message || 'load_failed')
    } finally {
      setLoading(false)
    }
  }, [userId, applyStatusToForm])

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const save = useCallback(async () => {
    const trimmed = userId.trim()
    if (!trimmed) {
      setError('user_id_required')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const body = {
        unlimitedAccess: form.unlimitedAccess,
        note: form.note.trim() || null
      }
      if (!form.unlimitedAccess) {
        body.monthlyTokenLimit = Number(form.monthlyTokenLimit)
        body.dailyTokenLimit = Number(form.dailyTokenLimit)
        if (
          !Number.isFinite(body.monthlyTokenLimit) ||
          body.monthlyTokenLimit < 0 ||
          !Number.isFinite(body.dailyTokenLimit) ||
          body.dailyTokenLimit < 0
        ) {
          setError('invalid_limits')
          setSaving(false)
          return
        }
      }
      const { data } = await updateAdminTeacherLimit(trimmed, body)
      setStatus(data)
      applyStatusToForm(data)
      setMessage('saved')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'save_failed')
    } finally {
      setSaving(false)
    }
  }, [userId, form, applyStatusToForm])

  const resetToDefault = useCallback(async () => {
    const trimmed = userId.trim()
    if (!trimmed) {
      setError('user_id_required')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await resetAdminTeacherLimit(trimmed)
      const { data } = await getAdminTeacherLimit(trimmed)
      setStatus(data)
      applyStatusToForm(data)
      setMessage('reset')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'reset_failed')
    } finally {
      setSaving(false)
    }
  }, [userId, applyStatusToForm])

  return {
    userId,
    setUserId,
    status,
    form,
    updateField,
    loading,
    saving,
    error,
    message,
    load,
    save,
    resetToDefault
  }
}
