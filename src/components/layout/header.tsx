"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserNav } from "@/components/layout/user-nav"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ChevronDown, User } from "lucide-react"
import { useState, useEffect } from "react"
import { NAV_LINKS } from "@/lib/nav-links"

// El header se remonta en cada navegación (cada página lo renderiza), así que su
// fetch de categorías salía en cada carga. Las categorías cambian rara vez → se
// cachean a nivel de módulo y se comparte la petición en vuelo: una sola por sesión.
type NavCategory = { id: string; name: string; slug: string }
let categoriesCache: NavCategory[] | null = null
let categoriesInflight: Promise<NavCategory[]> | null = null
function loadCategories(): Promise<NavCategory[]> {
  if (categoriesCache) return Promise.resolve(categoriesCache)
  if (categoriesInflight) return categoriesInflight
  categoriesInflight = fetch("/api/categories")
    .then((r) => (r.ok ? r.json() : []))
    .then((data) => {
      categoriesCache = Array.isArray(data) ? data : []
      return categoriesCache
    })
    .catch(() => [])
    .finally(() => {
      categoriesInflight = null
    })
  return categoriesInflight
}

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [categories, setCategories] = useState<NavCategory[]>(categoriesCache ?? [])
  const [showCategories, setShowCategories] = useState(false)

  // Resalta el enlace de la página actual. Antes se seguía por click (setActiveNav),
  // así que entrar directo a /mapa marcaba "Inicio"; usePathname es la fuente real
  // (mismo patrón que los 6 sidebars). "/" activo solo exacto; el resto por prefijo.
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
  const navLinkClass = (active: boolean) =>
    `flex items-center gap-0.5 px-3 py-1.5 text-sm font-medium transition-colors relative ${
      active ? "text-green-800" : "text-gray-600 hover:text-green-800"
    }`

  useEffect(() => {
    if (categoriesCache) return // ya cacheado desde una navegación previa
    let active = true
    loadCategories().then((data) => {
      if (active) setCategories(data)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Guía ZMG" className="h-9 w-auto" />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) =>
            link.hasDropdown ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
              >
                <Link href={link.href} className={navLinkClass(isActive(link.href))}>
                  {link.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCategories ? "rotate-180" : ""}`} />
                </Link>
                {showCategories && categories.length > 0 && (
                  <div className="absolute left-0 top-full z-50 w-72 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                    <div className="grid grid-cols-2 gap-0.5">
                      {categories.slice(0, 12).map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/categoria/${cat.slug}`}
                          className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-green-50 hover:text-green-800 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/search"
                      className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 transition-colors"
                    >
                      Ver todas las categorías →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link key={link.label} href={link.href} className={navLinkClass(isActive(link.href))}>
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-amber-500" />
                )}
              </Link>
            )
          )}
        </nav>

        {/* Actions */}
        <div className="ml-auto hidden lg:flex items-center gap-3">
          {session ? (
            <>
              <NotificationDropdown />
              <UserNav user={session.user} />
            </>
          ) : (
            <>
              <Link
                href="/onboarding/vendedor"
                className="rounded-lg border border-green-800 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 transition-colors"
              >
                Agregar negocio
              </Link>
              <Link
                href="/auth/login"
                className="flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 transition-colors"
              >
                <User className="h-4 w-4" />
                Iniciar sesión
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {session && <NotificationDropdown />}
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
