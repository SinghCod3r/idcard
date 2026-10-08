import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { describeDbError, ActionError } from './errors'
import { writeAuditEntry } from './audit'

export const PHOTO_BUCKET = 'student-photos'
const MAX_BYTES = 5 * 1024 * 1024
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Student photographs are private. They live in a non-public bucket under
 * <college>/<student>, every read is a short-lived signed url minted from the
 * caller's own session, and the storage policies key on that first path
 * segment. There is no code path that produces a lasting public url.
 */
export async function uploadStudentPhoto(options: {
  collegeId: string
  studentId: string
  file: File
}): Promise<{ storagePath: string }> {
  const supabase = await createClient()

  const extension = EXTENSIONS[options.file.type]
  if (!extension) {
    throw new ActionError('Please choose a JPG, PNG or WebP image.')
  }
  if (options.file.size === 0) {
    throw new ActionError('That file appears to be empty.')
  }
  if (options.file.size > MAX_BYTES) {
    throw new ActionError('Please choose an image smaller than 5 MB.')
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', options.studentId)
    .eq('college_id', options.collegeId)
    .maybeSingle()

  if (studentError) throw describeDbError('photos.check', studentError)
  if (!student) throw new ActionError('That student could not be found.')

  const storagePath = `${options.collegeId}/${student.id}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, options.file, {
      contentType: options.file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('[photos] upload failed', uploadError.message)
    throw new ActionError('We could not upload that photo. Please try again.')
  }

  // A replaced photo may have a different extension, so clear the old object(s).
  // We don't use maybeSingle() because the lack of a UNIQUE constraint could cause it to throw if duplicates exist.
  const { data: previousPhotos } = await supabase
    .from('student_photos')
    .select('id, storage_path')
    .eq('student_id', student.id)

  if (previousPhotos && previousPhotos.length > 0) {
    const pathsToRemove = previousPhotos
      .map(p => p.storage_path)
      .filter(p => p !== storagePath)
    
    if (pathsToRemove.length > 0) {
      await supabase.storage.from(PHOTO_BUCKET).remove(pathsToRemove)
    }

    // Since we don't have a UNIQUE constraint on student_id, ON CONFLICT upsert will fail.
    // Instead, delete any existing rows for this student before inserting the new one.
    await supabase.from('student_photos').delete().eq('student_id', student.id)
  }

  const { error: rowError } = await supabase.from('student_photos').insert({
    student_id: student.id,
    college_id: options.collegeId,
    storage_path: storagePath,
    mime_type: options.file.type,
    file_size: options.file.size,
  })

  if (rowError) {
    throw describeDbError('photos.record', rowError, {
      '23514': 'That photo could not be attached to this student.',
    })
  }

  await writeAuditEntry({
    collegeId: options.collegeId,
    action: 'student.photo_uploaded',
    entity: 'students',
    entityId: student.id,
  })

  return { storagePath }
}

export async function getPhotoUrls(
  paths: string[],
  ttlSeconds = 120
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}

  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, ttlSeconds)

  if (error) {
    console.error('[photos] signing failed', error.message)
    return {}
  }

  const urls: Record<string, string> = {}
  data.forEach((entry, index) => {
    const path = paths[index]
    if (entry.signedUrl && !entry.error) urls[path] = entry.signedUrl
  })
  return urls
}

export async function getPhotoUrl(
  path: string,
  ttlSeconds = 300
): Promise<string | null> {
  const urls = await getPhotoUrls([path], ttlSeconds)
  return urls[path] ?? null
}

export async function deleteStudentPhoto(options: {
  collegeId: string
  studentId: string
}): Promise<void> {
  const supabase = await createClient()

  const { data: photo, error: findError } = await supabase
    .from('student_photos')
    .select('storage_path')
    .eq('student_id', options.studentId)
    .eq('college_id', options.collegeId)
    .maybeSingle()

  if (findError) throw describeDbError('photos.find', findError)
  if (!photo) return

  const { error: removeError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path])

  if (removeError) {
    console.error('[photos] remove failed', removeError.message)
  }

  const { error: deleteError } = await supabase
    .from('student_photos')
    .delete()
    .eq('student_id', options.studentId)
    .eq('college_id', options.collegeId)

  if (deleteError) throw describeDbError('photos.delete', deleteError)

  await writeAuditEntry({
    collegeId: options.collegeId,
    action: 'student.photo_deleted',
    entity: 'students',
    entityId: options.studentId,
  })
}
