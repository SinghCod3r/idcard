import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudentForm } from "../student-form"

export default async function NewStudentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Get allowed schools
  let query = supabase.from("schools").select("id, name, code").eq("is_active", true)
  
  if (profile?.role !== "SUPER_ADMIN") {
    const { data: member } = await supabase
      .from("school_members")
      .select("school_id")
      .eq("user_id", user.id)
      .single()
      
    if (member) {
      query = query.eq("id", member.school_id)
    }
  }

  const { data: schools } = await query

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add Student</h2>
        <p className="text-muted-foreground">
          Enter student details and upload a photograph for the ID card.
        </p>
      </div>

      <StudentForm schools={schools || []} />
    </div>
  )
}

