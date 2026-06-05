"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { SearchBar } from "@/components/layout/search-bar"
import { UserNav } from "@/components/layout/user-nav"
import { MobileNav } from "@/components/layout/mobile-nav"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
          <span className="text-blue-600">Guía</span>
          <span>ZMG</span>
        </Link>

        <div className="hidden sm:flex flex-1 max-w-2xl mx-auto">
          <SearchBar />
        </div>

        <nav className="hidden lg:flex items-center gap-4 shrink-0">
          <Link
            href="/search"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Buscar
          </Link>
          <Link
            href="/planes"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Planes
          </Link>
          {session ? (
            <div className="flex items-center gap-1">
              <NotificationDropdown />
              <UserNav user={session.user} />
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden shrink-0">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {session ? "Dashboard" : "Entrar"}
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
