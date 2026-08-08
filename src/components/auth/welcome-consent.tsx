"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, Check, Mail } from "@/lib/icons"
import { User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

// Pantalla de bienvenida para el registro con Google: confirma los datos que
// llegaron de Google (nombre y correo) y captura la aceptación de términos, que
// ese flujo no pide. Al aceptar, entra a su cuenta.
export function WelcomeConsent({
  name,
  email,
  next,
}: {
  name: string | null
  email: string
  next: string
}) {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!accepted) return
    setLoading(true)
    try {
      const res = await fetch("/api/user/accept-terms", { method: "POST" })
      if (!res.ok) throw new Error()
      router.push(next)
      router.refresh()
    } catch {
      toast.error("No se pudo continuar. Inténtalo de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Guía ZMG" className="mx-auto h-9 w-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">¡Bienvenido a Guía ZMG!</h1>
          <p className="mt-1 text-sm text-gray-500">Confirma tus datos para terminar de crear tu cuenta.</p>
        </div>

        {/* Datos que llegaron de Google */}
        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
          <div className="flex items-center gap-3 text-sm">
            <UserIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-gray-500">Nombre</span>
            <span className="ml-auto font-medium text-gray-900">{name || "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-gray-500">Correo</span>
            <span className="ml-auto font-medium text-gray-900">{email}</span>
          </div>
        </div>

        {/* Aclaración: crear cuenta es gratis */}
        <p className="mt-4 rounded-lg bg-[#ecfdf5] px-3 py-2 text-xs text-[#00583b]">
          Crear tu cuenta es <strong>gratis</strong>. Solo pagas si más adelante registras un
          <strong> negocio o emprendimiento</strong> con un plan.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span>
            Acepto los{" "}
            <Link href="/terminos-condiciones" target="_blank" className="font-medium text-green-700 hover:underline">
              Términos
            </Link>{" "}
            y el{" "}
            <Link href="/aviso-privacidad" target="_blank" className="font-medium text-green-700 hover:underline">
              Aviso de Privacidad
            </Link>
            .
          </span>
        </label>

        <Button onClick={submit} disabled={!accepted || loading} className="mt-5 w-full" size="lg">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          Aceptar y continuar
        </Button>
      </div>
    </div>
  )
}
