"use client"

import { useState } from "react"
import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Users,
  Shield,
  Store,
  ShoppingBag,
  Megaphone,
  MessageSquare,
  Tags,
  MapPinned,
  Layers3,
  Gem,
  Rocket,
  CreditCard,
  Search,
  Globe,
  Settings,
  Mail,
  Lock,
  Database,
  FileText,
  Workflow,
  ListChecks,
  Menu,
  X,
  LogOut,
} from "lucide-react"

type SidebarItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  roles?: string[]
}

type SidebarSection = {
  title: string
  items: SidebarItem[]
}

const sections: SidebarSection[] = [
  {
    title: "General",
    items: [
      { label: "Resumen general", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Auditoría", href: "/admin/auditoria", icon: ClipboardList, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Usuarios y roles",
    items: [
      { label: "Usuarios", href: "/admin/usuarios", icon: Users, roles: ["ADMIN"] },
      { label: "Administradores", href: "/admin/usuarios?role=ADMIN", icon: Shield, roles: ["ADMIN"] },
      { label: "Editores", href: "/admin/usuarios?role=EDITOR", icon: Shield, roles: ["ADMIN"] },
      { label: "Agentes comerciales", href: "/admin/agentes", icon: Workflow, roles: ["ADMIN"] },
      { label: "Roles y permisos", href: "/admin/usuarios", icon: Shield, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Perfiles y contenido",
    items: [
      { label: "Perfiles", href: "/admin/negocios", icon: Store, roles: ["ADMIN", "EDITOR", "SALES_AGENT"] },
      { label: "Productos", href: "/admin/anuncios", icon: ShoppingBag, roles: ["ADMIN", "EDITOR"] },
      { label: "Servicios", href: "/admin/solicitudes", icon: MessageSquare, roles: ["ADMIN", "EDITOR"] },
      { label: "Promociones", href: "/admin/cupones", icon: Megaphone, roles: ["ADMIN"] },
      { label: "Marketplace", href: "/admin/marketplace", icon: ShoppingBag, roles: ["ADMIN", "EDITOR"] },
      { label: "Solicitudes", href: "/admin/solicitudes", icon: MessageSquare, roles: ["ADMIN", "EDITOR"] },
      { label: "Reseñas", href: "/admin/reviews", icon: MessageSquare, roles: ["ADMIN", "EDITOR"] },
      { label: "Reportes", href: "/admin/reportes", icon: ListChecks, roles: ["ADMIN", "EDITOR"] },
    ],
  },
  {
    title: "Estructura",
    items: [
      { label: "Categorías", href: "/admin/categorias", icon: Tags, roles: ["ADMIN"] },
      { label: "Subcategorías", href: "/admin/categorias", icon: Layers3, roles: ["ADMIN"] },
      { label: "Municipios", href: "/admin/municipios", icon: MapPinned, roles: ["ADMIN"] },
      { label: "Colonias", href: "/admin/colonias", icon: Globe, roles: ["ADMIN"] },
      { label: "Etiquetas", href: "/admin/seo", icon: Tags, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Monetización",
    items: [
      { label: "Membresías", href: "/admin/planes", icon: Gem, roles: ["ADMIN"] },
      { label: "Boosts", href: "/admin/boosts", icon: Rocket, roles: ["ADMIN"] },
      { label: "Pagos", href: "/admin/pagos", icon: CreditCard, roles: ["ADMIN"] },
      { label: "Cupones", href: "/admin/cupones", icon: Megaphone, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Crecimiento y operación",
    items: [
      { label: "SEO", href: "/admin/seo", icon: Search, roles: ["ADMIN"] },
      { label: "Landing pages", href: "/admin/seo", icon: Globe, roles: ["ADMIN"] },
      { label: "Sitemap e indexación", href: "/admin/seo", icon: Search, roles: ["ADMIN"] },
      { label: "Importaciones", href: "/admin/importar", icon: Database, roles: ["ADMIN"] },
      { label: "Webhooks", href: "/admin/financiero", icon: Workflow, roles: ["ADMIN"] },
      { label: "Logs del sistema", href: "/admin/auditoria", icon: FileText, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Configuración global",
    items: [
      { label: "General", href: "/admin/configuracion/general", icon: Settings, roles: ["ADMIN"] },
      { label: "Branding", href: "/admin/configuracion/branding", icon: Settings, roles: ["ADMIN"] },
      { label: "Autenticación", href: "/admin/configuracion/auth", icon: Lock, roles: ["ADMIN"] },
      { label: "Correo SMTP", href: "/admin/configuracion/correo", icon: Mail, roles: ["ADMIN"] },
      { label: "SMS", href: "/admin/configuracion/sms", icon: FileText, roles: ["ADMIN"] },
      { label: "Pagos", href: "/admin/configuracion/pagos", icon: CreditCard, roles: ["ADMIN"] },
      { label: "Membresías", href: "/admin/configuracion/membresias", icon: Gem, roles: ["ADMIN"] },
      { label: "Boosts", href: "/admin/configuracion/boosts", icon: Rocket, roles: ["ADMIN"] },
      { label: "SEO global", href: "/admin/configuracion/seo", icon: Search, roles: ["ADMIN"] },
      { label: "Seguridad", href: "/admin/configuracion/seguridad", icon: Shield, roles: ["ADMIN"] },
      { label: "Storage", href: "/admin/configuracion/storage", icon: Database, roles: ["ADMIN"] },
      { label: "Moderación", href: "/admin/configuracion/moderacion", icon: ListChecks, roles: ["ADMIN"] },
      { label: "Legal", href: "/admin/configuracion/legal", icon: FileText, roles: ["ADMIN"] },
      { label: "Feature Flags", href: "/admin/configuracion/flags", icon: Workflow, roles: ["ADMIN"] },
    ],
  },
]

function canSee(item: SidebarItem, role: string) {
  return !item.roles || item.roles.includes(role)
}

export function AdminSidebar({ user }: { user: { name?: string | null; email?: string | null; role?: string | null } }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = user.role || "ADMIN"

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg lg:hidden"
        aria-label="Abrir menú admin"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 border-r bg-slate-950 text-slate-100 transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Panel de Administración</p>
            <p className="text-sm font-semibold text-white">Guía ZMG</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-slate-300" />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.filter((item) => canSee(item, role)).map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.label + item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 border-t border-slate-800 pt-4">
            <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              <LogOut className="h-4 w-4" />
              Volver al sitio
            </Link>
          </div>
        </nav>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </>
  )
}
