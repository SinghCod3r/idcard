import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/authz/guards'
import { PHOTO_BUCKET } from '@/lib/db/photos'
import { getCollege } from '@/lib/db/colleges'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    await requireSuperAdmin()
    
    const { collegeId } = await params
    
    const college = await getCollege(collegeId)
    if (!college) {
      return new NextResponse('College not found', { status: 404 })
    }

    const supabase = await createClient()

    // Fetch all students in this college who have a photo
    const { data: students, error: dbError } = await supabase
      .from('students')
      .select('id, full_name, roll_number, photo:student_photos!inner(storage_path, mime_type)')
      .eq('college_id', collegeId)

    if (dbError) {
      console.error('Error fetching students for zip:', dbError)
      return new NextResponse('Database error', { status: 500 })
    }

    if (!students || students.length === 0) {
      return new NextResponse('No photos found for this college', { status: 404 })
    }

    const zip = new JSZip()
    
    // Download photos
    for (const student of students) {
      // Supabase returns related tables as arrays unless configured as one-to-one strictly
      const photo = Array.isArray(student.photo) ? student.photo[0] : student.photo
      if (!photo || !photo.storage_path) continue
      
      const storagePath = photo.storage_path
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .download(storagePath)

      if (downloadError) {
        console.error(`Failed to download ${storagePath}:`, downloadError)
        continue
      }

      if (fileData) {
        // Sanitize name and construct filename
        const safeName = student.full_name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_')
        const rollNumberStr = student.roll_number ? `${student.roll_number}_` : ''
        
        // Determine extension
        let ext = 'jpg'
        if (photo.mime_type === 'image/png') ext = 'png'
        else if (photo.mime_type === 'image/webp') ext = 'webp'
        
        const filename = `${rollNumberStr}${safeName}.${ext}`
        
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer()
        zip.file(filename, arrayBuffer)
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })
    
    const safeCollegeName = college.name.replace(/[^a-z0-9]/gi, '_')

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeCollegeName}_Photos.zip"`,
      },
    })
  } catch (err: any) {
    if (err.message === 'Not authorized' || err.message === 'SUPER_ADMIN required.') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    console.error('Error creating ZIP:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
