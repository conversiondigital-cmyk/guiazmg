"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Menu, X, MapPin, User } from "lucide-react"

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

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-800 text-white">
                  <MapPin className="h-3.5 w-3.5 fill-current" />
                </div>
                <span className="font-black text-green-800">Guía ZMG</span>
              </Link>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label + link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
                {session ? (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors">
                      Mi panel
                    </Link>
                    <Link href="/dashboard/negocio" onClick={() => setOpen(false)}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors">
                      Mi perfil
                    </Link>
                  </>
                ) : (
                  <Link href="/auth/login" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors">
                    <User className="h-4 w-4" />
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </nav>

            {/* CTA */}
            <div className="border-t border-gray-100 p-4">
              <Link
                href="/registrar-negocio"
                onClick={() => setOpen(false)}
                className="block w-full rounded-xl bg-green-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-900 transition-colors"
              >
                Agregar mi negocio
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
