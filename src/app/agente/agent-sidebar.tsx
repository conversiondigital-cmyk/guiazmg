"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard, Store, UserPlus, Menu, X, LogOut,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/agente", icon: LayoutDashboard },
  { label: "Negocios", href: "/agente/negocios", icon: Store },
  { label: "Prospectos", href: "/agente/prospectos", icon: UserPlus },
]

interface AgentSidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}

export function AgentSidebar({ user }: AgentSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <Link href="/agente" className="font-heading text-base font-semibold tracking-tight">
          Guía ZMG
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name || "Agente"}
          </span>
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" size="icon-sm" type="submit">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </header>

      <aside
        data-open={mobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <span className="font-heading text-base font-semibold">Guía ZMG</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Agente de Ventas
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
