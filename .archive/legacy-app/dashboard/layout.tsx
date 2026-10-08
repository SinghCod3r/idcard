import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile?.role} />
      <div className="flex-1 flex flex-col md:pl-64">
        <Header user={user} />
        <main className="flex-1 p-6 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  )
}

