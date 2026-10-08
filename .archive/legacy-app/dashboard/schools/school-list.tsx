"use client"

import { School } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button, buttonVariants } from "@/components/ui/button"
import { Edit2, Eye, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface SchoolListProps {
  schools: School[]
}

export function SchoolList({ schools }: SchoolListProps) {
  if (schools.length === 0) {
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
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold">No schools added</h2>
          <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
            You have not added any schools yet. Add a school to start managing their student ID cards.
          </p>
          <Link href="/dashboard/schools/new" className={buttonVariants()}>Add School</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>School Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.map((school) => (
            <TableRow key={school.id}>
              <TableCell className="font-medium">{school.name}</TableCell>
              <TableCell>{school.code}</TableCell>
              <TableCell>
                <Badge variant={school.is_active ? "default" : "secondary"}>
                  {school.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(school.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-muted rounded-md inline-flex items-center justify-center">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href={`/dashboard/schools/${school.id}`} className="flex w-full items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href={`/dashboard/schools/${school.id}/edit`} className="flex w-full items-center">
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit School
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
