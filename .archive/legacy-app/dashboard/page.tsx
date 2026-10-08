import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here is an overview of your platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat cards will go here */}
      </div>
    </div>
  )
}

