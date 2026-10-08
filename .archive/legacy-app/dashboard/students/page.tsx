import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Plus, Upload } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { StudentList } from "./student-list"

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // For school staff/admins, get their school_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
    
  let schoolId = null

  if (profile?.role !== "SUPER_ADMIN") {
    const { data: schoolMember } = await supabase
      .from("school_members")
      .select("school_id")
      .eq("user_id", user.id)
      .single()
      
    if (schoolMember) {
      schoolId = schoolMember.school_id
    }
  }

  // Fetch initial data (limit 50 for performance, ideally we'd use pagination)
  let query = supabase
    .from("students")
    .select(`
      *,
      school:schools(name),
      session:academic_sessions(name),
      class:classes(name),
      section:sections(name)
    `)
    .order("created_at", { ascending: false })
    .limit(50)
    
  if (schoolId) {
    query = query.eq("school_id", schoolId)
  }

  const { data: students } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">
            Manage student records and their ID card status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/students/import" className={buttonVariants({ variant: "outline" })}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Link>
          <Link href="/dashboard/students/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        {/* Filters will go here */}
        <div className="text-sm text-muted-foreground mb-4">Filters coming soon...</div>
        <StudentList students={students || []} />
      </div>
    </div>
  )
}
