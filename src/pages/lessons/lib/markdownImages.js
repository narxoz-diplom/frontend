export function extractEmbeddedImages(text) {
  if (!text || typeof text !== 'string') return []
  const images = []
  const mdRe = /!\[([^\]]*)\]\(([^)]+)\)/g
  let m
  while ((m = mdRe.exec(text)) !== null) {
    images.push({
      fullMatch: m[0],
      alt: m[1],
      url: m[2].trim()
    })
  }
  const htmlRe = /<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>/gi
  while ((m = htmlRe.exec(text)) !== null) {
    images.push({
      fullMatch: m[0],
      alt: '',
      url: m[1].trim()
    })
  }
  return images
}

export function removeFirstOccurrence(haystack, needle) {
  const i = haystack.indexOf(needle)
  if (i === -1) return haystack
  const next = haystack.slice(0, i) + haystack.slice(i + needle.length)
  return next.replace(/\n{3,}/g, '\n\n')
}
