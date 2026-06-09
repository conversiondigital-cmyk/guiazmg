"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, FileText, FilePlus, BookOpen,
  FolderOpen, Tags, Image, Search,
  User, Bell, LogOut, Menu, X, ChevronRight,
  Pencil,
} from "lucide-react"

const navGroups = [
  {
    label: "Blog",
    items: [
      { label: "Dashboard editorial", href: "/editor",            icon: LayoutDashboard, exact: true },
      { label: "Artículos",           href: "/editor/blog",       icon: BookOpen },
      { label: "Nuevo artículo",      href: "/editor/blog/nuevo", icon: FilePlus },
    ],
  },
  {
    label: "SEO Editorial",
    items: [
      { label: "Contenido SEO", href: "/editor/seo", icon: Search },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { label: "Mi cuenta",      href: "/editor/cuenta",         icon: User },
      { label: "Notificaciones", href: "/editor/notificaciones", icon: Bell },
    ],
  },
]

interface EditorSidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}

export function EditorSidebar({ user }: EditorSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white shadow-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Pencil className="h-4 w-4 text-green-700" />
            <span><span className="text-green-700">Guía</span> ZMG</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* User badge */}
        <div className="flex items-center gap-3 border-b bg-gray-50 px-5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
            {(user.name ?? user.email ?? "E").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-900">{user.name ?? user.email}</p>
            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-700">
              Editor
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = (item as any).exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-green-50 text-green-800"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="border-t pt-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Volver al sitio
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}
