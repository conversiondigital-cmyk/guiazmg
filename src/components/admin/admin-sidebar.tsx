"use client"

import { useState } from "react"
import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, BarChart3, ClipboardList, Activity, FileText,
  Users, Shield, Pencil, Briefcase, Lock, UserX, Clock,
  Store, ShoppingBag, Wrench, Tag, Package, MessageSquare, Star, Flag,
  Tags, Layers3, MapPinned, Globe,
  Gem, Rocket, CreditCard, Gift, Award, DollarSign,
  Search, TrendingUp,
  Upload, Webhook, Database,
  Settings, Mail, ListChecks, Workflow,
  Menu, X, LogOut, ChevronRight,
  BookOpen, PenSquare,
} from "lucide-react"

type SidebarItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}
type SidebarSection = {
  title: string
  items: SidebarItem[]
}

const sections: SidebarSection[] = [
  {
    title: "Resumen y monitoreo",
    items: [
      { label: "Resumen general", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics globales", href: "/admin/analytics", icon: BarChart3 },
      { label: "Auditoría", href: "/admin/auditoria", icon: ClipboardList },
      { label: "Estado del sistema", href: "/admin/estado", icon: Activity },
      { label: "Logs del sistema", href: "/admin/logs", icon: FileText },
    ],
  },
  {
    title: "Usuarios y roles",
    items: [
      { label: "Todos los usuarios", href: "/admin/usuarios", icon: Users },
      { label: "Administradores", href: "/admin/admins", icon: Shield },
      { label: "Editores", href: "/admin/editores", icon: Pencil },
      { label: "Agentes comerciales", href: "/admin/agentes", icon: Briefcase },
      { label: "Roles y permisos", href: "/admin/roles", icon: Lock },
      { label: "Cuentas suspendidas", href: "/admin/suspendidos", icon: UserX },
      { label: "Actividad de usuarios", href: "/admin/actividad-usuarios", icon: Clock },
    ],
  },
  {
    title: "Blog",
    items: [
      { label: "Moderar artículos", href: "/admin/blog",     icon: BookOpen },
      { label: "Gestión de editores", href: "/admin/editores", icon: PenSquare },
    ],
  },
  {
    title: "Perfiles y contenido",
    items: [
      { label: "Perfiles", href: "/admin/negocios", icon: Store },
      { label: "Productos", href: "/admin/anuncios", icon: ShoppingBag },
      { label: "Servicios", href: "/admin/servicios", icon: Wrench },
      { label: "Promociones", href: "/admin/promociones", icon: Tag },
      { label: "Marketplace", href: "/admin/marketplace", icon: Package },
      { label: "Solicitudes", href: "/admin/solicitudes", icon: MessageSquare },
      { label: "Reseñas", href: "/admin/reviews", icon: Star },
      { label: "Reportes", href: "/admin/reportes", icon: Flag },
    ],
  },
  {
    title: "Estructura del directorio",
    items: [
      { label: "Categorías", href: "/admin/categorias", icon: Tags },
      { label: "Subcategorías", href: "/admin/subcategorias", icon: Layers3 },
      { label: "Municipios", href: "/admin/municipios", icon: MapPinned },
      { label: "Colonias", href: "/admin/colonias", icon: Globe },
      { label: "Etiquetas / tags", href: "/admin/etiquetas", icon: Tags },
    ],
  },
  {
    title: "Negocio y monetización",
    items: [
      { label: "Membresías", href: "/admin/planes", icon: Gem },
      { label: "Boosts", href: "/admin/boosts", icon: Rocket },
      { label: "Definiciones de boost", href: "/admin/boosts-definiciones", icon: Rocket },
      { label: "Pagos", href: "/admin/pagos", icon: CreditCard },
      { label: "Financiero", href: "/admin/financiero", icon: DollarSign },
      { label: "Cupones descuento", href: "/admin/cupones", icon: Gift },
      { label: "Regalos y beneficios", href: "/admin/promociones-admin", icon: Award },
    ],
  },
  {
    title: "SEO y crecimiento",
    items: [
      { label: "SEO y landing pages", href: "/admin/seo", icon: Search },
      { label: "Búsquedas populares", href: "/admin/busquedas", icon: TrendingUp },
      { label: "Reclamos de perfil", href: "/admin/reclamos", icon: ClipboardList },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Importaciones", href: "/admin/importar", icon: Upload },
      { label: "Webhooks", href: "/admin/webhooks", icon: Webhook },
      { label: "Datos demo", href: "/admin/demo", icon: Database },
    ],
  },
  {
    title: "Configuración global",
    items: [
      { label: "General", href: "/admin/configuracion/general", icon: Settings },
      { label: "Branding", href: "/admin/configuracion/branding", icon: Settings },
      { label: "Autenticación", href: "/admin/configuracion/auth", icon: Lock },
      { label: "Correo SMTP", href: "/admin/configuracion/correo", icon: Mail },
      { label: "SMS", href: "/admin/configuracion/sms", icon: MessageSquare },
      { label: "Pagos", href: "/admin/configuracion/pagos", icon: CreditCard },
      { label: "Membresías", href: "/admin/configuracion/membresias", icon: Gem },
      { label: "Boosts", href: "/admin/configuracion/boosts", icon: Rocket },
      { label: "SEO global", href: "/admin/configuracion/seo", icon: Search },
      { label: "Seguridad", href: "/admin/configuracion/seguridad", icon: Shield },
      { label: "Storage", href: "/admin/configuracion/storage", icon: Database },
      { label: "Moderación", href: "/admin/configuracion/moderacion", icon: ListChecks },
      { label: "Legal", href: "/admin/configuracion/legal", icon: FileText },
      { label: "Feature Flags", href: "/admin/configuracion/flags", icon: Workflow },
    ],
  },
]

export function AdminSidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null }
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg lg:hidden"
        aria-label="Abrir menú admin"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-black bg-slate-900 text-slate-100 shadow-2xl transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Panel de Administración
            </p>
            <p className="text-sm font-bold text-white">Guía ZMG</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* User badge */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-800 px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user.name ?? user.email}</p>
            <span className="inline-flex items-center rounded-full bg-blue-900/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-300">
              {user.role ?? "ADMIN"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section, si) => (
            <div key={section.title} className={cn("mb-1", si > 0 && "mt-4")}>
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="mt-6 border-t border-slate-800 pt-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Volver al sitio
            </Link>
          </div>
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
