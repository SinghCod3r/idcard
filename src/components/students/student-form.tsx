'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Camera, Image as ImageIcon, User, Sparkles } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  FormAlerts,
  SelectField,
  TextField,
  type Option,
} from '@/components/forms/fields'
import { EMPTY_STATE, type ActionState } from '@/lib/forms/state'
import type { MyClass, Student } from '@/types'
import { CameraModal } from '@/components/students/camera-modal'
import { toast } from '@/components/ui/toast'
import { compressImage } from '@/lib/media/compress-image'

export function StudentForm({
  action,
  classes,
  student,
  cancelHref,
  existingPhotoUrl,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  classes: Array<MyClass>
  student?: Student
  cancelHref: string
  existingPhotoUrl?: string
}) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE)
  const [classId, setClassId] = useState(
    student?.class_id ?? classes[0]?.id ?? ''
  )

  useEffect(() => {
    if (state.message) {
      toast.add({
        title: "Success",
        description: state.message,
        type: "success"
      })
    } else if (state.error) {
      toast.add({
        title: "Error",
        description: state.error,
        type: "error"
      })
    }
  }, [state])
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhotoUrl ?? null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const classOptions: Option[] = classes.map((item) => ({
    value: item.id,
    label: item.name,
  }))

  const noAcademicSetup = classes.length === 0



  const [activeFile, setActiveFile] = useState<File | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalKb: number
    compressedKb: number
    reduction: number
  } | null>(null)

  const processAndSetPhoto = async (rawFile: File) => {
    setIsOptimizing(true)
    try {
      const result = await compressImage(rawFile)
      setActiveFile(result.file)
      setPreviewUrl(URL.createObjectURL(result.file))
      setOptimizationInfo({
        originalKb: Math.max(1, Math.round(result.originalSize / 1024)),
        compressedKb: Math.max(1, Math.round(result.compressedSize / 1024)),
        reduction: result.reductionPercentage,
      })
    } catch (err) {
      console.warn('[Photo Optimizer] Compression fallback to raw file:', err)
      setActiveFile(rawFile)
      setPreviewUrl(URL.createObjectURL(rawFile))
      setOptimizationInfo(null)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void processAndSetPhoto(file)
    }
  }

  const handleAction = (formData: FormData) => {
    if (activeFile) {
      formData.set('photo', activeFile)
    }
    formAction(formData)
  }

  return (
    <form action={handleAction} className="space-y-6">
      {student && (
        <input type="hidden" name="id" value={student.id} />
      )}

      {noAcademicSetup && (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          A student needs a class first.{' '}
          <Link href="/app/classes" className="underline underline-offset-4">
            Add a class
          </Link>
          , then come back here.
        </div>
      )}

      <fieldset className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" disabled={isPending}>
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="full_name"
              label="Full name"
              defaultValue={student?.full_name}
              required
              error={state.fieldErrors?.full_name}
            />
            <TextField
              name="roll_number"
              label="Roll number"
              defaultValue={student?.roll_number ?? undefined}
              error={state.fieldErrors?.roll_number}
            />
            <TextField
              name="phone"
              label="Phone number"
              type="tel"
              defaultValue={student?.phone ?? undefined}
              error={state.fieldErrors?.phone}
            />
            <SelectField
              name="class_id"
              label="Class"
              options={classOptions}
              defaultValue={student?.class_id ?? classOptions[0]?.value}
              required
              error={state.fieldErrors?.class_id}
              onChange={(event) => setClassId(event.target.value)}
            />
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium leading-none">Capture or Upload Photo</label>
            <div className="flex flex-wrap gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  fileInputRef.current?.click()
                }}
              >
                <ImageIcon className="mr-2 size-4" />
                Choose from Gallery
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setIsCameraOpen(true)
                }}
              >
                <Camera className="mr-2 size-4" />
                Take Photo
              </Button>
            </div>
            
            {/* Single hidden file input that actually submits the photo */}
            <input
              ref={fileInputRef}
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {state.fieldErrors?.photo && (
              <p className="text-[0.8rem] font-medium text-destructive">
                {state.fieldErrors.photo}
              </p>
            )}
          </div>
        </div>
        
        {/* Photo Preview Right Side */}
        <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">Photo Preview</p>
          <div className="relative flex h-48 w-40 overflow-hidden rounded-md border bg-muted shadow-sm">
            {isOptimizing ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-muted/80 p-3 text-center">
                <Loader2 className="size-6 animate-spin text-blue-600 mb-2" />
                <span className="text-xs font-semibold">Optimizing photo...</span>
                <span className="text-[10px] text-muted-foreground">Compressing to KB</span>
              </div>
            ) : previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={previewUrl} 
                alt="Student preview" 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-secondary/50 text-muted-foreground">
                <User className="mb-2 size-10 opacity-20" />
                <span className="text-xs">No photo</span>
              </div>
            )}
          </div>

          {optimizationInfo && !isOptimizing && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3 shrink-0" />
              <span>Photo optimized • {optimizationInfo.compressedKb} KB ({optimizationInfo.reduction}% smaller)</span>
            </div>
          )}
        </div>
      </fieldset>

      <FormAlerts state={state} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending || noAcademicSetup || isOptimizing}>
          {(isPending || isOptimizing) && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isOptimizing ? 'Optimizing photo...' : student ? 'Save changes' : 'Create student'}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: 'ghost' })}>
          Cancel
        </Link>
      </div>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(file) => {
          void processAndSetPhoto(file)
        }} 
      />
    </form>
  )
}
