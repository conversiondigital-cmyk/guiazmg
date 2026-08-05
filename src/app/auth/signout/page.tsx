"use client"

import { useState } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut } from "@/lib/icons"

// Página de cierre de sesión con el tema del sitio (reemplaza la pantalla oscura
// por defecto de NextAuth, cableada vía pages.signOut en src/lib/auth.ts). El
// cierre normal desde el menú del header usa signOut() directo y no pasa por
// aquí; esta página aplica cuando se navega directo a /api/auth/signout.
export default function SignOutPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <Link href="/" className="mb-6 inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Guía ZMG" className="h-9 w-auto" />
        </Link>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <LogOut className="h-5 w-5 text-green-700" />
        </div>

        <h1 className="text-xl font-bold text-gray-900">¿Cerrar sesión?</h1>
        <p className="mt-2 text-sm text-gray-500">
          Saldrás de tu cuenta de Guía ZMG en este dispositivo.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={() => {
              setLoading(true)
              signOut({ callbackUrl: "/" })
            }}
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cerrar sesión"}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Cancelar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
