"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, BarChart3, ClipboardList, Activity, FileText,
  Users, Shield, Pencil, Briefcase, Lock, UserX, Clock,
  Store, ShoppingBag, Wrench, Tag, Package, MessageSquare, Star, Flag, BadgeCheck, CalendarDays,
  Tags, Layers3, MapPinned, Globe,
  Gem, Rocket, CreditCard, Gift, Award, DollarSign,
  Search, TrendingUp,
  Upload, Webhook, Database, Images,
  Settings, Mail, ListChecks, Workflow,
  Menu, X, LogOut, ChevronRight, ChevronDown,
  BookOpen,
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
    ],
  },
  {
    title: "Usuarios y roles",
    items: [
      { label: "Todos los usuarios", href: "/admin/usuarios", icon: Users },
      { label: "Administradores", href: "/admin/usuarios?rol=ADMIN", icon: Shield },
      { label: "Editores", href: "/admin/editores", icon: Pencil },
      { label: "Agentes comerciales", href: "/admin/agentes", icon: Briefcase },
      { label: "Roles y permisos", href: "/admin/roles", icon: Lock },
      { label: "Cuentas suspendidas", href: "/admin/usuarios?status=suspended", icon: UserX },
      { label: "Actividad de usuarios", href: "/admin/actividad-usuarios", icon: Clock },
    ],
  },
  {
    title: "Blog",
    items: [
      { label: "Moderar artículos", href: "/admin/blog", icon: BookOpen },
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
      { label: "Verificaciones", href: "/admin/verificaciones", icon: BadgeCheck },
      { label: "Eventos", href: "/admin/eventos", icon: CalendarDays },
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
      { label: "Reclamos de negocios", href: "/admin/reclamos", icon: ClipboardList },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Carrusel del inicio", href: "/admin/hero", icon: Images },
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

const STORAGE_KEY = "admin-sidebar-expanded"

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

function splitHref(href: string): { path: string; qs: string } {
  const i = href.indexOf("?")
  return i === -1 ? { path: href, qs: "" } : { path: href.slice(0, i), qs: href.slice(i + 1) }
}

// Puntúa qué tan bien coincide un item con la ruta+query actual.
//  -1  = no coincide.
//  Un item con query params que coinciden gana SIEMPRE sobre uno sin query
//  en la misma ruta (p.ej. "Administradores" → ?rol=ADMIN gana sobre
//  "Todos los usuarios"). Entre items sin query, gana el path más largo.
type ReadonlyParams = { get(name: string): string | null }

function scoreHref(
  href: string,
  pathname: string,
  sp: ReadonlyParams
): number {
  const { path, qs } = splitHref(href)
  const pathMatch =
    path === "/admin"
      ? pathname === "/admin"
      : pathname === path || pathname.startsWith(path + "/")
  if (!pathMatch) return -1
  if (qs) {
    const want = new URLSearchParams(qs)
    for (const [k, v] of Array.from(want.entries())) {
      if (sp.get(k) !== v) return -1
    }
    return 100_000 + path.length + qs.length
  }
  return path.length
}

type ActiveMatch = { section: string | null; href: string | null; found: boolean }

// Calcula el ÚNICO item activo (el de mayor puntaje). Así nunca se resaltan
// dos items a la vez, ni siquiera cuando un href se repite en dos secciones.
function findActive(pathname: string, sp: ReadonlyParams): ActiveMatch {
  let best = -1
  let match: ActiveMatch = { section: null, href: null, found: false }
  for (const s of sections) {
    for (const item of s.items) {
      const score = scoreHref(item.href, pathname, sp)
      if (score > best) {
        best = score
        match = { section: s.title, href: item.href, found: true }
      }
    }
  }
  return match
}

export function AdminSidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null }
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const spKey = searchParams.toString()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")

  // Un único item activo, sensible a los query params (?rol, ?status).
  const active = useMemo(
    () => findActive(pathname, searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, spKey]
  )
  const activeTitle = active.section

  // La sección de la página actual arranca abierta (sin parpadeo en SSR).
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    activeTitle ? { [activeTitle]: true } : {}
  )

  // Restaura las secciones que el admin dejó abiertas la última vez.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, boolean>
        setExpanded((prev) => ({ ...saved, ...prev }))
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Al navegar, siempre revela la sección de la ruta actual.
  useEffect(() => {
    if (activeTitle) {
      setExpanded((prev) => (prev[activeTitle] ? prev : { ...prev, [activeTitle]: true }))
    }
  }, [activeTitle])

  function persist(next: Record<string, boolean>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  function toggleSection(title: string) {
    setExpanded((prev) => {
      const next = { ...prev, [title]: !prev[title] }
      persist(next)
      return next
    })
  }

  function setAll(value: boolean) {
    const next: Record<string, boolean> = {}
    for (const s of sections) next[s.title] = value
    setExpanded(next)
    persist(next)
  }

  const q = normalize(query.trim())
  const searching = q.length > 0

  const filteredSections = useMemo(() => {
    if (!searching) return sections
    return sections
      .map((s) => {
        // Si el título de la sección coincide, mostramos todos sus items;
        // de lo contrario, solo los items que coinciden.
        const sectionMatch = normalize(s.title).includes(q)
        return {
          ...s,
          items: sectionMatch ? s.items : s.items.filter((i) => normalize(i.label).includes(q)),
        }
      })
      .filter((s) => s.items.length > 0)
  }, [q, searching])

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

        {/* Search */}
        <div className="shrink-0 border-b border-slate-800 px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el menú..."
              aria-label="Buscar en el menú"
              className="w-full rounded-lg bg-slate-800/80 py-2 pl-8 pr-8 text-xs text-slate-100 outline-none ring-1 ring-inset ring-slate-700 transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {!searching && (
            <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-slate-500">
              <button onClick={() => setAll(true)} className="hover:text-slate-300">
                Expandir todo
              </button>
              <span className="text-slate-700">·</span>
              <button onClick={() => setAll(false)} className="hover:text-slate-300">
                Contraer todo
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {filteredSections.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-slate-500">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          )}

          {filteredSections.map((section, si) => {
            const open = searching || (expanded[section.title] ?? false)
            const hasActive = section.title === activeTitle
            return (
              <div key={section.title} className={cn(si > 0 && "mt-1")}>
                <button
                  type="button"
                  onClick={() => {
                    if (!searching) toggleSection(section.title)
                  }}
                  aria-expanded={open}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] transition-colors",
                    hasActive ? "text-blue-300" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {section.title}
                    {hasActive && !open && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    )}
                  </span>
                  {!searching && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        open ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  )}
                </button>

                {open && (
                  <div className="mb-1 mt-0.5 space-y-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        active.found &&
                        section.title === active.section &&
                        item.href === active.href
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
                )}
              </div>
            )
          })}

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
