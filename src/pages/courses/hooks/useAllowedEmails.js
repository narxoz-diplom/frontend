import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { updateAllowedEmails } from '@/shared/api/coursesApi'

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim())

const parseEmailsFromText = (text) => {
  if (!text || !text.trim()) return []
  const raw = text
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(raw)].filter(isValidEmail)
}

export const useAllowedEmails = ({ courseId, course, setCourse }) => {
  const { t } = useTranslation()
  const [allowedEmails, setAllowedEmails] = useState([])
  const [newEmailsText, setNewEmailsText] = useState('')
  const [savingEmails, setSavingEmails] = useState(false)
  const [showEmailsModal, setShowEmailsModal] = useState(false)
  const [emailModalError, setEmailModalError] = useState(null)

  useEffect(() => {
    setAllowedEmails(Array.isArray(course?.allowedEmails) ? course.allowedEmails : [])
  }, [course])

  useEffect(() => {
    if (!showEmailsModal) return
    const onEscape = (e) => {
      if (e.key === 'Escape') {
        closeEmailsModal()
      }
    }
    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [showEmailsModal])

  const handleAddEmails = () => {
    const toAdd = parseEmailsFromText(newEmailsText)
    const invalid = newEmailsText
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && !isValidEmail(s))
    if (toAdd.length === 0 && invalid.length > 0) {
      setEmailModalError(t('courseEdit.invalidEmails'))
      return
    }
    if (toAdd.length === 0) {
      setEmailModalError(null)
      return
    }
    setAllowedEmails((prev) => {
      const set = new Set(prev)
      toAdd.forEach((e) => set.add(e))
      return [...set]
    })
    setNewEmailsText('')
    setEmailModalError(invalid.length > 0 ? t('courseEdit.partialInvalid', { count: invalid.length, sample: `${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}` }) : null)
  }

  const handleRemoveEmail = (email) => {
    setAllowedEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleSaveAllowedEmails = async () => {
    setSavingEmails(true)
    setEmailModalError(null)
    try {
      await updateAllowedEmails(courseId, allowedEmails)
      setCourse((prev) => prev ? { ...prev, allowedEmails } : null)
      setEmailModalError(null)
    } catch (err) {
      setEmailModalError(err.response?.data?.message || t('courseEdit.saveEmailsError'))
    } finally {
      setSavingEmails(false)
    }
  }

  const openEmailsModal = () => {
    setAllowedEmails(Array.isArray(course?.allowedEmails) ? [...course.allowedEmails] : [])
    setNewEmailsText('')
    setEmailModalError(null)
    setShowEmailsModal(true)
  }

  const closeEmailsModal = () => {
    setShowEmailsModal(false)
    setEmailModalError(null)
  }

  return {
    allowedEmails,
    newEmailsText,
    setNewEmailsText,
    savingEmails,
    showEmailsModal,
    emailModalError,
    handleAddEmails,
    handleRemoveEmail,
    handleSaveAllowedEmails,
    openEmailsModal,
    closeEmailsModal
  }
}
