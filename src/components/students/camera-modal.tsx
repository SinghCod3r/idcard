'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
}: {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      return
    }

    startCamera()

    return () => stopCamera()
  }, [isOpen])

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera access denied or error:', err)
      setError('Could not access the camera. Please ensure you have granted permission.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const takePhoto = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        
        // Create a File object from the blob
        const file = new File([blob], `capture_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
        
        onCapture(file)
        stopCamera()
        onClose()
      },
      'image/jpeg',
      0.85
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="relative flex w-full max-w-2xl flex-col bg-black sm:overflow-hidden sm:rounded-xl">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Take Photo</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative aspect-[3/4] w-full bg-slate-900 sm:aspect-video">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-red-400">
              <Camera className="mb-4 size-12 opacity-50" />
              <p>{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              autoPlay
              muted
            />
          )}
        </div>

        <div className="flex items-center justify-center p-6">
          <Button
            size="lg"
            className="h-16 w-16 rounded-full border-4 border-white/20 p-0 hover:border-white/40"
            onClick={takePhoto}
            disabled={!!error}
          >
            <div className="h-12 w-12 rounded-full bg-white" />
            <span className="sr-only">Take photo</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
