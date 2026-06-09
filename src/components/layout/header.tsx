"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { UserNav } from "@/components/layout/user-nav"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { MobileNav } from "@/components/layout/mobile-nav"
import { MapPin, ChevronDown, User } from "lucide-react"
import { useState } from "react"

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/search", label: "Categorías", hasDropdown: true },
  { href: "/promociones", label: "Promociones" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
]

export function Header() {
  const { data: session } = useSession()
  const [activeNav, setActiveNav] = useState("Inicio")

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-800 text-white">
            <MapPin className="h-4 w-4 fill-current" />
          </div>
          <div className="leading-none">
            <span className="text-lg font-black text-green-800">Guía ZMG</span>
            <p className="text-[9px] text-gray-400 font-medium -mt-0.5">Tu guía local de negocios</p>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setActiveNav(link.label)}
              className={`flex items-center gap-0.5 px-3 py-1.5 text-sm font-medium transition-colors relative
                ${activeNav === link.label
                  ? "text-green-800"
                  : "text-gray-600 hover:text-green-800"
                }`}
            >
              {link.label}
              {link.hasDropdown && <ChevronDown className="h-3.5 w-3.5" />}
              {activeNav === link.label && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-amber-500" />
              )}
            </Link>
          ))}
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
                href="/registrar-negocio"
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
