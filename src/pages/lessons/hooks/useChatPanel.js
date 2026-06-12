import { useState, useRef, useEffect, useCallback } from 'react'

const PANEL_WIDTH_STORAGE_KEY = 'lesson-chat-panel-width'
const PANEL_ANIM_MS = 260
const PANEL_MIN_WIDTH = 300
const PANEL_DEFAULT_WIDTH = 420

function clampPanelWidth(w) {
  if (typeof window === 'undefined') return w
  const max = Math.max(PANEL_MIN_WIDTH, Math.floor(window.innerWidth * 0.92))
  return Math.min(max, Math.max(PANEL_MIN_WIDTH, Math.round(w)))
}

export function useChatPanel() {
  const [panelPhase, setPanelPhase] = useState('closed')
  const panelAnimTimer = useRef(null)
  const panelOpen = panelPhase === 'entering' || panelPhase === 'open' || panelPhase === 'closing'

  const openPanel = useCallback(() => {
    clearTimeout(panelAnimTimer.current)
    setPanelPhase('entering')
  }, [])

  const closePanel = useCallback(() => {
    setPanelPhase((p) => {
      if (p === 'closed' || p === 'closing') return p
      return 'closing'
    })
  }, [])

  useEffect(() => {
    if (panelPhase !== 'entering') return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelPhase('open'))
    })
    return () => cancelAnimationFrame(id)
  }, [panelPhase])

  useEffect(() => {
    if (panelPhase !== 'closing') return
    panelAnimTimer.current = setTimeout(() => setPanelPhase('closed'), PANEL_ANIM_MS)
    return () => clearTimeout(panelAnimTimer.current)
  }, [panelPhase])

  const [panelWidth, setPanelWidth] = useState(() => {
    try {
      const raw = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY)
      const n = raw ? parseInt(raw, 10) : PANEL_DEFAULT_WIDTH
      return Number.isFinite(n) ? n : PANEL_DEFAULT_WIDTH
    } catch {
      return PANEL_DEFAULT_WIDTH
    }
  })
  const panelWidthRef = useRef(panelWidth)
  useEffect(() => {
    panelWidthRef.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    setPanelWidth(w => clampPanelWidth(w))
  }, [])

  useEffect(() => {
    const onWinResize = () => setPanelWidth(w => clampPanelWidth(w))
    window.addEventListener('resize', onWinResize)
    return () => window.removeEventListener('resize', onWinResize)
  }, [])

  useEffect(() => {
    if (!panelOpen) return
    const onKey = e => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen, closePanel])

  useEffect(() => {
    if (!panelOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [panelOpen])

  const beginPanelResize = useCallback(clientX => {
    const startX = clientX
    const startW = panelWidthRef.current
    const onMove = cx => {
      const delta = startX - cx
      const next = clampPanelWidth(startW + delta)
      panelWidthRef.current = next
      setPanelWidth(next)
    }
    const onMouseMove = e => onMove(e.clientX)
    const onTouchMove = e => {
      if (e.touches.length === 1) {
        e.preventDefault()
        onMove(e.touches[0].clientX)
      }
    }
    const end = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', end)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', end)
      document.removeEventListener('touchcancel', end)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      try {
        localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidthRef.current))
      } catch {}
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', end)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', end)
    document.addEventListener('touchcancel', end)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  return { panelPhase, panelOpen, openPanel, closePanel, panelWidth, beginPanelResize }
}
