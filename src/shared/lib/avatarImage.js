export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export const MAX_AVATAR_DIMENSION = 512

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => resolve({ img, url })
  img.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('AVATAR_INVALID'))
  }
  img.src = url
})

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) reject(new Error('AVATAR_INVALID'))
    else resolve(blob)
  }, type, quality)
})

/** Resize/compress image for avatar upload and stable preview layout. */
export async function prepareAvatarFile(file) {
  const { img, url } = await loadImage(file)
  try {
    const maxSide = Math.max(img.naturalWidth, img.naturalHeight)
    const scale = Math.min(1, MAX_AVATAR_DIMENSION / maxSide)
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('AVATAR_INVALID')
    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.88
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    while (blob.size > MAX_AVATAR_BYTES && quality > 0.52) {
      quality -= 0.08
      blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }
    if (blob.size > MAX_AVATAR_BYTES) throw new Error('AVATAR_TOO_LARGE')

    const baseName = (file.name || 'avatar').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    URL.revokeObjectURL(url)
  }
}
