import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import ConfirmModal from '@/shared/ui/ConfirmModal'
import ToastStack from '@/shared/ui/ToastStack'

const AlertContext = createContext(null)

export function AlertProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        resolve
      })
    })
  }, [])

  const closeConfirm = useCallback((value) => {
    setConfirmState((s) => {
      if (s?.resolve) s.resolve(value)
      return null
    })
  }, [])

  const toast = useCallback((message, type = 'info') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, type }])
    const ttl = type === 'error' ? 6000 : 4200
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, ttl)
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = { confirm, toast, dismissToast }

  return (
    <AlertContext.Provider value={value}>
      {children}
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message ?? ''}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        variant={confirmState?.variant ?? 'default'}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) {
    throw new Error('useAlert должен использоваться внутри AlertProvider')
  }
  return ctx
}
