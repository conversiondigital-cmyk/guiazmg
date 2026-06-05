"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Menu, X } from "@/lib/icons"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-gray-600 hover:text-gray-900"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-72 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setOpen(false)}>
                <span className="text-blue-600">Guía</span>
                <span>ZMG</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                Buscar negocios
              </Link>
              <Link
                href="/planes"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                Planes
              </Link>
              <hr className="my-2" />
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/business"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Mis negocios
                  </Link>
                  <Link
                    href="/dashboard/favorites"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Favoritos
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Configuración
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              )}
              <hr className="my-2" />
              <Link
                href="/dashboard/business/new"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                Registrar negocio
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
