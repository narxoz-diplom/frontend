import React, { useEffect } from 'react'

export default function Modal({ open, isOpen, onClose, children, size }) {
  const visible = open ?? isOpen

  useEffect(() => {
    if (!visible) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className={`modal${size === 'lg' ? ' modal-lg' : ''}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
