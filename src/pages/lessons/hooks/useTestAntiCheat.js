import { useEffect, useRef } from 'react'

const ACTIVATION_DELAY_MS = 1500

export const useTestAntiCheat = (active) => {
  const suspiciousRef = useRef(false)
  const violationCountRef = useRef(0)
  const armedRef = useRef(false)

  useEffect(() => {
    if (!active) {
      armedRef.current = false
      return undefined
    }

    suspiciousRef.current = false
    violationCountRef.current = 0
    armedRef.current = false

    const markSuspicious = () => {
      if (!armedRef.current) return
      suspiciousRef.current = true
      violationCountRef.current += 1
    }

    const armTimer = window.setTimeout(() => {
      armedRef.current = true
    }, ACTIVATION_DELAY_MS)

    const onVisibilityChange = () => {
      if (document.hidden) markSuspicious()
    }

    const onBlur = () => markSuspicious()

    const onCopy = (event) => {
      markSuspicious()
      event.preventDefault()
    }

    const onPaste = (event) => {
      markSuspicious()
      event.preventDefault()
    }

    const onContextMenu = (event) => {
      markSuspicious()
      event.preventDefault()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', onContextMenu)

    return () => {
      window.clearTimeout(armTimer)
      armedRef.current = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [active])

  return {
    isSuspicious: () => suspiciousRef.current,
    getViolationCount: () => violationCountRef.current,
  }
}
