"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Heart,
  Star,
  Package,
  MessageCircle,
  Bell,
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Store,
} from "lucide-react"
import { useState } from "react"

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/cuenta",               label: "Inicio",           icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Actividad",
    items: [
      { href: "/cuenta/favoritos",     label: "Favoritos",        icon: Heart },
      { href: "/cuenta/resenas",       label: "Mis reseñas",      icon: Star },
      { href: "/cuenta/marketplace",   label: "Marketplace",      icon: Package },
      { href: "/cuenta/solicitudes",   label: "Solicitudes",      icon: MessageCircle },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/cuenta/notificaciones", label: "Notificaciones",  icon: Bell },
      { href: "/cuenta/configuracion",  label: "Configuración",   icon: Settings },
      { href: "/cuenta/ayuda",          label: "Ayuda",           icon: HelpCircle },
    ],
  },
]

export function CuentaSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white shadow-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="text-xl font-bold">
            <span className="text-green-700">Guía</span> ZMG
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = (item as any).exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-green-50 text-green-800"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="border-t pt-4 space-y-1">
            <Link
              href="/registrar-negocio"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
            >
              <Store className="h-4 w-4" />
              Registrar mi negocio
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}
