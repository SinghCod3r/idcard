"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, CreditCard, LayoutDashboard, Settings, Users, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SidebarProps {
  role?: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      show: true,
    },
    {
      label: "Schools",
      icon: Building2,
      href: "/dashboard/schools",
      show: role === "SUPER_ADMIN",
    },
    {
      label: "Students",
      icon: Users,
      href: "/dashboard/students",
      show: true, // both admin and staff can see this (filtered by RLS)
    },
    {
      label: "ID Cards",
      icon: CreditCard,
      href: "/dashboard/cards",
      show: true,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      show: true,
    },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="hidden md:flex flex-col fixed inset-y-0 z-50 w-64 bg-slate-900 text-white">
      <div className="p-6 flex items-center gap-2 font-semibold text-lg tracking-tight">
        <CreditCard className="w-6 h-6" />
        ID Card Platform
      </div>
      
      <div className="flex-1 px-4 py-2 space-y-1">
        {routes
          .filter((route) => route.show)
          .map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
                pathname === route.href || pathname.startsWith(route.href + '/') 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400"
              )}
            >
              <route.icon className="w-5 h-5" />
              {route.label}
            </Link>
          ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )
}

