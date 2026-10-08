import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { SchoolList } from "./school-list"

export default async function SchoolsPage() {
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

  const { data: schools } = await supabase
    .from("schools")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schools</h2>
          <p className="text-muted-foreground">
            Manage registered schools and their access.
          </p>
        </div>
        <Link href="/dashboard/schools/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </Link>
      </div>

      <SchoolList schools={schools || []} />
    </div>
  )
}
