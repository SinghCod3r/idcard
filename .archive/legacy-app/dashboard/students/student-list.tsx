"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Edit2, Eye, Image as ImageIcon, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface StudentListProps {
  students: any[]
}

export function StudentList({ students }: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-10 w-10 text-muted-foreground"
              viewBox="0 0 24 24"
            >
              <path d="M12 14v-2m0 0V9m0 3h3m-3 0H9m12 3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold">No students found</h2>
          <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
            No students match your criteria, or none have been added yet.
          </p>
          <Link href="/dashboard/students/new" className={buttonVariants()}>Add Student</Link>
        </div>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default'
      case 'UNDER_REVIEW': return 'secondary'
      case 'REJECTED': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admission No.</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Class/Section</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Card Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.admission_number || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    {student.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={student.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-xs text-muted-foreground">{student.school?.name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>{student.class?.name || '-'}</div>
                <div className="text-xs text-muted-foreground">{student.section?.name || '-'}</div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(student.status)}>
                  {student.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={student.card_status === 'PRINTED' ? 'default' : 'outline'}>
                  {student.card_status.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-muted rounded-md inline-flex items-center justify-center">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href={`/dashboard/students/${student.id}`} className="flex w-full items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href={`/dashboard/students/${student.id}/edit`} className="flex w-full items-center">
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Record
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
