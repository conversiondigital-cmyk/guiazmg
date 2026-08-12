"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Mail, Loader2, Check } from "@/lib/icons"
import { Button } from "@/components/ui/button"

// Pantalla POSTERIOR al registro con correo, cuando la verificación es obligatoria:
// la cuenta ya se creó pero NO se puede entrar hasta activar por el enlace. Le dice
// al usuario que revise su correo (y spam) y le deja reenviar el enlace. Sin esto,
// tras registrarse caía en el login sin ninguna pista de qué hacer.
function VerificaCorreoContent() {
  const params = useSearchParams()
  const email = params.get("email") || ""
  const cb = params.get("callbackUrl") || ""
  const loginHref = cb ? `/auth/login?callbackUrl=${encodeURIComponent(cb)}` : "/auth/login"

  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Cuenta regresiva del cooldown para no permitir reenvíos en ráfaga.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const resend = async () => {
    if (!email) {
      toast.error("No tenemos tu correo a la mano. Vuelve a registrarte o inicia sesión.")
      return
    }
    setResending(true)
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      toast.success("Te reenviamos el enlace. Revisa tu correo (y spam).")
      setCooldown(30)
    } catch {
      toast.error("No se pudo reenviar. Inténtalo de nuevo en un momento.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <Link href="/" className="mb-6 inline-flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Guía ZMG" className="h-9 w-auto" />
        </Link>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f4ee]">
          <Mail className="h-7 w-7 text-[#006c49]" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-gray-900">Revisa tu correo</h1>
        <p className="mt-2 text-sm text-gray-600">
          {email ? (
            <>
              Te enviamos un enlace de activación a{" "}
              <strong className="text-gray-900">{email}</strong>. Ábrelo para activar tu cuenta y
              poder iniciar sesión.
            </>
          ) : (
            <>Te enviamos un enlace de activación. Ábrelo para activar tu cuenta y poder iniciar sesión.</>
          )}
        </p>

        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
          ¿No lo ves en unos minutos? Revisa la carpeta de <strong>spam o correo no deseado</strong>.
          El enlace vence en 24 horas.
        </div>

        <Button
          onClick={resend}
          disabled={resending || cooldown > 0}
          variant="outline"
          className="mt-5 w-full"
          size="lg"
        >
          {resending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : cooldown > 0 ? (
            `Reenviar enlace (${cooldown}s)`
          ) : (
            "Reenviar enlace de activación"
          )}
        </Button>

        <Link
          href={loginHref}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-[#006c49] hover:underline"
        >
          <Check className="h-4 w-4" /> Ya la activé — iniciar sesión
        </Link>
      </div>
    </div>
  )
}

export default function VerificaCorreoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        </div>
      }
    >
      <VerificaCorreoContent />
    </Suspense>
  )
}
