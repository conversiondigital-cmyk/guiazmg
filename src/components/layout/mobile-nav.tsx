"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu, X, MapPin, User, LogOut } from "lucide-react"
import { getInitials } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/search", label: "Categorías" },
  { href: "/mapa", label: "Mapa" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/eventos", label: "Eventos" },
  { href: "/promociones", label: "Promociones" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()

  const user = session?.user
  const role = user?.role
  const isAdmin = role === "ADMIN"
  const isEditor = role === "EDITOR"
  const isAgent = role === "SALES_AGENT"
  const panelHref = isAdmin ? "/admin" : isEditor ? "/editor" : isAgent ? "/agente" : "/dashboard"
  const panelLabel = isAdmin ? "Panel Admin" : isEditor ? "Panel Editor" : isAgent ? "Panel Agente" : "Mi panel"

  const close = () => setOpen(false)
  const handleSignOut = () => {
    close()
    signOut({ callbackUrl: "/" })
  }

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center"
        aria-label="Abrir menú"
      >
        {user ? (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${
              isAdmin ? "bg-red-700" : "bg-blue-600"
            }`}
          >
            {user.name ? getInitials(user.name) : "U"}
          </span>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600">
            <Menu className="h-5 w-5" />
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={close}>
          <div
            className="fixed right-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <Link href="/" onClick={close} className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-800 text-white">
                  <MapPin className="h-3.5 w-3.5 fill-current" />
                </div>
                <span className="font-black text-green-800">Guía ZMG</span>
              </Link>
              <button onClick={close} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Usuario logueado */}
            {user && (
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    isAdmin ? "bg-red-700" : "bg-blue-600"
                  }`}
                >
                  {user.name ? getInitials(user.name) : "U"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.name || "Usuario"}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                  {(isAdmin || isEditor || isAgent) && (
                    <span className="mt-1 inline-flex rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      {role}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label + link.href}
                  href={link.href}
                  onClick={close}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-800"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                {user ? (
                  <>
                    <Link
                      href={panelHref}
                      onClick={close}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-800"
                    >
                      {panelLabel}
                    </Link>
                    {!isAdmin && !isEditor && !isAgent && (
                      <>
                        <Link
                          href="/dashboard/negocio"
                          onClick={close}
                          className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-800"
                        >
                          Mi perfil
                        </Link>
                        <Link
                          href="/dashboard/favorites"
                          onClick={close}
                          className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-800"
                        >
                          Favoritos
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={close}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-800"
                  >
                    <User className="h-4 w-4" />
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </nav>

            {/* CTA */}
            {!user && (
              <div className="border-t border-gray-100 p-4">
                <Link
                  href="/registrar-negocio"
                  onClick={close}
                  className="block w-full rounded-xl bg-green-800 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-green-900"
                >
                  Agregar mi negocio
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
