import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SchoolForm } from "../school-form"

export default async function NewSchoolPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add School</h2>
        <p className="text-muted-foreground">
          Register a new school to the platform.
        </p>
      </div>

      <SchoolForm />
    </div>
  )
}

