/**
 * Browser-native image compression and resizing utility for ID card photos.
 * Resizes high-resolution camera and gallery photos to sensible dimensions (max 1000x1000)
 * and compresses them down to the KB range (~50KB - 300KB) while preserving high facial clarity.
 */

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  targetMaxBytes?: number
  initialQuality?: number
  minQuality?: number
  mimeType?: 'image/jpeg' | 'image/webp'
}

export interface CompressResult {
  file: File
  originalSize: number
  compressedSize: number
  reductionPercentage: number
  width: number
  height: number
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1000,
  maxHeight: 1000,
  targetMaxBytes: 350 * 1024, // 350 KB target ceiling
  initialQuality: 0.82,
  minQuality: 0.60,
  mimeType: 'image/jpeg',
}

/**
 * Loads an image from a File or Blob into an ImageBitmap or HTMLImageElement,
 * honoring EXIF orientation metadata.
 */
async function loadImageSource(
  file: File | Blob
): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  // 1. Try modern createImageBitmap with orientation normalization
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await window.createImageBitmap(file, {
        imageOrientation: 'from-image',
      })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => {
          bitmap.close?.()
        },
      }
    } catch {
      // Fallback to standard Image element if createImageBitmap with options fails
    }
  }

  // 2. Standard HTMLImageElement fallback
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {
          URL.revokeObjectURL(url)
        },
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      type,
      quality
    )
  })
}

/**
 * Automatically compress and resize an image file.
 * Returns a new File object suitable for FormData and Supabase upload.
 */
export async function compressImage(
  input: File | Blob,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const originalSize = input.size

  const { source, width: srcWidth, height: srcHeight, cleanup } = await loadImageSource(input)

  try {
    // 1. Calculate scaled dimensions keeping aspect ratio
    let targetWidth = srcWidth
    let targetHeight = srcHeight

    if (targetWidth > opts.maxWidth || targetHeight > opts.maxHeight) {
      const ratio = Math.min(opts.maxWidth / targetWidth, opts.maxHeight / targetHeight)
      targetWidth = Math.max(1, Math.round(targetWidth * ratio))
      targetHeight = Math.max(1, Math.round(targetHeight * ratio))
    }

    // 2. Render to off-screen canvas with high smoothing
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      throw new Error('Canvas 2D context could not be created')
    }

    // Fill white background for clean portrait card
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

    // 3. Multi-pass compression to reach optimal KB target without degrading facial details
    let currentQuality = opts.initialQuality
    let bestBlob: Blob | null = await canvasToBlob(canvas, opts.mimeType, currentQuality)

    if (!bestBlob) {
      throw new Error('Failed to encode image canvas to blob')
    }

    // If initial quality is larger than target ceiling, reduce quality step-by-step
    const step = 0.08
    while (bestBlob.size > opts.targetMaxBytes && currentQuality - step >= opts.minQuality) {
      currentQuality = Math.max(opts.minQuality, currentQuality - step)
      const smallerBlob = await canvasToBlob(canvas, opts.mimeType, currentQuality)
      if (smallerBlob) {
        bestBlob = smallerBlob
      } else {
        break
      }
    }

    // 4. Construct output File
    let fileName = 'student_photo.jpg'
    if (input instanceof File && input.name) {
      fileName = input.name.replace(/\.[^/.]+$/, '') + '.jpg'
    }

    const compressedSize = bestBlob.size
    const reductionPercentage =
      originalSize > 0
        ? Math.max(0, Number((((originalSize - compressedSize) / originalSize) * 100).toFixed(1)))
        : 0

    // Log compression stats in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[Photo Optimizer] Original: ${(originalSize / 1024).toFixed(1)} KB → Compressed: ${(
          compressedSize / 1024
        ).toFixed(1)} KB (Reduction: ${reductionPercentage}%, ${targetWidth}x${targetHeight})`
      )
    }

    const compressedFile = new File([bestBlob], fileName, {
      type: opts.mimeType,
      lastModified: Date.now(),
    })

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      reductionPercentage,
      width: targetWidth,
      height: targetHeight,
    }
  } finally {
    cleanup()
  }
}

