import Link from 'next/link'
import { Download, User } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Student } from '@/types'

export function StudentsTable({
  students,
  hrefFor,
  photoUrls = {},
  emptyMessage = 'No students match these filters yet.',
}: {
  students: Student[]
  hrefFor?: (student: Student) => string
  photoUrls?: Record<string, string>
  emptyMessage?: string
}) {
  if (students.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Photo</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Roll No.</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const href = hrefFor?.(student)
            
            // Photo URL logic
            const photoUrl = student.photo
              ? photoUrls[student.photo.storage_path]
              : null

            return (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex h-10 w-10 overflow-hidden rounded-md border bg-muted shrink-0">
                    {photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={photoUrl} 
                        alt={student.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {href ? (
                    <Link href={href} className="hover:underline">
                      {student.full_name}
                    </Link>
                  ) : (
                    student.full_name
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.roll_number ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.phone ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.class?.name ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  {photoUrl && (
                    <a
                      href={photoUrl}
                      download={`${student.roll_number || 'student'}_${student.full_name.replace(/\\s+/g, '_')}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "flex items-center gap-2")}
                      title="Download Photo"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
