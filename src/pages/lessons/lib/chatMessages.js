export function dedupeSummaryBlocks(text) {
  const raw = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
  if (raw.length <= 1) return text
  const norm = s => s.replace(/\s+/g, ' ').toLowerCase()
  const kept = []
  for (const block of raw) {
    const n = norm(block)
    if (n.length < 12) {
      kept.push(block)
      continue
    }
    const dup = kept.some(prev => {
      const p = norm(prev)
      if (n === p) return true
      const a = n.length >= p.length ? n : p
      const b = n.length >= p.length ? p : n
      if (b.length < 40) return false
      return a.includes(b.slice(0, Math.min(120, b.length)))
    })
    if (!dup) kept.push(block)
  }
  return kept.join('\n\n')
}

export function cloneMessages(msgs) {
  if (typeof structuredClone === 'function') return structuredClone(msgs)
  return JSON.parse(JSON.stringify(msgs))
}

export function getMessageText(msg) {
  if (!msg) return ''
  const c = msg.content
  if (typeof c === 'string') return c
  if (Array.isArray(c)) return c.map(part => part?.text ?? part ?? '').join('')
  return ''
}
