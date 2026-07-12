"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Wrench,
  Tag,
  Package,
  MessageCircle,
  Users,
  BarChart3,
  TrendingUp,
  Star,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { useState } from "react"

type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean }
type NavGroup = { label: string; items: NavItem[] }

function buildGroups(mode: "EMPRENDEDOR" | "NEGOCIO"): NavGroup[] {
  const isEmprendedor = mode === "EMPRENDEDOR"

  return [
    {
      label: "General",
      items: [
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/negocio", label: isEmprendedor ? "Mi emprendimiento" : "Mi negocio", icon: Store },
      ],
    },
    {
      label: isEmprendedor ? "Mi catálogo" : "Operación comercial",
      items: [
        { href: "/dashboard/productos", label: "Productos", icon: ShoppingBag },
        { href: "/dashboard/servicios", label: "Servicios", icon: Wrench },
        { href: "/dashboard/promociones", label: "Promociones", icon: Tag },
        ...(!isEmprendedor ? [{ href: "/dashboard/marketplace", label: "Marketplace", icon: Package }] : []),
      ],
    },
    ...(isEmprendedor
      ? [
          {
            label: "Marketplace",
            items: [{ href: "/dashboard/marketplace", label: "Mis publicaciones", icon: Package }],
          },
        ]
      : []),
    {
      label: "Interacción",
      items: [
        ...(!isEmprendedor ? [{ href: "/dashboard/resenas", label: "Reseñas", icon: MessageCircle }] : []),
        { href: "/dashboard/leads", label: "Clientes potenciales", icon: Users },
        { href: "/dashboard/estadisticas", label: isEmprendedor ? "Estadísticas" : "Estadísticas completas", icon: BarChart3 },
      ],
    },
    {
      label: isEmprendedor ? "Comercial" : "Monetización",
      items: [
        { href: "/dashboard/membresia", label: isEmprendedor ? "Mi plan" : "Membresía", icon: Star },
        { href: "/dashboard/boosts", label: "Boosts", icon: TrendingUp },
        { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard },
      ],
    },
    {
      label: "Cuenta",
      items: [
        { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell },
        { href: "/dashboard/configuracion", label: "Configuración de cuenta", icon: Settings },
        { href: "/dashboard/ayuda", label: "Ayuda", icon: HelpCircle },
      ],
    },
  ]
}

interface DashboardSidebarProps {
  profileType?: "EMPRENDEDOR" | "NEGOCIO"
}

export function DashboardSidebar({ profileType = "NEGOCIO" }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navGroups = buildGroups(profileType)
  const isEmprendedor = profileType === "EMPRENDEDOR"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white shadow-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform lg:translate-x-0 lg:static lg:z-auto",
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

        {/* Plan badge */}
        <div className="px-5 py-2.5 border-b bg-gray-50">
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            isEmprendedor
              ? "bg-amber-100 text-amber-800"
              : "bg-green-100 text-green-800"
          )}>
            {isEmprendedor ? "Plan Emprendedor" : "Plan Negocio"}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.exact
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

          <div className="border-t pt-4">
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
