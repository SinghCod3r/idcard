'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Camera,
  Check,
  FlipHorizontal,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  // Captured snapshot state for Preview Screen (Part 4)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera()
    setError(null)
    setIsInitializing(true)

    // Check device support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera is not supported on this browser or device. Please upload an image from your gallery.')
      setIsInitializing(false)
      return
    }

    try {
      // First attempt with preferred constraints
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch {
        // Fallback to basic video constraint if ideal constraints fail
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check available cameras to show flip button if > 1
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoInputs = devices.filter((d) => d.kind === 'videoinput')
          setHasMultipleCameras(videoInputs.length > 1)
        } catch {
          // Ignore enumeration failure
        }
      }
    } catch (err: unknown) {
      console.warn('[Camera] Access denied or error:', err)
      const errName = err instanceof Error ? err.name : ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setError('Camera access is required to take a photo. Please allow camera permissions or upload from your gallery.')
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setError('No camera device was found on this system. You can choose a photo from your gallery instead.')
      } else {
        setError('Could not access the camera. Please check your browser settings or choose a photo from your gallery.')
      }
    } finally {
      setIsInitializing(false)
    }
  }, [facingMode, stopCamera])

  // Lifecycle management
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setCapturedBlob(null)
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl)
        setCapturedUrl(null)
      }
      return
    }

    startCamera()

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  // Handle camera flip
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  // Handle capture shutter click
  const takePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current

    if (video.videoWidth === 0 || video.videoHeight === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If front camera, mirror the frame horizontally so it looks natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        stopCamera()
        setCapturedBlob(blob)
        setCapturedUrl(URL.createObjectURL(blob))
      },
      'image/jpeg',
      0.95
    )
  }

  // Handle retake photo
  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setCapturedBlob(null)
    setCapturedUrl(null)
    startCamera()
  }

  // Handle confirmation: "Use Photo"
  const handleConfirmPhoto = () => {
    if (!capturedBlob) return

    const file = new File([capturedBlob], `id_photo_${Date.now()}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    stopCamera()
    onCapture(file)
    onClose()
  }

  // Handle gallery selection from within camera modal
  const handleGallerySelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      stopCamera()
      setCapturedBlob(file)
      setCapturedUrl(URL.createObjectURL(file))
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Camera Capture"
      className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none animate-in fade-in-0 duration-200"
    >
      {/* Hidden file input for gallery fallback */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGallerySelected}
      />

      {/* TOP HEADER */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top,0px))] bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          type="button"
          onClick={capturedUrl ? handleRetake : onClose}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/20 active:scale-95 transition-all"
        >
          {capturedUrl ? (
            <>
              <ArrowLeft className="size-4" />
              <span>Retake</span>
            </>
          ) : (
            <>
              <X className="size-4" />
              <span>Cancel</span>
            </>
          )}
        </button>

        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
          {capturedUrl ? 'Review Photo' : 'ID Card Photo'}
        </h2>

        {/* Right side controls: Flip camera (only in live mode) */}
        <div className="w-20 flex justify-end">
          {!capturedUrl && hasMultipleCameras && (
            <button
              type="button"
              onClick={toggleCamera}
              className="rounded-full bg-white/10 p-2 text-slate-200 hover:bg-white/20 active:scale-90 transition-all"
              title="Flip Camera"
              aria-label="Flip Camera"
            >
              <FlipHorizontal className="size-5" />
            </button>
          )}
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden">
        {capturedUrl ? (
          /* PREVIEW SCREEN (Part 4) */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-sm aspect-[3/4] overflow-hidden rounded-2xl border-2 border-blue-400 shadow-2xl bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedUrl}
                alt="Captured ID preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                <Check className="size-3" />
                <span>Captured</span>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-400 text-center">
              Make sure your face is clearly visible and well lit
            </p>
          </div>
        ) : error ? (
          /* ERROR / PERMISSION DENIED SCREEN (Part 13) */
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Camera Access Notice</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={startCamera}
              >
                <RotateCcw className="mr-2 size-4" />
                Retry Camera
              </Button>
              <Button
                type="button"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImageIcon className="mr-2 size-4" />
                Choose from Gallery
              </Button>
            </div>
          </div>
        ) : (
          /* LIVE CAMERA FEED WITH ID PHOTO FRAME OVERLAY (Part 1 & 2) */
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-transform ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* ID PHOTO FRAME GUIDE OVERLAY */}
            <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none px-4">
              {/* ID Frame Card */}
              <div className="relative w-64 sm:w-72 aspect-[3/4] rounded-2xl border-2 border-blue-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex flex-col items-center justify-between p-4">
                {/* Frame Corner Accents */}
                <div className="absolute -top-1 -left-1 size-5 border-t-3 border-l-3 border-blue-400 rounded-tl" />
                <div className="absolute -top-1 -right-1 size-5 border-t-3 border-r-3 border-blue-400 rounded-tr" />
                <div className="absolute -bottom-1 -left-1 size-5 border-b-3 border-l-3 border-blue-400 rounded-bl" />
                <div className="absolute -bottom-1 -right-1 size-5 border-b-3 border-r-3 border-blue-400 rounded-br" />

                {/* Subtle face oval silhouette guide */}
                <div className="w-36 h-48 sm:w-40 sm:h-52 mt-4 rounded-full border border-dashed border-white/35 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">
                    Face
                  </span>
                </div>

                {/* Subtle bottom badge guide line */}
                <div className="w-24 h-1 rounded-full bg-white/20 mb-2" />
              </div>

              {/* Instruction banner */}
              <div className="mt-5 text-center">
                <p className="text-sm font-semibold tracking-wide text-white drop-shadow-md">
                  Position your face inside the frame
                </p>
                <p className="text-xs text-slate-300/80 drop-shadow-sm mt-0.5">
                  Keep your head straight and eyes open
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* BOTTOM CONTROLS (Part 3 & 4) */}
      <footer className="relative z-20 flex items-center justify-between px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-black via-black/80 to-transparent">
        {capturedUrl ? (
          /* PREVIEW CONTROLS: Retake vs Use Photo */
          <div className="flex w-full items-center gap-3 max-w-sm mx-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleRetake}
              className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
            >
              <RotateCcw className="mr-2 size-4" />
              Retake
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleConfirmPhoto}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
            >
              <Check className="mr-2 size-4" />
              Use Photo
            </Button>
          </div>
        ) : (
          /* LIVE CAMERA CONTROLS */
          <div className="flex w-full items-center justify-between max-w-md mx-auto">
            {/* Gallery Upload shortcut */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors p-2 rounded-lg active:scale-95"
              title="Upload from Gallery"
              aria-label="Upload from Gallery"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10">
                <ImageIcon className="size-5" />
              </div>
              <span className="text-[11px] font-medium">Gallery</span>
            </button>

            {/* Shutter Button (Part 3) */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={takePhoto}
                disabled={!!error || isInitializing}
                aria-label="Take Photo"
                className="group relative flex size-20 items-center justify-center rounded-full border-4 border-white/40 p-1 transition-all duration-150 ease-out hover:border-white active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
              >
                {/* Inner shutter disc */}
                <div className="size-16 rounded-full bg-white shadow-lg transition-all group-hover:scale-95 group-active:scale-90" />
              </button>
            </div>

            {/* Flip Camera shortcut or Balance Placeholder */}
            {hasMultipleCameras ? (
              <button
                type="button"
                onClick={toggleCamera}
                className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors p-2 rounded-lg active:scale-95"
                title="Switch Camera"
                aria-label="Switch Camera"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10">
                  <FlipHorizontal className="size-5" />
                </div>
                <span className="text-[11px] font-medium">Flip</span>
              </button>
            ) : (
              <div className="w-11" />
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
